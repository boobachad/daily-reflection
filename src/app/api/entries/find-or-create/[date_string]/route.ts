import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/server/db"
import { EntryModel, type EntryWithImageStatus, calculateDayX } from "@/models/entry"
import { getTodayDateString, utcDateToDateString } from "@/lib/date-utils"
import { apiEntryInputSchema, entryWithImageStatusSchema } from "@/types/entry/validation"
import { processFileUpload, processBase64Image, checkImageStatus, cleanupInvalidImageUrls } from "@/lib/upload"

export async function GET(
    request: NextRequest,
    { params }: { params: { date_string: string } }
) {
    try {
        await connectToDatabase()
        const resolvedParams = await params;
        const { date_string: dateString } = resolvedParams;
        const today = getTodayDateString()

        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return NextResponse.json(
                { error: "Invalid date format. Use YYYY-MM-DD." },
                { status: 400 }
            )
        }

        // Check for past date before upsert
        const entryExists = await EntryModel.findOne({ date: new Date(dateString) })
        if (!entryExists && dateString < today) {
            return NextResponse.json(
                { error: "Cannot create new entries for past dates" },
                { status: 403 }
            )
        }

        // ATOMIC: Find or create entry using upsert
        const entry = await EntryModel.findOneAndUpdate(
            { date: new Date(dateString) },
            {
                $setOnInsert: {
                    date: new Date(dateString),
                    expectedScheduleImageUrl: "",
                    actualScheduleImageUrl: "",
                    reflectionText: ""
                }
            },
            { upsert: true, new: true }
        )

        // Clean up any invalid image URLs
        const cleanedEntry = await cleanupInvalidImageUrls(entry)

        // Check image status
        const [expectedStatus, actualStatus] = await Promise.all([
            checkImageStatus(cleanedEntry.expectedScheduleImageUrl, "expectedScheduleImageUrl"),
            checkImageStatus(cleanedEntry.actualScheduleImageUrl, "actualScheduleImageUrl")
        ])

        // Prepare response
        const response: EntryWithImageStatus = {
            id: cleanedEntry._id.toString(),
            date: utcDateToDateString(cleanedEntry.date),
            expectedScheduleImageUrl: cleanedEntry.expectedScheduleImageUrl,
            actualScheduleImageUrl: cleanedEntry.actualScheduleImageUrl,
            reflectionText: cleanedEntry.reflectionText,
            dayX: await calculateDayX(cleanedEntry.date),
            hasReflection: cleanedEntry.reflectionText.length > 0,
            hasExpectedSchedule: cleanedEntry.expectedScheduleImageUrl.length > 0,
            hasActualSchedule: cleanedEntry.actualScheduleImageUrl.length > 0,
            imageStatus: {
                expectedScheduleImageUrl: expectedStatus,
                actualScheduleImageUrl: actualStatus
            }
        }

        // Validate response
        entryWithImageStatusSchema.parse(response)
        return NextResponse.json(response)
    } catch (error) {
        console.error("Error finding or creating entry:", error)
        return NextResponse.json(
            { error: "Failed to find or create entry" },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { date_string: string } }
) {
    try {
        await connectToDatabase()
        const { date_string: dateString } = params
        const today = getTodayDateString()

        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return NextResponse.json(
                { error: "Invalid date format. Use YYYY-MM-DD." },
                { status: 400 }
            )
        }

        const formData = await request.formData()
        const entryData = {
            date: dateString,
            expectedScheduleImageUrl: formData.get("expectedScheduleImageUrl") as string || "",
            actualScheduleImageUrl: formData.get("actualScheduleImageUrl") as string || "",
            reflectionText: formData.get("reflectionText") as string || ""
        }

        // Validate input
        const validatedData = apiEntryInputSchema.parse(entryData)

        // Process images if provided
        const expectedScheduleFile = formData.get("expectedScheduleFile") as File | null
        const actualScheduleFile = formData.get("actualScheduleFile") as File | null
        const expectedScheduleBase64 = formData.get("expectedScheduleBase64") as string | null
        const actualScheduleBase64 = formData.get("actualScheduleBase64") as string | null

        if (expectedScheduleFile) {
            validatedData.expectedScheduleImageUrl = await processFileUpload(expectedScheduleFile)
        } else if (expectedScheduleBase64) {
            validatedData.expectedScheduleImageUrl = await processBase64Image(expectedScheduleBase64)
        }

        if (actualScheduleFile) {
            validatedData.actualScheduleImageUrl = await processFileUpload(actualScheduleFile)
        } else if (actualScheduleBase64) {
            validatedData.actualScheduleImageUrl = await processBase64Image(actualScheduleBase64)
        }

        let entry = await EntryModel.findOne({ date: new Date(dateString) })

        // Only prevent creation of new entries for past dates
        if (!entry && dateString < today) {
            return NextResponse.json(
                { error: "Cannot create new entries for past dates" },
                { status: 403 }
            )
        }

        if (!entry) {
            entry = await EntryModel.create(validatedData)
        } else {
            // Update entry
            Object.assign(entry, validatedData)
            await entry.save()
        }

        // Clean up any invalid image URLs
        const cleanedEntry = await cleanupInvalidImageUrls(entry)

        // Check image status
        const [expectedStatus, actualStatus] = await Promise.all([
            checkImageStatus(cleanedEntry.expectedScheduleImageUrl, "expectedScheduleImageUrl"),
            checkImageStatus(cleanedEntry.actualScheduleImageUrl, "actualScheduleImageUrl")
        ])

        // Prepare response
        const response: EntryWithImageStatus = {
            id: cleanedEntry._id.toString(),
            date: utcDateToDateString(cleanedEntry.date),
            expectedScheduleImageUrl: cleanedEntry.expectedScheduleImageUrl,
            actualScheduleImageUrl: cleanedEntry.actualScheduleImageUrl,
            reflectionText: cleanedEntry.reflectionText,
            dayX: await calculateDayX(cleanedEntry.date),
            hasReflection: cleanedEntry.reflectionText.length > 0,
            hasExpectedSchedule: cleanedEntry.expectedScheduleImageUrl.length > 0,
            hasActualSchedule: cleanedEntry.actualScheduleImageUrl.length > 0,
            imageStatus: {
                expectedScheduleImageUrl: expectedStatus,
                actualScheduleImageUrl: actualStatus
            }
        }

        // Validate response
        entryWithImageStatusSchema.parse(response)
        return NextResponse.json(response)
    } catch (error) {
        console.error("Error updating entry:", error)
        return NextResponse.json(
            { error: "Failed to update entry" },
            { status: 500 }
        )
    }
}
