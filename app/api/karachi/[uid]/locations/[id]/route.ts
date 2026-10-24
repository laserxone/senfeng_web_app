import {
  DELETE as sharedDELETE,
  PUT as sharedPUT,
} from "@/app/api/lahore/[uid]/locations/[id]/route";

export const DELETE = sharedDELETE;
export const PUT = sharedPUT;

export const revalidate = 0;
