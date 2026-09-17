import pool from "@/config/db";
import { NextResponse } from "next/server";

type Office = "lahore" | "karachi";

type PartsReceivingInput = Record<string, unknown>;

const SELECT_PARTS_RECEIVING = `
  SELECT
    pr.*,
    c.name AS customer_name,
    c.number AS customer_contact,
    c.location AS customer_location,
    s.serial_no AS linked_sale_serial,
    s.power AS linked_sale_power,
    s.source AS linked_sale_source,
    s.order_no_arr AS linked_sale_order_no_arr,
    cp.id AS china_part_id,
    cp.send_to_china,
    cp.sent_to_china_at,
    cp.received_from_china_at,
    pti.id AS trade_in_id,
    pti.part_name AS trade_in_part_name,
    pti.part_model AS trade_in_part_model,
    pti.part_qty AS trade_in_part_qty,
    pti.part_serial AS trade_in_part_serial,
    pti.warranty_status AS trade_in_warranty_status,
    pti.delivered_by AS trade_in_delivered_by,
    pti.delivery_date AS trade_in_delivery_date,
    pti.remarks AS trade_in_remarks,
    COALESCE(lab_tasks.tasks, '[]'::json) AS lab_tasks
  FROM parts_receiving pr
  INNER JOIN customer c ON c.id = pr.customer_id
  LEFT JOIN sale s ON s.id = pr.sale_id
  LEFT JOIN china_parts cp
    ON cp.parts_receiving_id = pr.id
    AND cp.managing_office = pr.managing_office
  LEFT JOIN part_trade_ins pti ON pti.parts_receiving_id = pr.id
  LEFT JOIN LATERAL (
    SELECT json_agg(
      json_build_object(
        'id', lt.id,
        'status', lt.status,
        'priority', lt.priority,
        'assign_date', lt.assign_date,
        'deliver_date', lt.deliver_date,
        'user_id', lt.user_id,
        'user_name', task_user.name,
        'charges', lt.charges
      )
      ORDER BY lt.assign_date DESC NULLS LAST, lt.id DESC
    ) AS tasks
    FROM lab_tasks lt
    LEFT JOIN users task_user ON task_user.id = lt.user_id
    WHERE lt.parts_receiving_id = pr.id
  ) lab_tasks ON TRUE
`;

const INSERTABLE_FIELDS = [
  "customer_id",
  "sale_id",
  "manual_machine_order_no",
  "manual_machine_serial",
  "manual_machine_model",
  "part_name",
  "part_model",
  "part_qty",
  "part_problem",
  "normal",
  "damaged",
  "incomplete",
  "accessories",
  "overheated",
  "non_repairable",
  "physically_broken",
  "water_damage",
  "previously_repaired",
  "other_condition",
  "part_serial",
  "part_img",
  "warranty_status",
  "part_accessories",
  "delivery_method",
  "received_by_id",
  "receiving_date",
  "expected_return",
  "is_trade_in",
] as const;

const BOOLEAN_FIELDS = new Set([
  "normal",
  "damaged",
  "incomplete",
  "accessories",
  "overheated",
  "non_repairable",
  "physically_broken",
  "water_damage",
  "previously_repaired",
  "is_trade_in",
]);

function hasOwn(input: PartsReceivingInput, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function nullableText(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim();
}

function nullableNumber(value: unknown, field: string) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }

  return number;
}

function requiredNumber(value: unknown, field: string) {
  const number = nullableNumber(value, field);
  if (!number) throw new Error(`${field} is required`);
  return number;
}

function requiredText(value: unknown, field: string) {
  const text = nullableText(value);
  if (!text) throw new Error(`${field} is required`);
  return text;
}

function normalizeInput(input: PartsReceivingInput, partial = false) {
  const output: Record<string, unknown> = {};

  for (const field of INSERTABLE_FIELDS) {
    if (partial && !hasOwn(input, field)) continue;

    const value = input[field];

    if (field === "customer_id") {
      output[field] = requiredNumber(value, field);
    } else if (field === "sale_id" || field === "received_by_id") {
      output[field] = nullableNumber(value, field);
    } else if (field === "part_qty") {
      const quantity = Number(value);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("part_qty must be greater than zero");
      }
      output[field] = quantity;
    } else if (field === "part_name") {
      output[field] = requiredText(value, field);
    } else if (BOOLEAN_FIELDS.has(field)) {
      if (typeof value !== "boolean") {
        throw new Error(`${field} must be a boolean`);
      }
      output[field] = value;
    } else {
      output[field] = nullableText(value);
    }
  }

  return output;
}

