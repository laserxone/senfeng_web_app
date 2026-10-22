import { createPosHandlers } from "@/app/api/lahore/[uid]/pos/route";

export const { GET, POST, PUT } = createPosHandlers("karachi");

export const revalidate = 0;
