import { createLabHandlers } from "@/app/api/lahore/[uid]/lab/route";

export const { GET, POST } = createLabHandlers("karachi");

export const revalidate = 0;