async function validateCustomerAndSale(
  customerId: number,
  saleId: number | null,
) {
  const customer = await pool.query("SELECT id FROM customer WHERE id = $1", [
    customerId,
  ]);

  if (!customer.rows[0]) {
    throw new Error("Selected customer was not found");
  }

  if (saleId === null) return;

  const sale = await pool.query(
    "SELECT id FROM sale WHERE id = $1 AND customer_id = $2",
    [saleId, customerId],
  );

  if (!sale.rows[0]) {
    throw new Error("Selected sale does not belong to the selected customer");
  }
}

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Something went wrong";
  return NextResponse.json({ message }, { status: 400 });
}

export function createPartsReceivingHandlers(office: Office) {
  return {
    async list(searchParams: URLSearchParams) {
      try {
        const values: Array<string | number> = [office];
        const filters = ["pr.managing_office = $1"];
        const customerId = searchParams.get("customer_id");
        const saleId = searchParams.get("sale_id");
        const search = searchParams.get("search")?.trim();

        if (customerId) {
          values.push(requiredNumber(customerId, "customer_id"));
          filters.push(`pr.customer_id = $${values.length}`);
        }

        if (saleId) {
          values.push(requiredNumber(saleId, "sale_id"));
          filters.push(`pr.sale_id = $${values.length}`);
        }

        if (search) {
          values.push(`%${search}%`);
          filters.push(`(
            pr.part_name ILIKE $${values.length}
            OR COALESCE(pr.part_model, '') ILIKE $${values.length}
            OR COALESCE(pr.manual_machine_serial, '') ILIKE $${values.length}
            OR c.name ILIKE $${values.length}
          )`);
        }

        const result = await pool.query(
          `${SELECT_PARTS_RECEIVING}
           WHERE ${filters.join(" AND ")}
           ORDER BY pr.receiving_date DESC, pr.id DESC`,
          values,
        );

        return NextResponse.json(result.rows);
      } catch (error) {
        return errorResponse(error);
      }
    },

    async detail(id: string) {
      try {
        const receiptId = requiredNumber(id, "id");
        const result = await pool.query(
          `${SELECT_PARTS_RECEIVING}
           WHERE pr.id = $1 AND pr.managing_office = $2`,
          [receiptId, office],
        );

        if (!result.rows[0]) {
          return NextResponse.json(
            { message: "Parts receipt not found" },
            { status: 404 },
          );
        }

        return NextResponse.json(result.rows[0]);
      } catch (error) {
        return errorResponse(error);
      }
    },

    async create(input: PartsReceivingInput) {
      const client = await pool.connect();
      try {
        const data = normalizeInput(input);
        const customerId = data.customer_id as number;
        const saleId = (data.sale_id as number | null) ?? null;
        const receivedById = (data.received_by_id as number | null) ?? null;
        const labTask = input.lab_task as Record<string, unknown> | undefined;
        if (
          hasOwn(input, "send_to_china") &&
          typeof input.send_to_china !== "boolean"
        ) {
          throw new Error("send_to_china must be a boolean");
        }
        const sendToChina = input.send_to_china === true;

        await validateCustomerAndSale(customerId, saleId);

        const assignedTo = nullableNumber(labTask?.user_id, "assigned_to");
        const charges = Number(labTask?.charges);
        const priority = String(labTask?.priority || "").toLowerCase();
        const expectedReturn = data.expected_return as string | null;

        if (
          !receivedById ||
          !assignedTo ||
          !expectedReturn ||
          !Number.isFinite(charges) ||
          charges < 0
        ) {
          throw new Error(
            "Received by, assigned to, expected return date, and estimated expenses are required",
          );
        }
        if (!["normal", "urgent", "critical"].includes(priority)) {
          throw new Error("Priority must be normal, urgent, or critical");
        }

        await client.query("BEGIN");

        // Serial and model are manually recorded only for receipts without a
        // matching machine sale. A linked sale remains the source of truth.
        if (saleId !== null) {
          data.manual_machine_order_no = null;
          data.manual_machine_serial = null;
          data.manual_machine_model = null;
        }

        const fields = [...INSERTABLE_FIELDS, "managing_office"];
        const values = [
          ...INSERTABLE_FIELDS.map((field) => data[field]),
          office,
        ];
        const placeholders = values
          .map((_, index) => `$${index + 1}`)
          .join(", ");

        const result = await client.query(
          `INSERT INTO parts_receiving (${fields.join(", ")})
           VALUES (${placeholders})
           RETURNING *`,
          values,
        );

        const receipt = result.rows[0];
        if (sendToChina) {
          await client.query(
            `INSERT INTO china_parts (
               parts_receiving_id, send_to_china, managing_office
             ) VALUES ($1, TRUE, $2)`,
            [receipt.id, office],
          );
        }
        const taskResult = await client.query(
          `INSERT INTO lab_tasks (
             customer_id, user_id, parts_receiving_id, priority,
             assign_date, deliver_date, charges, remarks, status, managing_office
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
           RETURNING *`,
          [
            customerId,
            assignedTo,
            receipt.id,
            priority,
            data.receiving_date,
            expectedReturn,
            charges,
            data.part_problem || `Repair received part: ${data.part_name}`,
            office,
          ],
        );

        await client.query("COMMIT");

        return NextResponse.json(
          { ...receipt, lab_task: taskResult.rows[0] },
          { status: 201 },
        );
      } catch (error) {
        await client.query("ROLLBACK");
        return errorResponse(error);
      } finally {
        client.release();
      }
    },

    async update(id: string, input: PartsReceivingInput) {
      try {
        const receiptId = requiredNumber(id, "id");
        const existingResult = await pool.query(
          "SELECT * FROM parts_receiving WHERE id = $1 AND managing_office = $2",
          [receiptId, office],
        );
        const existing = existingResult.rows[0];

        if (!existing) {
          return NextResponse.json(
            { message: "Parts receipt not found" },
            { status: 404 },
          );
        }

        const labTaskInput = input.lab_task;
        const labTaskUpdate =
          labTaskInput && typeof labTaskInput === "object"
            ? (labTaskInput as Record<string, unknown>)
            : null;

        const labTaskValues = labTaskUpdate
          ? {
              user_id: requiredNumber(
                labTaskUpdate.user_id,
                "lab_task.user_id",
              ),
              priority: (() => {
                const value = nullableText(labTaskUpdate.priority);
                if (
                  value !== "normal" &&
                  value !== "urgent" &&
                  value !== "critical"
                ) {
                  throw new Error(
                    "lab_task.priority must be normal, urgent, or critical",
                  );
                }
                return value;
              })(),
              charges: (() => {
                const value = Number(labTaskUpdate.charges);
                if (!Number.isFinite(value) || value < 0) {
                  throw new Error("lab_task.charges must be zero or greater");
                }
                return value;
              })(),
              remarks: nullableText(labTaskUpdate.remarks),
              deliver_date: nullableText(labTaskUpdate.deliver_date),
            }
          : null;

        const data = normalizeInput(input, true);
        if (!Object.keys(data).length) {
          return NextResponse.json(
            { message: "No valid data provided for update" },
            { status: 400 },
          );
        }

        const customerId =
          (data.customer_id as number | undefined) ?? existing.customer_id;
        const saleId = hasOwn(data, "sale_id")
          ? ((data.sale_id as number | null) ?? null)
          : existing.sale_id;

        await validateCustomerAndSale(customerId, saleId);

        // Switching to a linked sale clears any manual machine identifiers.
        if (saleId !== null) {
          data.manual_machine_order_no = null;
          data.manual_machine_serial = null;
          data.manual_machine_model = null;
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const assignments = fields.map(
          (field, index) => `${field} = $${index + 1}`,
        );

        const result = await pool.query(
          `UPDATE parts_receiving
           SET ${assignments.join(", ")}
           WHERE id = $${values.length + 1} AND managing_office = $${values.length + 2}
           RETURNING *`,
          [...values, receiptId, office],
        );

        if (labTaskValues) {
          await pool.query(
            `UPDATE lab_tasks
             SET user_id = $1,
                 priority = $2,
                 charges = $3,
                 remarks = $4,
                 deliver_date = $5
             WHERE id = (
               SELECT id
               FROM lab_tasks
               WHERE parts_receiving_id = $6 AND managing_office = $7
               ORDER BY assign_date DESC NULLS LAST, id DESC
               LIMIT 1
             )`,
            [
              labTaskValues.user_id,
              labTaskValues.priority,
              labTaskValues.charges,
              labTaskValues.remarks,
              labTaskValues.deliver_date,
              receiptId,
              office,
            ],
          );
        }

        return NextResponse.json(result.rows[0]);
      } catch (error) {
        return errorResponse(error);
      }
    },
  };
}
