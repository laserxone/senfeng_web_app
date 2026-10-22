import { createPosHandlers } from "@/app/api/lahore/[uid]/pos/payment-invoice/[id]/route";

export const { DELETE } = createPosHandlers("karachi");

export const revalidate = 0;
