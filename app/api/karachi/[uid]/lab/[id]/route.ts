import {
  DELETE as sharedDELETE,
  createLabPutHandler,
} from "@/app/api/lahore/[uid]/lab/[id]/route";

export const PUT = createLabPutHandler("karachi");
export const DELETE = sharedDELETE;

export const revalidate = 0;
