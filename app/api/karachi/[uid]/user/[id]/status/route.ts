import { handleUserStatusPatch } from "@/app/api/lahore/[uid]/user/[id]/status/route";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ uid: string; id: string }> },
) {
  return handleUserStatusPatch(req, context);
}
