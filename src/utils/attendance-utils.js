// Utility functions for attendance calculations


export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

export function getWorkingDaysInMonth(year, month) {
  const dates = getAllDatesInMonth(year, month)

  let totalWorkingDays = 0
  dates.forEach((date) => {
    const day = date.getDay()

    const isWeekend = [0, 6].includes(day)
    if (!isWeekend) {
      totalWorkingDays++
    }
  })
  return totalWorkingDays
}

export function getAllDatesInMonth(year, month) {
  const totalDays = getDaysInMonth(year, month)
  const dates= []

  for (let day = 1; day <= totalDays; day++) {
    dates.push(new Date(year, month - 1, day))
  }

  return dates
}



export function formatDateLocal(date ) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseCSVDate(dateStr) {
  // Handle various date formats and return YYYY-MM-DD format

  // Trim whitespace
  dateStr = dateStr.trim()

  // Try YYYY-MM-DD format first
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  // Try YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    return dateStr.replace(/\//g, "-")
  }

  // Try MM/DD/YYYY (US format)
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (usMatch) {
    const [, month, day, year] = usMatch
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  // Try DD-MM-YYYY (EU format with dashes)
  const euMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (euMatch) {
    const [, day, month, year] = euMatch
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  // Try DD/MM/YYYY (EU format with slashes)
  const euSlashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (euSlashMatch) {
    // This is ambiguous with US format, assume DD/MM/YYYY
    const [, day, month, year] = euSlashMatch
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  // Try D-MMM-YYYY or DD-MMM-YYYY (e.g., 15-Jan-2024)
  const monthNames = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  }
  const namedMatch = dateStr.match(/^(\d{1,2})-([a-zA-Z]{3})-(\d{4})$/)
  if (namedMatch) {
    const [, day, monthStr, year] = namedMatch
    const month = monthNames[monthStr.toLowerCase()]
    if (month) {
      return `${year}-${month}-${day.padStart(2, "0")}`
    }
  }

  return null
}

export const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]

