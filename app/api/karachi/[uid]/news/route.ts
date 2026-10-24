import {
  POST as sharedPOST,
  createNewsGetHandler,
} from "@/app/api/lahore/[uid]/news/route";

export const GET = createNewsGetHandler("karachi");
export const POST = sharedPOST;

export const revalidate = 0;
