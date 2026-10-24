import {
  PUT as sharedPUT,
  createPaymentRequestsGetHandler,
} from "@/app/api/lahore/[uid]/payment-requests/route";

export const GET = createPaymentRequestsGetHandler("karachi");
export const PUT = sharedPUT;
