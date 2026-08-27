import {
  createPaymentHandler,
  PUT,
} from "@/app/api/lahore/[uid]/payment/route";

export const POST = createPaymentHandler("karachi");

export { PUT };
