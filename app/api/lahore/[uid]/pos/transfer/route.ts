import pool from "@/config/db";
import { resolveFirebaseUser } from "@/lib/auth/resolve-firebase-user";
import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";

type Office = "lahore" | "karachi";
type RouteContext = { params: Promise<{ uid: string }> };
const positiveId = (value: unknown) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
};

const amount = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? Number(value)
    : Number.NaN;

export const createTransferHandlers = (office: Office) => {
  async function authorize(req: NextRequest, context: RouteContext) {
    const resolved = await resolveFirebaseUser(req);
    if (!resolved.ok) return { response: resolved.response };

    const { uid } = await context.params;
    if (positiveId(uid) !== resolved.user.id) {
      return {
        response: NextResponse.json(
          { message: "User does not match the signed-in account" },
          { status: 403 },
        ),
      };
    }

    const result = await pool.query<{
      office_id: number;
      pos_assigned: boolean | null;
    }>(
      `SELECT o.id AS office_id, u.pos_assigned
         FROM public.offices o
         JOIN public.users u ON u.id = $2
        WHERE o.code = $1`,
      [office, resolved.user.id],
    );
    const row = result.rows[0];
    if (!row) {
      return {
        response: NextResponse.json(
          { message: "Office not found" },
          { status: 404 },
        ),
      };
    }

    const isAdmin =
      resolved.user.full_access === true ||
      resolved.user.designation === "Owner";
    if (
      (!isAdmin && resolved.user.office_id !== row.office_id) ||
      (!isAdmin &&
        resolved.user.designation !== "Store Manager" &&
        !row.pos_assigned)
    ) {
      return {
        response: NextResponse.json(
          {
            message: "You do not have access to this office's stock transfers",
          },
          { status: 403 },
        ),
      };
    }

    return { userId: resolved.user.id, officeId: row.office_id };
  }

  async function GET(req: NextRequest, context: RouteContext) {
    try {
      const access = await authorize(req, context);
      if (access.response) return access.response;

      const view = req.nextUrl.searchParams.get("view");
      if (view === "count") {
        const count = await pool.query<{ count: string }>(
          `SELECT COUNT(*) AS count FROM public.stock_transfers
            WHERE target_office_id = $1 AND merged = FALSE`,
          [access.officeId],
        );
        return NextResponse.json({
          pending_count: Number(count.rows[0].count),
        });
      }

      const result = await pool.query(
        `SELECT t.id, t.source_office_id, t.target_office_id,
                t.inventory_id, t.user_id, t.qty, t.created_at,
                o.code AS source_office,
                i.name, i.serial_no, i.model, i.power, i.unit,
                i.chinese_name, i.price, i.buying, i.remarks
           FROM public.stock_transfers t
           JOIN public.offices o ON o.id = t.source_office_id
           JOIN public.inventory i ON i.id = t.inventory_id
          WHERE t.target_office_id = $1 AND t.merged = FALSE
          ORDER BY t.created_at ASC, t.id ASC`,
        [access.officeId],
      );
      if (view === "overview") {
        const [sent, offices] = await Promise.all([
          pool.query(
            `SELECT t.id, t.source_office_id, t.target_office_id,
                    t.inventory_id, t.destination_inventory_id,
                    t.qty, t.created_at, t.merged, t.merged_at,
                    o.code AS target_office, i.name, i.serial_no
               FROM public.stock_transfers t
               JOIN public.offices o ON o.id = t.target_office_id
               JOIN public.inventory i ON i.id = t.inventory_id
              WHERE t.source_office_id = $1
              ORDER BY t.created_at DESC, t.id DESC`,
            [access.officeId],
          ),
          pool.query(
            `SELECT id, code, name FROM public.offices
              WHERE id <> $1 ORDER BY name`,
            [access.officeId],
          ),
        ]);
        return NextResponse.json({
          pending: result.rows,
          sent: sent.rows,
          offices: offices.rows,
        });
      }
      return NextResponse.json(result.rows);
    } catch (error) {
      console.error("Error listing stock transfers:", error);
      return NextResponse.json(
        { message: "Unable to load pending transfers" },
        { status: 500 },
      );
    }
  }

  async function POST(req: NextRequest, context: RouteContext) {
    let client: PoolClient | undefined;
    try {
      const access = await authorize(req, context);
      if (access.response) return access.response;

      const body = await req.json();
      const inventoryId = positiveId(body?.inventory_id);
      const targetOfficeId = positiveId(body?.target_office_id);
      const qty = amount(body?.qty);
      if (
        !inventoryId ||
        !targetOfficeId ||
        !Number.isSafeInteger(qty) ||
        qty <= 0 ||
        qty > 2147483647
      ) {
        return NextResponse.json(
          {
            message:
              "Valid inventory, target office, and whole-number quantity are required",
          },
          { status: 400 },
        );
      }
      if (targetOfficeId === access.officeId) {
        return NextResponse.json(
          { message: "Source and target offices must differ" },
          { status: 400 },
        );
      }

      client = await pool.connect();
      await client.query("BEGIN");
      const target = await client.query(
        "SELECT id FROM public.offices WHERE id = $1",
        [targetOfficeId],
      );
      if (!target.rowCount) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { message: "Target office not found" },
          { status: 404 },
        );
      }

      const deducted = await client.query(
        `UPDATE public.inventory
            SET qty = qty - $1
          WHERE id = $2 AND office = $3 AND qty >= $1
          RETURNING id`,
        [qty, inventoryId, office],
      );
      if (!deducted.rowCount) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { message: "Source item not found or insufficient stock" },
          { status: 409 },
        );
      }

      const transfer = await client.query(
        `INSERT INTO public.stock_transfers
           (source_office_id, target_office_id, inventory_id, user_id, qty)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [access.officeId, targetOfficeId, inventoryId, access.userId, qty],
      );
      await client.query("COMMIT");
      return NextResponse.json(transfer.rows[0], { status: 201 });
    } catch (error) {
      await client?.query("ROLLBACK");
      console.error("Error sending stock transfer:", error);
      return NextResponse.json(
        { message: "Unable to send stock transfer" },
        { status: 500 },
      );
    } finally {
      client?.release();
    }
  }

  async function PATCH(req: NextRequest, context: RouteContext) {
    let client: PoolClient | undefined;
    try {
      const access = await authorize(req, context);
      if (access.response) return access.response;

      const body = await req.json();
      const transferId = positiveId(body?.transfer_id);
      const destinationInventoryId = positiveId(body?.destination_inventory_id);
      const creatingNew = body?.create_new === true;
      if (
        !transferId ||
        Number(Boolean(destinationInventoryId)) + Number(creatingNew) !== 1
      ) {
        return NextResponse.json(
          { message: "Select an existing item or provide a new item" },
          { status: 400 },
        );
      }

      client = await pool.connect();
      await client.query("BEGIN");
      const transfer = await client.query<{
        qty: string;
        merged: boolean;
        target_office_id: number;
        inventory_id: number;
      }>(
        `SELECT qty, merged, target_office_id, inventory_id
           FROM public.stock_transfers
          WHERE id = $1 FOR UPDATE`,
        [transferId],
      );
      const pending = transfer.rows[0];
      if (
        !pending ||
        pending.target_office_id !== access.officeId ||
        pending.merged
      ) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { message: "Pending transfer not found for this office" },
          { status: 409 },
        );
      }

      const receivedQty = Number(pending.qty);
      if (!Number.isSafeInteger(receivedQty) || receivedQty <= 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { message: "Transfer quantity must be a whole number" },
          { status: 409 },
        );
      }

      let receivedInventoryId = destinationInventoryId;
      if (creatingNew) {
        const copyable = await client.query<{ attname: string }>(
          `SELECT attname FROM pg_attribute
            WHERE attrelid = 'public.inventory'::regclass
              AND attnum > 0 AND NOT attisdropped
              AND attgenerated = '' AND attidentity = ''
              AND attname NOT IN
                ('id', 'qty', 'office', 'office_id', 'created_at', 'updated_at')
            ORDER BY attnum`,
        );
        const columns = copyable.rows.map(
          ({ attname }) => `"${attname.replaceAll('"', '""')}"`,
        );
        const created = await client.query<{ id: number }>(
          `INSERT INTO public.inventory (${[...columns, '"qty"', '"office"'].join(', ')})
           SELECT ${[...columns, '$1', '$2'].join(', ')}
             FROM public.inventory WHERE id = $3
           RETURNING id`,
          [receivedQty, office, pending.inventory_id],
        );
        if (!created.rowCount) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { message: "Source inventory item no longer exists" },
            { status: 409 },
          );
        }
        receivedInventoryId = created.rows[0].id;
      } else {
        const updated = await client.query(
          `UPDATE public.inventory
              SET qty = qty + $1
            WHERE id = $2 AND office = $3
            RETURNING id`,
          [receivedQty, destinationInventoryId, office],
        );
        if (!updated.rowCount) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { message: "Destination item not found for this office" },
            { status: 409 },
          );
        }
      }

      const merged = await client.query(
        `UPDATE public.stock_transfers
            SET merged = TRUE, destination_inventory_id = $1,
                merged_by = $2, merged_at = NOW()
          WHERE id = $3
          RETURNING *`,
        [receivedInventoryId, access.userId, transferId],
      );
      await client.query("COMMIT");
      return NextResponse.json(merged.rows[0]);
    } catch (error) {
      await client?.query("ROLLBACK");
      console.error("Error receiving stock transfer:", error);
      return NextResponse.json(
        { message: "Unable to receive stock transfer" },
        { status: 500 },
      );
    } finally {
      client?.release();
    }
  }

  return { GET, POST, PATCH };
};

export const { GET, POST, PATCH } = createTransferHandlers("lahore");
