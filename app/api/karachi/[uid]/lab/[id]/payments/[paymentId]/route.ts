import { createLabTaskPaymentHandlers } from "@/lib/lab-task-payments";
import { NextRequest } from "next/server";

const handlers = createLabTaskPaymentHandlers("karachi");

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  const { id, paymentId } = await params;
  return handlers.update(id, paymentId, await req.json());
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  const { id, paymentId } = await params;
  return handlers.remove(id, paymentId);
}

export const revalidate = 0;
