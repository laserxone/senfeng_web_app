import { createPosHandlers } from "@/app/api/lahore/[uid]/pos/search/[searchitem]/route";

export const { GET } = createPosHandlers("karachi");

export const revalidate = 0;
