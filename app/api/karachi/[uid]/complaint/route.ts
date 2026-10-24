import {
  POST as sharedPOST,
  PUT as sharedPUT,
  createComplaintGetHandler,
} from "@/app/api/lahore/[uid]/complaint/route";

export const GET = createComplaintGetHandler("karachi");
export const POST = sharedPOST;
export const PUT = sharedPUT;

export const revalidate = 0;
