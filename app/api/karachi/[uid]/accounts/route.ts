import { createAccountsHandler } from "@/app/api/lahore/[uid]/accounts/route";

export const GET = createAccountsHandler("karachi");

export const revalidate = 0;
