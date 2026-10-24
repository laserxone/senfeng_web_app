import {
  createAttendanceGetHandler,
  createAttendancePostHandler,
} from "@/app/api/lahore/[uid]/attendance/route";

export const GET = createAttendanceGetHandler("karachi");
export const POST = createAttendancePostHandler("karachi");

export const revalidate = 0;
