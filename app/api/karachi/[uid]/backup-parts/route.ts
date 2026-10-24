import {
  POST as sharedPOST,
  GET as sharedGET,
} from "@/app/api/lahore/[uid]/backup-parts/route";

export const POST = sharedPOST;
export const GET = sharedGET;

export const revalidate = 0;
