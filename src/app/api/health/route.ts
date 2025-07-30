import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/server/db"
import { EntryModel } from "@/models/entry"
import { ApiHealth } from "@/types/entry"
import { healthSchema } from "@/types/entry/validation"

export async function GET() {
    try {
        await connectToDatabase()

        // Check if we can find at least one entry
        const entry = await EntryModel.findOne()

        const response: ApiHealth = {
            status: entry ? "healthy" : "unhealthy"
        }
        healthSchema.parse(response)

        return NextResponse.json(response)
    } catch (error) {
        console.error("Health check failed:", error)
        const response: ApiHealth = {
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Unknown error"
        }
        healthSchema.parse(response)

        return NextResponse.json(response)
    }
}