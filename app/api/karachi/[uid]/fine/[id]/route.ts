import {
  DELETE as sharedDELETE,
  PUT as sharedPUT,
} from "@/app/api/lahore/[uid]/fine/[id]/route";

export const DELETE = sharedDELETE;
export const PUT = sharedPUT;

export const revalidate = 0;
