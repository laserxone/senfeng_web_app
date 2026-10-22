import { createPosHandlers } from "@/app/api/lahore/[uid]/pos/payment/[id]/route";

export const { PUT, GET, DELETE } = createPosHandlers("karachi");

export const revalidate = 0;
