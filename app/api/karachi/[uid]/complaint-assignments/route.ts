import {
  GET as sharedGET,
  POST as sharedPOST,
  PUT as sharedPUT,
} from "@/app/api/lahore/[uid]/complaint-assignments/route";

export const GET = sharedGET;
export const POST = sharedPOST;
export const PUT = sharedPUT;

export const revalidate = 0;
