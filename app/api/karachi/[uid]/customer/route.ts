import { createCustomerHandlers } from "@/app/api/lahore/[uid]/customer/route";

export const { GET, POST } = createCustomerHandlers("karachi");

export const revalidate = 0;
