import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

const OFFICE = "karachi";
const error = (value: unknown) =>
  NextResponse.json(
    {
      message: value instanceof Error ? value.message : "Something went wrong",
    },
    { status: 400 },
  );
const text = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? null
    : String(value).trim();
function required(value: unknown, field: string) {
  const result = text(value);
  if (!result) throw new Error(`${field} is required`);
  return result;
}
function receiptId(value: string) {
  const result = Number(value);
  if (!Number.isInteger(result) || result <= 0)
    throw new Error("Invalid receipt id");
  return result;
}
function deliveryDate(value: unknown) {
  const result = new Date(String(value));
  if (Number.isNaN(result.getTime()))
    throw new Error("delivery_date is required");
  return result.toISOString();
}

async function verifiedReceipt(value: string) {
  const id = receiptId(value);
  const receipt = await pool.query(
    "SELECT id FROM parts_receiving WHERE id = $1 AND managing_office = $2 AND is_trade_in = TRUE",
    [id, OFFICE],
  );
  if (!receipt.rows[0]) throw new Error("Trade-in receipt not found");
  return id;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await pool.query(
      "SELECT * FROM part_trade_ins WHERE parts_receiving_id = $1",
      [await verifiedReceipt(id)],
    );
    return NextResponse.json(result.rows[0] ?? null);
  } catch (value) {
    return error(value);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sourceId = await verifiedReceipt(id);
    const input = await req.json();
    const quantity = Number(input.part_qty);
    if (!Number.isFinite(quantity) || quantity <= 0)
      throw new Error("part_qty must be greater than zero");
    const result = await pool.query(
      `INSERT INTO part_trade_ins (parts_receiving_id, part_name, part_model, part_qty, part_serial, part_img, warranty_status, part_accessories, delivered_by, delivery_date, remarks) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (parts_receiving_id) DO UPDATE SET part_name = EXCLUDED.part_name, part_model = EXCLUDED.part_model, part_qty = EXCLUDED.part_qty, part_serial = EXCLUDED.part_serial, part_img = EXCLUDED.part_img, warranty_status = EXCLUDED.warranty_status, part_accessories = EXCLUDED.part_accessories, delivered_by = EXCLUDED.delivered_by, delivery_date = EXCLUDED.delivery_date, remarks = EXCLUDED.remarks, updated_at = NOW() RETURNING *`,
      [
        sourceId,
        required(input.part_name, "part_name"),
        required(input.part_model, "part_model"),
        quantity,
        text(input.part_serial),
        text(input.part_img),
        required(input.warranty_status, "warranty_status"),
        text(input.part_accessories),
        required(input.delivered_by, "delivered_by"),
        deliveryDate(input.delivery_date),
        text(input.remarks),
      ],
    );
    return NextResponse.json(result.rows[0]);
  } catch (value) {
    return error(value);
  }
}
