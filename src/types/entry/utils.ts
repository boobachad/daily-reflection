import { DbEntry, BaseEntry, EntryComputed, EntryWithComputed } from "./base"
import { ApiEntry, ApiEntryList } from "./api"
import { dateToUtcForDb, utcDateToDateString } from "@/lib/date-utils"

/**
 * Convert a database entry to an API entry
 */
export function dbToApiEntry(entry: DbEntry, dayX: number): ApiEntry {
    return {
        id: entry._id.toString(),
        date: entry.date.toISOString(),
        expectedScheduleImageUrl: entry.expectedScheduleImageUrl,
        actualScheduleImageUrl: entry.actualScheduleImageUrl,
        reflectionText: entry.reflectionText,
        dayX
    }
}

/**
 * Add computed fields to an entry
 */
export function addComputedFields(entry: BaseEntry): EntryWithComputed {
    return {
        ...entry,
        hasReflection: !!entry.reflectionText && entry.reflectionText.length > 0,
        hasExpectedSchedule: !!entry.expectedScheduleImageUrl,
        hasActualSchedule: !!entry.actualScheduleImageUrl
    }
}

/**
 * Convert a database entry to an API entry with computed fields
 */
export function dbToApiEntryWithComputed(entry: DbEntry, dayX: number): ApiEntry & EntryComputed {
    const apiEntry = dbToApiEntry(entry, dayX)
    const computed = addComputedFields(entry)
    // Only spread computed fields that do not overwrite ApiEntry fields
    const { hasReflection, hasExpectedSchedule, hasActualSchedule } = computed
    return {
        ...apiEntry,
        hasReflection,
        hasExpectedSchedule,
        hasActualSchedule
    }
}

/**
 * Type guard for database entry
 */
export function isDbEntry(obj: any): obj is DbEntry {
    return obj && '_id' in obj && 'date' in obj
}

/**
 * Type guard for API entry
 */
export function isApiEntry(obj: any): obj is ApiEntry {
    return obj && 'id' in obj && 'dayX' in obj && 'date' in obj
} 