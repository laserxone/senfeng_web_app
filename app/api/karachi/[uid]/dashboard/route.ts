import { createDashboardGetHandler } from "@/app/api/lahore/[uid]/dashboard/route";

export const GET = createDashboardGetHandler("karachi");

export const revalidate = 0;
