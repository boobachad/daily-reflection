import { type NextRequest, NextResponse } from "next/server"
import { EntryModel, type EntryWithImageStatus, calculateDayX, type DbEntry } from "@/models/entry"
import { connectToDatabase } from "@/lib/server/db"
import { getTodayDateString, utcDateToDateString, isPastDate } from "@/lib/date-utils"
import { apiEntryInputSchema, entryWithImageStatusSchema } from "@/types/entry/validation"
import { processFileUpload, processBase64Image, deleteFile, checkImageStatus, cleanupInvalidImageUrls, downloadAndSaveImageFromUrl } from "@/lib/upload"

export async function PUT(
    request: NextRequest,
    { params }: { params: { date_string: string } }
) {
    try {
        await connectToDatabase()
        const resolvedParams = await params;
        const dateString = resolvedParams.date_string;
        const today = getTodayDateString()

        // Forbid editing past entries
        if (isPastDate(dateString)) {
            return NextResponse.json(
                { error: "Cannot modify past entries" },
                { status: 403 }
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

        // Handle expected schedule image
        if (expectedScheduleFile) {
            validatedData.expectedScheduleImageUrl = await processFileUpload(expectedScheduleFile, 'expectedschedule')
        } else if (expectedScheduleBase64) {
            validatedData.expectedScheduleImageUrl = await processBase64Image(expectedScheduleBase64, 'expectedschedule')
        } else if (validatedData.expectedScheduleImageUrl && validatedData.expectedScheduleImageUrl.startsWith("https://napchart.com/api/v2/getImage?chartid=")) {
            // Download and save Napchart image
            const chartId = validatedData.expectedScheduleImageUrl.split("chartid=")[1]?.split("&")[0] || "napchart"
            const fileName = `expectedschedule-napchart-${chartId}-${Date.now()}.png`
            validatedData.expectedScheduleImageUrl = await downloadAndSaveImageFromUrl(validatedData.expectedScheduleImageUrl, fileName)
        }

        // Handle actual schedule image
        if (actualScheduleFile) {
            validatedData.actualScheduleImageUrl = await processFileUpload(actualScheduleFile, 'actualschedule')
        } else if (actualScheduleBase64) {
            validatedData.actualScheduleImageUrl = await processBase64Image(actualScheduleBase64, 'actualschedule')
        } else if (validatedData.actualScheduleImageUrl && validatedData.actualScheduleImageUrl.startsWith("https://napchart.com/api/v2/getImage?chartid=")) {
            // Download and save Napchart image
            const chartId = validatedData.actualScheduleImageUrl.split("chartid=")[1]?.split("&")[0] || "napchart"
            const fileName = `actualschedule-napchart-${chartId}-${Date.now()}.png`
            validatedData.actualScheduleImageUrl = await downloadAndSaveImageFromUrl(validatedData.actualScheduleImageUrl, fileName)
        }

        // Find existing entry
        let entry = await EntryModel.findOne({ date: new Date(dateString) })

        if (entry) {
            // Only update fields present in the request; preserve others
            if (Object.prototype.hasOwnProperty.call(validatedData, 'expectedScheduleImageUrl')) {
                // ENFORCE: Only one image per type per entry
                if (validatedData.expectedScheduleImageUrl && entry.expectedScheduleImageUrl && validatedData.expectedScheduleImageUrl !== entry.expectedScheduleImageUrl) {
                await deleteFile(entry.expectedScheduleImageUrl)
                }
                entry.expectedScheduleImageUrl = validatedData.expectedScheduleImageUrl
            }
            if (Object.prototype.hasOwnProperty.call(validatedData, 'actualScheduleImageUrl')) {
                // ENFORCE: Only one image per type per entry
                if (validatedData.actualScheduleImageUrl && entry.actualScheduleImageUrl && validatedData.actualScheduleImageUrl !== entry.actualScheduleImageUrl) {
                await deleteFile(entry.actualScheduleImageUrl)
                }
                entry.actualScheduleImageUrl = validatedData.actualScheduleImageUrl
            }
            if (Object.prototype.hasOwnProperty.call(validatedData, 'reflectionText')) {
                entry.reflectionText = validatedData.reflectionText
            }
            await entry.save()
        } else {
            // Create new entry
            entry = await EntryModel.create(validatedData)
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

export async function GET(
    request: NextRequest,
    { params }: { params: { date_string: string } }
) {
    try {
        await connectToDatabase()
        const dateString = params.date_string

        const entry = await EntryModel.findOne({ date: new Date(dateString) })
        if (!entry) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 }
            )
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
        console.error("Error getting entry:", error)
        return NextResponse.json(
            { error: "Failed to get entry" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { date_string: string } }
) {
    try {
        await connectToDatabase()
        const dateString = params.date_string
        const today = getTodayDateString()

        // Forbid deleting past entries
        if (isPastDate(dateString)) {
            return NextResponse.json(
                { error: "Cannot delete past entries" },
                { status: 403 }
            )
        }

        const entry = await EntryModel.findOne({ date: new Date(dateString) })
        if (!entry) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 }
            )
        }

        // Delete associated images
        if (entry.expectedScheduleImageUrl) {
            await deleteFile(entry.expectedScheduleImageUrl)
        }
        if (entry.actualScheduleImageUrl) {
            await deleteFile(entry.actualScheduleImageUrl)
        }

        await entry.deleteOne()
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting entry:", error)
        return NextResponse.json(
            { error: "Failed to delete entry" },
            { status: 500 }
        )
    }
}