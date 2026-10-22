import { createPosHandlers } from "@/app/api/lahore/[uid]/pos/update/[id]/route";

export const { PUT } = createPosHandlers("karachi");

export const revalidate = 0;
