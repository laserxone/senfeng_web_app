import { AttendanceTableRow } from "@/lib/types";
import moment from "moment";

function isResolved(status: string) {
  return ["resolved", "completed"].includes(status?.toLowerCase());
}

function isCompleted(status: string) {
  return ["completed", "resolved"].includes(status?.toLowerCase());
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return moment(value).format("MMM D, YYYY");
}

function generateAttendanceData(
  rawData: AttendanceTableRow[],
  start: string,
  end: string,
) {
  const startDate = moment(start);
  const endDate = moment(end);
  const uniqueUsers = Array.from(
    new Set(rawData.map((item) => item.user_email).filter(Boolean)),
  );
  const datesInMonth: string[] = [];
  const current = moment(startDate);

  while (current.isSameOrBefore(endDate)) {
    datesInMonth.push(current.format("YYYY-MM-DD"));
    current.add(1, "day");
  }

  const userMap: Record<string, string> = {};
  rawData.forEach((item) => {
    if (item.user_email) userMap[item.user_email] = item.user_name;
  });

  const finalData = uniqueUsers.flatMap((user) =>
    datesInMonth.map((date) => {
      const match = rawData.find(
        (item) =>
          item.user_email === user &&
          moment(item.date).format("YYYY-MM-DD") === date,
      );
      return {
        ...match,
        date,
        user_email: user,
        user_name: match?.user_name || userMap[user] || user,
        status: match?.status || "Absent",
        time_in: match?.time_in || null,
        time_out: match?.time_out || null,
      } as AttendanceTableRow;
    }),
  );

  const today = moment().format("YYYY-MM-DD");
  return finalData
    .filter((item) => item.date <= today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export {
  formatCurrency,
  formatDate,
  isCompleted,
  isResolved,
  percent,
  generateAttendanceData,
};
