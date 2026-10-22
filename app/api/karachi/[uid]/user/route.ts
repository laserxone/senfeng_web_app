import {
  handleUserGet,
  handleUserPost,
} from "@/app/api/lahore/[uid]/user/route";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return handleUserPost(req);
}

export async function GET(req: NextRequest) {
  return handleUserGet(req, "karachi");
}

export const revalidate = 0;
