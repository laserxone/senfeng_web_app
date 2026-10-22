import { createPosHandlers } from "@/app/api/lahore/[uid]/pos/engineer/[id]/route";

export const { POST } = createPosHandlers("karachi");

export const revalidate = 0;
