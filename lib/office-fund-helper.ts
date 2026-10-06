import type { Pool, PoolClient } from "pg";

// Call these functions with the same PoolClient and open transaction used to
// insert or delete the source payment/expense. They never commit independently.
export type Office = "lahore" | "karachi";
export type FundSource = "pos_payment" | "office_expense";
export type FundAccount = "cash" | "bank";

type SourceRef = {
  office: Office;
  sourceType: FundSource;
  sourceId: number;
  actorId?: number | null;
};

type Entry = SourceRef & {
  mode: string;
  amount: string | number;
  invoiceId?: number | null;
};

export async function withOfficeFundTransaction<T>(
  pool: Pool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function accountForMode(mode: string, sourceType: FundSource): FundAccount {
  const normalized = mode.trim().toLowerCase();
  if (normalized === "cash") return "cash";
  if (sourceType === "office_expense" && normalized === "bank") return "bank";
  if (
    sourceType === "pos_payment" &&
    ["cheque", "deposit", "online", "pay order"].includes(normalized)
  ) {
    return "bank";
  }
  throw new Error(`Unsupported ${sourceType} mode: ${mode}`);
}

function centsFromAmount(
  value: string | number,
  allowNegative = false,
): bigint {
  const text = String(value).trim();
  const pattern = allowNegative
    ? /^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
    : /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
  if (!pattern.test(text))
    throw new Error("Amount must have at most two decimal places");
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = (negative ? text.slice(1) : text).split(".");
  const cents =
    BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0") || "0");
  if (!allowNegative && cents <= BigInt(0))
    throw new Error("Amount must be positive");
  if (cents > BigInt("999999999999999999"))
    throw new Error("Amount is out of range");
  return negative ? -cents : cents;
}

function amountFromCents(cents: bigint): string {
  const negative = cents < BigInt(0);
  const absolute = negative ? -cents : cents;
  return `${negative ? "-" : ""}${absolute / BigInt(100)}.${String(absolute % BigInt(100)).padStart(2, "0")}`;
}

function checkRef(ref: SourceRef) {
  if (!Number.isSafeInteger(ref.sourceId) || ref.sourceId <= 0) {
    throw new Error("A positive source ID is required");
  }
}

async function lockSource(client: PoolClient, ref: SourceRef) {
  checkRef(ref);
  // The caller's transaction holds this lock until commit or rollback.
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))",
    [ref.office, `${ref.sourceType}:${ref.sourceId}`],
  );
}

async function hasAddition(
  client: PoolClient,
  ref: SourceRef,
): Promise<boolean> {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM office_fund_movements
       WHERE office = $1 AND source_type = $2 AND source_id = $3
         AND kind IN ('pos_payment_added', 'office_expense_added')
     ) AS exists`,
    [ref.office, ref.sourceType, ref.sourceId],
  );
  return result.rows[0]?.exists === true;
}

async function writeMovement(
  client: PoolClient,
  ref: SourceRef,
  account: FundAccount,
  kind:
    | "pos_payment_added"
    | "office_expense_added"
    | "pos_payment_removed"
    | "office_expense_removed",
  delta: bigint,
  invoiceId?: number | null,
) {
  const amount = amountFromCents(delta);
  const result = await client.query(
    `WITH target AS (
       SELECT office, account FROM office_fund_balances
       WHERE office = $1 AND account = $2 FOR UPDATE
     ), movement AS (
       INSERT INTO office_fund_movements
         (office, account, source_type, source_id, invoice_id, kind, delta, created_by)
       SELECT target.office, target.account, $3, $4, $5, $6, $7::numeric, $8
       FROM target RETURNING office, account, delta
     )
     UPDATE office_fund_balances AS balance
     SET balance = balance.balance + movement.delta, updated_at = now()
     FROM movement
     WHERE balance.office = movement.office AND balance.account = movement.account
     RETURNING balance.balance`,
    [
      ref.office,
      account,
      ref.sourceType,
      ref.sourceId,
      invoiceId ?? null,
      kind,
      amount,
      ref.actorId ?? null,
    ],
  );
  if (result.rowCount !== 1)
    throw new Error("Office fund balance row is missing");
}

async function addEntry(
  client: PoolClient,
  entry: Entry,
  expectedSource: FundSource,
  kind: "pos_payment_added" | "office_expense_added",
  sign: bigint,
): Promise<boolean> {
  if (entry.sourceType !== expectedSource)
    throw new Error(`Expected ${expectedSource}`);
  await lockSource(client, entry);
  if (await hasAddition(client, entry)) return false;
  const account = accountForMode(entry.mode, expectedSource);
  const cents = centsFromAmount(entry.amount);
  await writeMovement(
    client,
    entry,
    account,
    kind,
    sign * cents,
    entry.invoiceId,
  );
  return true;
}

/** Credit an issued POS invoice payment. Returns false if already tracked. */
export async function creditOfficeFund(
  client: PoolClient,
  entry: Entry,
): Promise<boolean> {
  return addEntry(client, entry, "pos_payment", "pos_payment_added", BigInt(1));
}

/** Debit an office expense. Returns false if already tracked. */
export async function debitOfficeFund(
  client: PoolClient,
  entry: Entry,
): Promise<boolean> {
  return addEntry(
    client,
    entry,
    "office_expense",
    "office_expense_added",
    BigInt(-1),
  );
}

/** Reverse the net effect of a tracked payment or expense using its recorded movements.
 * Historical entries without an addition and entries already reversed return false.
 */
export async function reverseOfficeFund(
  client: PoolClient,
  ref: SourceRef,
): Promise<boolean> {
  await lockSource(client, ref);
  if (!(await hasAddition(client, ref))) return false;
  const result = await client.query<{
    account: FundAccount;
    net: string;
    invoice_id: number | null;
  }>(
    `SELECT account, SUM(delta)::text AS net, MAX(invoice_id) AS invoice_id
     FROM office_fund_movements
     WHERE office = $1 AND source_type = $2 AND source_id = $3
     GROUP BY account HAVING SUM(delta) <> 0`,
    [ref.office, ref.sourceType, ref.sourceId],
  );
  if (!result.rows.length) return false;
  if (result.rows.length !== 1) {
    throw new Error("Source has movements in multiple fund accounts");
  }
  const row = result.rows[0];
  const kind =
    ref.sourceType === "pos_payment"
      ? "pos_payment_removed"
      : "office_expense_removed";
  await writeMovement(
    client,
    ref,
    row.account,
    kind,
    -centsFromAmount(row.net, true),
    row.invoice_id,
  );
  return true;
}
