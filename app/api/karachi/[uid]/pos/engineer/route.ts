import { createPosHandlers } from "@/app/api/lahore/[uid]/pos/engineer/route";

export const { GET } = createPosHandlers("karachi");

export const revalidate = 0;
