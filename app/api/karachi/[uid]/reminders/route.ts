import { createRemindersGetHandler } from "@/app/api/lahore/[uid]/reminders/route";

export const GET = createRemindersGetHandler("karachi");

export const revalidate = 0;
