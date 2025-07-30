import mongoose from "mongoose"
import { z } from "zod"

export const entrySchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true },
    expectedScheduleImageUrl: { type: String, default: "" },
    actualScheduleImageUrl: { type: String, default: "" },
    reflectionText: { type: String, default: "" }
}, {
    timestamps: true
})

export const EntryModel = mongoose.models.Entry || mongoose.model("Entry", entrySchema)

export type DbEntry = {
    _id: string
    date: Date
    expectedScheduleImageUrl: string
    actualScheduleImageUrl: string
    reflectionText: string
    createdAt: Date
    updatedAt: Date
}

export type EntryWithComputed = {
    id: string
    date: Date
    expectedScheduleImageUrl: string
    actualScheduleImageUrl: string
    reflectionText: string
    dayX: number
    hasReflection: boolean
    hasExpectedSchedule: boolean
    hasActualSchedule: boolean
}

export type EntryWithImageStatus = Omit<EntryWithComputed, 'date'> & {
    date: string
    imageStatus: {
        expectedScheduleImageUrl: {
            exists: boolean
            error?: {
                type: "missing_image"
                field: "expectedScheduleImageUrl" | "actualScheduleImageUrl"
                message: string
            }
        }
        actualScheduleImageUrl: {
            exists: boolean
            error?: {
                type: "missing_image"
                field: "expectedScheduleImageUrl" | "actualScheduleImageUrl"
                message: string
            }
        }
    }
}

export async function calculateDayX(date: Date): Promise<number> {
    // Fetch all entry dates sorted ascending
    const entries = await EntryModel.find({}, { date: 1 }).sort({ date: 1 }).lean()
    if (!entries.length) return 1

    // Find the index of the given date in the sorted list
    const targetTime = new Date(date).getTime()
    const index = entries.findIndex(e => new Date(e.date).getTime() === targetTime)
    // If not found, return 1 (should not happen if called with a valid entry date)
    return index >= 0 ? index + 1 : 1
}
