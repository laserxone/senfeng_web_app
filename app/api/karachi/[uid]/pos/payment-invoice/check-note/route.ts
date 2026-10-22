import { createPosHandlers } from "@/app/api/lahore/[uid]/pos/payment-invoice/check-note/route";

export const { POST } = createPosHandlers("karachi");

export const revalidate = 0;
