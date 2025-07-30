import { type NextRequest, NextResponse } from "next/server"
import { EntryModel } from "@/models/entry"
import { connectToDatabase } from "@/lib/server/db"
import { ApiEntryDates } from "@/types/entry"
import { entryDatesSchema } from "@/types/entry/validation"

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase()

        const entries = await EntryModel.find()
            .select("date")
            .sort({ date: 1 })
            .lean()

        const dates = entries.map(entry => entry.date)

        const response: ApiEntryDates = {
            dates
        }
        entryDatesSchema.parse(response)

        return NextResponse.json(response)
    } catch (error) {
        console.error("Error getting entry dates:", error)
        return NextResponse.json(
            { error: "Failed to get entry dates" },
            { status: 500 }
        )
    }
}
