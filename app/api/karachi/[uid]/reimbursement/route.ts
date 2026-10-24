import {
  createReimbursementGetHandler,
  POST as sharedPOST,
} from "@/app/api/lahore/[uid]/reimbursement/route";

export const POST = sharedPOST;
export const GET = createReimbursementGetHandler("karachi");

export const revalidate = 0;
