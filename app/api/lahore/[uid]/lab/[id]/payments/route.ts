import { createLabTaskPaymentHandlers } from "@/lib/lab-task-payments";
import { NextRequest } from "next/server";

const handlers = createLabTaskPaymentHandlers("lahore");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handlers.list(id);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handlers.create(id, await req.json());
}

export const revalidate = 0;
