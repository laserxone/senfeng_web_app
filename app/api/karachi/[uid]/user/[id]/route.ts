import { handleUserPut } from "@/app/api/lahore/[uid]/user/[id]/route";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handleUserPut(req, context);
}

export const revalidate = 0;
