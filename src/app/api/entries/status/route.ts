import { type NextRequest, NextResponse } from "next/server"
import { EntryModel } from "@/models/entry"
import { connectToDatabase } from "@/lib/server/db"
import { getTodayDateString } from "@/lib/date-utils"
import { ApiEntryStatus } from "@/types/entry"
import { entryStatusSchema } from "@/types/entry/validation"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const today = getTodayDateString()
    const todayDate = new Date(today)

    const total = await EntryModel.countDocuments()
    const withReflection = await EntryModel.countDocuments({ reflectionText: { $ne: "" } })
    const withExpectedSchedule = await EntryModel.countDocuments({ expectedScheduleImageUrl: { $ne: "" } })
    const withActualSchedule = await EntryModel.countDocuments({ actualScheduleImageUrl: { $ne: "" } })
    const hasTodayEntry = await EntryModel.exists({ date: todayDate })

    const response: ApiEntryStatus = {
      total,
      withReflection,
      withExpectedSchedule,
      withActualSchedule,
      hasTodayEntry: !!hasTodayEntry
    }
    entryStatusSchema.parse(response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error getting entry status:", error)
    return NextResponse.json(
      { error: "Failed to get entry status" },
      { status: 500 }
    )
  }
}
