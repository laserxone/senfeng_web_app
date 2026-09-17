import { createPartsReceivingHandlers } from "@/lib/parts-receiving";
import { NextRequest } from "next/server";

const handlers = createPartsReceivingHandlers("lahore");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handlers.detail(id);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handlers.update(id, await req.json());
}

export const revalidate = 0;
