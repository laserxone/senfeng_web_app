import { createExpenseHandlers } from "@/app/api/lahore/[uid]/expenses/route";

export const { GET, POST } = createExpenseHandlers("karachi");

export const revalidate = 0;
