import { createExpenseDeleteHandler } from "@/app/api/lahore/[uid]/expenses/[id]/route";

export const DELETE = createExpenseDeleteHandler("karachi");

export const revalidate = 0;
