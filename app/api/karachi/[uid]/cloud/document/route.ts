import {
  GET as sharedGET,
  POST as sharedPOST,
} from "@/app/api/lahore/[uid]/cloud/document/route";

export const GET = sharedGET;
export const POST = sharedPOST;

export const revalidate = 0;
