import {
  GET as sharedGET,
  DELETE as sharedDELETE,
} from "@/app/api/lahore/[uid]/complaint/[id]/route";

export const GET = sharedGET;
export const DELETE = sharedDELETE;

export const revalidate = 0;
