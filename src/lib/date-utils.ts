import { DateTime } from "luxon"

// Convert a date string (YYYY-MM-DD) to a UTC start-of-day Date object
function dateStringToUtcDate(dateString: string): Date {
  console.log(`Converting date string: ${dateString} to UTC start-of-day`)

  // Parse the date string to a Luxon DateTime in local timezone
  const localDateTime = DateTime.fromFormat(dateString, "yyyy-MM-dd", { zone: "local" })
  console.log(`Parsed local DateTime: ${localDateTime.toISO()}`)

  // Convert to start of day in local timezone
  const localStartOfDay = localDateTime.startOf("day")
  console.log(`Local start of day: ${localStartOfDay.toISO()}`)

  // Convert to UTC
  const utcStartOfDay = localStartOfDay.toUTC()
  console.log(`UTC start of day: ${utcStartOfDay.toISO()}`)

  // Convert to JavaScript Date object for MongoDB
  const jsDate = utcStartOfDay.toJSDate()
  console.log(`JavaScript Date object: ${jsDate.toISOString()}`)

  return jsDate
}

// Convert a UTC Date object from MongoDB to a local date string (YYYY-MM-DD)
function utcDateToDateString(utcDate: Date): string {
  console.log(`Converting UTC Date: ${utcDate.toISOString()} to local date string`)

  // Convert from JavaScript Date to Luxon DateTime in UTC
  const utcDateTime = DateTime.fromJSDate(utcDate, { zone: "utc" })
  console.log(`UTC DateTime: ${utcDateTime.toISO()}`)

  // Convert to local timezone
  const localDateTime = utcDateTime.setZone("local")
  console.log(`Local DateTime: ${localDateTime.toISO()}`)

  // Format as YYYY-MM-DD
  const dateString = localDateTime.toFormat("yyyy-MM-dd")
  console.log(`Formatted date string: ${dateString}`)

  return dateString
}

// Get today's date as a date string (YYYY-MM-DD) in local timezone
function getTodayDateString(): string {
  const today = DateTime.local().startOf("day")
  return today.toFormat("yyyy-MM-dd")
}

// Get tomorrow's date as a date string (YYYY-MM-DD) in local timezone
function getTomorrowDateString(): string {
  const tomorrow = DateTime.local().plus({ days: 1 }).startOf("day")
  return tomorrow.toFormat("yyyy-MM-dd")
}

// Get the start and end of a month as UTC Date objects
function getMonthStartAndEnd(year: number, month: number): { start: Date; end: Date } {
  console.log(`Getting start and end dates for month: ${year}-${month}`)

  // Create DateTime for the first day of the month in local timezone
  const startLocal = DateTime.local(year, month, 1).startOf("day")
  console.log(`Local start of month: ${startLocal.toISO()}`)

  // Convert to UTC
  const startUtc = startLocal.toUTC().toJSDate()
  console.log(`UTC start of month: ${startUtc.toISOString()}`)

  // Create DateTime for the first day of the next month in local timezone
  const endLocal = startLocal.plus({ months: 1 }).startOf("day")
  console.log(`Local start of next month: ${endLocal.toISO()}`)

  // Convert to UTC
  const endUtc = endLocal.toUTC().toJSDate()
  console.log(`UTC start of next month: ${endUtc.toISOString()}`)

  return { start: startUtc, end: endUtc }
}

// Get the current month and year
function getCurrentMonthAndYear(): { month: number; year: number } {
  const now = DateTime.local()
  return { month: now.month, year: now.year }
}

// Get the number of days in a month
function getDaysInMonth(year: number, month: number): number {
  return DateTime.local(year, month).daysInMonth || 30 // Fallback to 30 if undefined
}

// Check if a date is today
function isToday(dateString: string): boolean {
  const today = getTodayDateString()
  return dateString === today
}

// Format a date for display (e.g., "Monday, January 1, 2023")
function formatDateForDisplay(dateString: string): string {
  const date = DateTime.fromFormat(dateString, "yyyy-MM-dd", { zone: "local" })
  return date.toFormat("EEEE, MMMM d, yyyy")
}

