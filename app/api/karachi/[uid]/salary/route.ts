import {
  GET as sharedGET,
  POST as sharedPOST,
} from "@/app/api/lahore/[uid]/salary/route";

export const GET = sharedGET;
export const POST = sharedPOST;

export const revalidate = 0;
