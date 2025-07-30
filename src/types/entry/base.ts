import { Document } from "mongoose"

/**
 * Base entry interface containing all core fields
 */
export interface BaseEntry {
    date: Date
    expectedScheduleImageUrl: string
    actualScheduleImageUrl: string
    reflectionText: string
}

/**
 * Database entry interface that extends Mongoose Document
 */
export interface DbEntry extends BaseEntry, Document {
    _id: string
    createdAt: Date
    updatedAt: Date
}

/**
 * Computed fields that can be derived from base fields
 */
export interface EntryComputed {
    hasReflection: boolean
    hasExpectedSchedule: boolean
    hasActualSchedule: boolean
}

/**
 * Type for entry creation/update operations
 */
export type EntryInput = Partial<Omit<BaseEntry, 'date'>> & {
    date?: Date | string
}

/**
 * Type for entry with computed fields
 */
export type EntryWithComputed = BaseEntry & EntryComputed

/**
 * Type for entry with MongoDB ID
 */
export type EntryWithId = BaseEntry & {
    id: string
}

/**
 * Type for entry with MongoDB ID and computed fields
 */
export type EntryWithIdAndComputed = EntryWithId & EntryComputed 