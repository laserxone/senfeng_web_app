const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateCreditEndDate(
  startDate: string,
  months: number,
): string | null {
  if (!Number.isSafeInteger(months) || months < 1) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;

  const [year, month, day] = startDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  if (start.toISOString().slice(0, 10) !== startDate) return null;

  const targetMonth = month - 1 + months;
  if (year + Math.floor(targetMonth / 12) > 9999) return null;
  const lastDayOfTargetMonth = new Date(
    Date.UTC(year, targetMonth + 1, 0),
  ).getUTCDate();
  const anniversary = Date.UTC(
    year,
    targetMonth,
    Math.min(day, lastDayOfTargetMonth),
  );
  return new Date(anniversary - DAY_MS).toISOString().slice(0, 10);
}
