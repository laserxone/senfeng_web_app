import { createPosHandlers } from "@/app/api/lahore/[uid]/pos/issue/[id]/route";

export const { POST } = createPosHandlers("karachi");

export const revalidate = 0;
