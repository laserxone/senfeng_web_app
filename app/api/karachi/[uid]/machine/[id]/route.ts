import { deleteMachine } from "@/app/api/lahore/[uid]/machine/[id]/route";
import { NextRequest } from "next/server";

export { GET, PUT } from "@/app/api/lahore/[uid]/machine/[id]/route";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return deleteMachine("karachi", req, context);
}
