import { createCommissionHandlers } from "@/app/api/lahore/[uid]/commission/route";

export const { GET, POST } = createCommissionHandlers("karachi");

export const revalidate = 0;
