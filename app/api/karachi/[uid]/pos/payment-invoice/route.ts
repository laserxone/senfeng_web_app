import { createPosHandlers } from "@/app/api/lahore/[uid]/pos/payment-invoice/route";

export const { POST, PUT } = createPosHandlers("karachi");

export const revalidate = 0;
