import {
  POST as sharedPOST,
  createOldCommissionsGetHandler,
} from "@/app/api/lahore/[uid]/old-commissions/route";

export const GET = createOldCommissionsGetHandler("karachi");
export const POST = sharedPOST;

export const revalidate = 0;
