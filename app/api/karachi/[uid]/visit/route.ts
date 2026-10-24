import {
  createVisitPostHandler,
  GET as sharedGET,
} from "@/app/api/lahore/[uid]/visit/route";

export const GET = sharedGET;
export const POST = createVisitPostHandler("karachi");

export const revalidate = 0;
