import {
  PUT as sharedPUT,
  createComplaintLogsPostHandler,
} from "@/app/api/lahore/[uid]/complaint-logs/route";

export const POST = createComplaintLogsPostHandler("karachi");
export const PUT = sharedPUT;

export const revalidate = 0;
