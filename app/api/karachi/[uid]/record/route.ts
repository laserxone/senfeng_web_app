import { createRecordGetHandler } from "@/app/api/lahore/[uid]/record/route";

export const GET = createRecordGetHandler("karachi");

export const revalidate = 0;
