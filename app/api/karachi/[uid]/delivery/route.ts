import { createDeliveryHandlers } from "@/app/api/lahore/[uid]/delivery/route";

export const { GET, POST, PUT, DELETE } = createDeliveryHandlers("karachi");
export const revalidate = 0;
