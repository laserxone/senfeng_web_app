import { createCustomerDashboardGetHandler } from "@/app/api/lahore/[uid]/customer/[id]/dashboard/route";

export const GET = createCustomerDashboardGetHandler("karachi");

export const revalidate = 0;
