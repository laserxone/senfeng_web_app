import { createTaskHandlers } from "@/app/api/lahore/[uid]/task/route";

export const { GET, POST } = createTaskHandlers("karachi");

export const revalidate = 0;