// Get a date range as an array of date strings
function getDateRange(startDateString: string, endDateString: string): string[] {
  const start = DateTime.fromFormat(startDateString, "yyyy-MM-dd", { zone: "local" })
  const end = DateTime.fromFormat(endDateString, "yyyy-MM-dd", { zone: "local" })

  const range: string[] = []
  let current = start

  while (current <= end) {
    range.push(current.toFormat("yyyy-MM-dd"))
    current = current.plus({ days: 1 })
  }

  return range
}

/**
 * Parses a date string from a URL path
 * @param url - The URL path containing the date string
 * @returns A Luxon DateTime object
 */
function parseDateFromUrl(url: string): DateTime {
  const dateString = url.split('/').pop() || '';
  return DateTime.fromFormat(dateString, "yyyy-MM-dd", { zone: "local" });
}

/**
 * Gets the previous month from a given date
 * @param date - The reference date
 * @returns A Luxon DateTime object for the previous month
 */
function getPreviousMonth(date: DateTime): DateTime {
  return date.minus({ months: 1 });
}

/**
 * Gets the next month from a given date
 * @param date - The reference date
 * @returns A Luxon DateTime object for the next month
 */
function getNextMonth(date: DateTime): DateTime {
  return date.plus({ months: 1 });
}

/**
 * Formats a date to show the month name
 * @param date - The date to format
 * @returns The month name (e.g., "January")
 */
function formatMonthName(date: DateTime): string {
  return date.toFormat("MMMM");
}

/**
 * Gets the current year
 * @returns The current year as a number
 */
function getCurrentYear(): number {
  return DateTime.local().year;
}

/**
 * Gets the previous day from a given date
 * @param date - The reference date
 * @returns A Luxon DateTime object for the previous day
 */
function getPreviousDay(date: DateTime): DateTime {
  return date.minus({ days: 1 });
}

/**
 * Checks if two dates are consecutive days
 * @param date1 - The first date
 * @param date2 - The second date
 * @returns True if the dates are consecutive days
 */
function isConsecutiveDay(date1: DateTime, date2: DateTime): boolean {
  return date1.minus({ days: 1 }).hasSame(date2, 'day');
}

/**
 * Formats a date for API responses
 * @param date - The date to format
 * @returns A date string in YYYY-MM-DD format
 */
function dateToApiFormat(date: DateTime): string {
  return date.toFormat("yyyy-MM-dd");
}

/**
 * Converts a date to UTC for database storage
 * @param date - The date to convert (can be DateTime or Date)
 * @returns A UTC Date object
 */
function dateToUtcForDb(date: DateTime | Date): Date {
  if (date instanceof Date) {
    return DateTime.fromJSDate(date).toUTC().toJSDate();
  }
  return date.toUTC().toJSDate();
}

/**
 * Converts a database Date object to a Luxon DateTime in local timezone
 * @param date - The database Date object
 * @returns A Luxon DateTime object in local timezone
 */
function dbDateToLuxon(date: Date): DateTime {
  return DateTime.fromJSDate(date, { zone: "utc" }).setZone("local");
}

// Returns the UTC start and end Date objects for a given YYYY-MM-DD string
function getDateRangeForDay(dateString: string): { start: Date, end: Date } {
  const start = new Date(dateString + 'T00:00:00.000Z')
  const end = new Date(dateString + 'T23:59:59.999Z')
  return { start, end }
}

// Checks if an entry exists for a given dateString using EntryModel
// (import EntryModel where used, not here, to avoid circular deps)
async function entryExistsForDate(dateString: string, EntryModel: { findOne: (query: unknown) => Promise<unknown> }): Promise<boolean> {
  const { start, end } = getDateRangeForDay(dateString)
  const entry = await EntryModel.findOne({ date: { $gte: start, $lte: end } })
  return !!entry
}

export function isPastDate(dateString: string): boolean {
  const today = DateTime.utc().startOf('day')
  const date = DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone: 'utc' })
  return date < today
}

export {
  dateStringToUtcDate,
  utcDateToDateString,
  getTodayDateString,
  getTomorrowDateString,
  getMonthStartAndEnd,
  getCurrentMonthAndYear,
  getDaysInMonth,
  isToday,
  formatDateForDisplay,
  getDateRange,
  parseDateFromUrl,
  getPreviousMonth,
  getNextMonth,
  formatMonthName,
  getCurrentYear,
  getPreviousDay,
  isConsecutiveDay,
  dateToApiFormat,
  dateToUtcForDb,
  dbDateToLuxon,
  getDateRangeForDay,
  entryExistsForDate,
}
