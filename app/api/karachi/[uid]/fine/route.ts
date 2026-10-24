import {
  POST as sharedPOST,
  createFineGetHandler,
} from "@/app/api/lahore/[uid]/fine/route";

export const GET = createFineGetHandler("karachi");
export const POST = sharedPOST;

export const revalidate = 0;
