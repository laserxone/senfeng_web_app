import { createPosHandlers } from "@/app/api/lahore/[uid]/pos/deleteinvoice/route";

export const { POST } = createPosHandlers("karachi");

export const revalidate = 0;
