import { BaseEntry, EntryComputed } from "./base"

/**
 * API response type for a single entry
 */
export interface ApiEntry {
    id: string
    date: string
    expectedScheduleImageUrl: string
    actualScheduleImageUrl: string
    reflectionText: string
    dayX: number
}

/**
 * API response type for entry list
 */
export interface ApiEntryList {
    entries: Array<ApiEntry & EntryComputed>
    pagination: {
        total: number
        page: number
        limit: number
        pages: number
    }
}

/**
 * API response type for entry status
 */
export interface ApiEntryStatus {
    total: number
    withReflection: number
    withExpectedSchedule: number
    withActualSchedule: number
    hasTodayEntry: boolean
}

/**
 * API response type for entry dates
 */
export interface ApiEntryDates {
    dates: string[]
}

/**
 * API response type for streak
 */
export interface ApiStreak {
    streak: number
}

/**
 * API response type for health check
 */
export interface ApiHealth {
    status: "healthy" | "unhealthy"
    error?: string
}

/**
 * API request type for entry creation/update
 */
export interface ApiEntryInput {
    reflectionText?: string
    images?: {
        expectedScheduleImageUrl?: string
        actualScheduleImageUrl?: string
    }
}

// New types for handling missing images
export interface MissingImageError {
    type: "missing_image"
    field: "expectedScheduleImageUrl" | "actualScheduleImageUrl"
    message: string
}

export interface EntryWithImageStatus extends ApiEntry {
    imageStatus: {
        expectedScheduleImageUrl: {
            exists: boolean
            error?: MissingImageError
        }
        actualScheduleImageUrl: {
            exists: boolean
            error?: MissingImageError
        }
    }
} 