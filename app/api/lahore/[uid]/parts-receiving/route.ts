import { createPartsReceivingHandlers } from "@/lib/parts-receiving";
import { NextRequest } from "next/server";

const handlers = createPartsReceivingHandlers("lahore");

export async function GET(req: NextRequest) {
  return handlers.list(req.nextUrl.searchParams);
}

export async function POST(req: NextRequest) {
  return handlers.create(await req.json());
}

export const revalidate = 0;
