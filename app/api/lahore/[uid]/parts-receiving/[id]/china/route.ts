import pool from "@/config/db";
import { NextRequest, NextResponse } from "next/server";

function invalid(error: unknown) {
  return NextResponse.json(
    {
      message: error instanceof Error ? error.message : "Something went wrong",
    },
    { status: 400 },
  );
}
function id(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new Error("Invalid parts receipt id");
  return parsed;
}
function date(value: unknown, field: string) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) throw new Error(`${field} is invalid`);
  return parsed.toISOString();
}

async function getChinaPart(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  office: "lahore" | "karachi",
) {
  try {
    const { id: value } = await params;
    const result = await pool.query(
      "SELECT * FROM china_parts WHERE parts_receiving_id = $1 AND managing_office = $2",
      [id(value), office],
    );
    return NextResponse.json(result.rows[0] ?? null);
  } catch (error) {
    return invalid(error);
  }
}

async function putChinaPart(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  office: "lahore" | "karachi",
) {
  try {
    const { id: value } = await params;
    const receiptId = id(value);
    const input = await req.json();
    const receipt = await pool.query(
      "SELECT id FROM parts_receiving WHERE id = $1 AND managing_office = $2",
      [receiptId, office],
    );
    if (!receipt.rows[0])
      return NextResponse.json(
        { message: "Parts receipt not found" },
        { status: 404 },
      );
    if (typeof input.send_to_china !== "boolean")
      throw new Error("send_to_china must be a boolean");
    const sentAt = input.send_to_china
      ? date(input.sent_to_china_at, "Sent to China date")
      : null;
    const receivedAt = input.send_to_china
      ? date(input.received_from_china_at, "Received from China date")
      : null;
    if (receivedAt && !sentAt)
      throw new Error(
        "A sent-to-China date is required before marking the part received",
      );
    const result = await pool.query(
      `INSERT INTO china_parts (parts_receiving_id, send_to_china, sent_to_china_at, received_from_china_at, managing_office) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (parts_receiving_id) DO UPDATE SET send_to_china = EXCLUDED.send_to_china, sent_to_china_at = EXCLUDED.sent_to_china_at, received_from_china_at = EXCLUDED.received_from_china_at, updated_at = NOW() RETURNING *`,
      [receiptId, input.send_to_china, sentAt, receivedAt, office],
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return invalid(error);
  }
}

export const createChinaPartHandlers = (office: "lahore" | "karachi") => ({
  GET: (req: NextRequest, context: { params: Promise<{ id: string }> }) =>
    getChinaPart(req, context, office),
  PUT: (req: NextRequest, context: { params: Promise<{ id: string }> }) =>
    putChinaPart(req, context, office),
});

export const { GET, PUT } = createChinaPartHandlers("lahore");
