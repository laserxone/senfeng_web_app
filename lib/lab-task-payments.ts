import pool from "@/config/db";
import { NextResponse } from "next/server";

type Office = "lahore" | "karachi";
type PaymentInput = Record<string, unknown>;

const PAYMENT_FIELDS = [
  "amount",
  "mode",
  "note",
  "received_by",
  "transaction_date",
  "clearance_date",
  "image",
  "remarks",
  "cheque_id",
  "status",
  "comment",
  "payment_lock",
] as const;

const PAYMENT_STATUSES = new Set(["pending", "approved", "rejected"]);

function hasOwn(input: PaymentInput, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function nullableText(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim();
}

function requiredText(value: unknown, field: string) {
  const text = nullableText(value);
  if (!text) throw new Error(`${field} is required`);
  return text;
}

function positiveId(value: string, field: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return id;
}

function normalizePayment(input: PaymentInput, partial = false) {
  const output: Record<string, unknown> = {};

  for (const field of PAYMENT_FIELDS) {
    if (partial && !hasOwn(input, field)) continue;

    const value = input[field];

    if (field === "amount") {
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("amount must be greater than zero");
      }
      output[field] = amount;
    } else if (
      field === "mode" ||
      field === "note" ||
      field === "received_by"
    ) {
      output[field] = requiredText(value, field);
    } else if (field === "status") {
      if (value === undefined || value === null || value === "") {
        output[field] = "pending";
        continue;
      }
      const status = requiredText(value, field).toLowerCase();
      if (!PAYMENT_STATUSES.has(status)) {
        throw new Error("status must be pending, approved, or rejected");
      }
      output[field] = status;
    } else if (field === "payment_lock") {
      if (value === undefined || value === null) {
        output[field] = false;
        continue;
      }
      if (typeof value !== "boolean") {
        throw new Error("payment_lock must be a boolean");
      }
      output[field] = value;
    } else if (field === "transaction_date") {
      output[field] = nullableText(value) ?? new Date().toISOString();
    } else {
      output[field] = nullableText(value);
    }
  }

  const mode = String(output.mode ?? input.mode ?? "").toLowerCase();
  const chequeId = output.cheque_id ?? input.cheque_id;
  if (mode === "cheque" && !nullableText(chequeId)) {
    throw new Error("cheque_id is required when mode is Cheque");
  }

  return output;
}

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Something went wrong";
  return NextResponse.json({ message }, { status: 400 });
}

async function findLabTask(id: string, office: Office) {
  const labTaskId = positiveId(id, "lab_task_id");
  const result = await pool.query(
    "SELECT id FROM lab_tasks WHERE id = $1 AND managing_office = $2",
    [labTaskId, office],
  );

  if (!result.rows[0]) {
    return { labTaskId, exists: false };
  }

  return { labTaskId, exists: true };
}

export function createLabTaskPaymentHandlers(office: Office) {
  return {
    async list(labTaskId: string) {
      try {
        const task = await findLabTask(labTaskId, office);
        if (!task.exists) {
          return NextResponse.json(
            { message: "Lab task not found" },
            { status: 404 },
          );
        }

        const result = await pool.query(
          `SELECT *
           FROM lab_task_payments
           WHERE lab_task_id = $1
           ORDER BY transaction_date DESC, created_at DESC, id DESC`,
          [task.labTaskId],
        );

        return NextResponse.json(result.rows);
      } catch (error) {
        return errorResponse(error);
      }
    },

    async create(labTaskId: string, input: PaymentInput) {
      try {
        const task = await findLabTask(labTaskId, office);
        if (!task.exists) {
          return NextResponse.json(
            { message: "Lab task not found" },
            { status: 404 },
          );
        }

        const data = normalizePayment(input);
        const fields = ["lab_task_id", ...PAYMENT_FIELDS];
        const values = [
          task.labTaskId,
          ...PAYMENT_FIELDS.map((field) => data[field]),
        ];
        const placeholders = values
          .map((_, index) => `$${index + 1}`)
          .join(", ");

        const result = await pool.query(
          `INSERT INTO lab_task_payments (${fields.join(", ")})
           VALUES (${placeholders})
           RETURNING *`,
          values,
        );

        return NextResponse.json(result.rows[0], { status: 201 });
      } catch (error) {
        return errorResponse(error);
      }
    },

    async update(labTaskId: string, paymentId: string, input: PaymentInput) {
      try {
        const task = await findLabTask(labTaskId, office);
        if (!task.exists) {
          return NextResponse.json(
            { message: "Lab task not found" },
            { status: 404 },
          );
        }

        const id = positiveId(paymentId, "payment_id");
        const existingResult = await pool.query(
          "SELECT * FROM lab_task_payments WHERE id = $1 AND lab_task_id = $2",
          [id, task.labTaskId],
        );
        const existing = existingResult.rows[0];

        if (!existing) {
          return NextResponse.json(
            { message: "Lab payment not found" },
            { status: 404 },
          );
        }

        const data = normalizePayment(input, true);
        if (!Object.keys(data).length) {
          return NextResponse.json(
            { message: "No valid data provided for update" },
            { status: 400 },
          );
        }

        const mode = String(data.mode ?? existing.mode).toLowerCase();
        const chequeId = data.cheque_id ?? existing.cheque_id;
        if (mode === "cheque" && !nullableText(chequeId)) {
          return NextResponse.json(
            { message: "cheque_id is required when mode is Cheque" },
            { status: 400 },
          );
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const assignments = fields.map(
          (field, index) => `${field} = $${index + 1}`,
        );

        const result = await pool.query(
          `UPDATE lab_task_payments
           SET ${assignments.join(", ")}
           WHERE id = $${values.length + 1} AND lab_task_id = $${values.length + 2}
           RETURNING *`,
          [...values, id, task.labTaskId],
        );

        return NextResponse.json(result.rows[0]);
      } catch (error) {
        return errorResponse(error);
      }
    },

    async remove(labTaskId: string, paymentId: string) {
      try {
        const task = await findLabTask(labTaskId, office);
        if (!task.exists) {
          return NextResponse.json(
            { message: "Lab task not found" },
            { status: 404 },
          );
        }

        const id = positiveId(paymentId, "payment_id");
        const result = await pool.query(
          "DELETE FROM lab_task_payments WHERE id = $1 AND lab_task_id = $2 RETURNING id",
          [id, task.labTaskId],
        );

        if (!result.rows[0]) {
          return NextResponse.json(
            { message: "Lab payment not found" },
            { status: 404 },
          );
        }

        return NextResponse.json({ message: "Lab payment deleted" });
      } catch (error) {
        return errorResponse(error);
      }
    },
  };
}
