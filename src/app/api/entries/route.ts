import { type NextRequest, NextResponse } from "next/server"
import { EntryModel, type EntryWithImageStatus, calculateDayX } from "@/models/entry"
import { connectToDatabase } from "@/lib/server/db"
import { ApiEntryList } from "@/types/entry"
import { entryListSchema } from "@/types/entry/validation"
import { checkImageStatus, cleanupInvalidImageUrls } from "@/lib/upload"
import { utcDateToDateString } from "@/lib/date-utils"

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase()

        const total = await EntryModel.countDocuments()
        const entries = await EntryModel.find()
            .sort({ date: -1 })
            .limit(100)

        const entriesWithDayX = await Promise.all(
            entries.map(async (entry) => {
                // Clean up any invalid image URLs
                const cleanedEntry = await cleanupInvalidImageUrls(entry)

                // Check image status
                const [expectedStatus, actualStatus] = await Promise.all([
                    checkImageStatus(cleanedEntry.expectedScheduleImageUrl, "expectedScheduleImageUrl"),
                    checkImageStatus(cleanedEntry.actualScheduleImageUrl, "actualScheduleImageUrl")
                ])

                const dayX = await calculateDayX(cleanedEntry.date)
                return {
                    id: cleanedEntry._id.toString(),
                    date: utcDateToDateString(cleanedEntry.date),
                    expectedScheduleImageUrl: cleanedEntry.expectedScheduleImageUrl,
                    actualScheduleImageUrl: cleanedEntry.actualScheduleImageUrl,
                    reflectionText: cleanedEntry.reflectionText,
                    dayX,
                    hasReflection: cleanedEntry.reflectionText.length > 0,
                    hasExpectedSchedule: cleanedEntry.expectedScheduleImageUrl.length > 0,
                    hasActualSchedule: cleanedEntry.actualScheduleImageUrl.length > 0,
                    imageStatus: {
                        expectedScheduleImageUrl: expectedStatus,
                        actualScheduleImageUrl: actualStatus
                    }
                }
            })
        )

        const response: ApiEntryList = {
            entries: entriesWithDayX,
            pagination: {
                total,
                page: 1,
                limit: 100,
                pages: Math.ceil(total / 100)
            }
        }
        entryListSchema.parse(response)

        return NextResponse.json(response)
    } catch (error) {
        console.error("Error getting entries:", error)
        return NextResponse.json(
            { error: "Failed to get entries" },
            { status: 500 }
        )
    }
}
