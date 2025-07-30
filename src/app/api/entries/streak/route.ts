import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/server/db"
import { EntryModel } from "@/models/entry"
import { ApiStreak } from "@/types/entry"
import { streakSchema } from "@/types/entry/validation"

export async function GET() {
    try {
        await connectToDatabase()

        let flameDates: string[] = []
        let currentDate = new Date()
        const todayString = currentDate.toISOString().slice(0, 10)

        // Find all entries in the past up to today
        const entries = await EntryModel.find({
            date: { $lte: new Date(todayString + 'T23:59:59.999Z') }
        }).lean()

        // Mark all flame days (debug: collect all, not just consecutive)
        for (const entry of entries) {
            const dateStr = new Date(entry.date).toISOString().slice(0, 10)
            const hasReflection = entry.reflectionText && entry.reflectionText.length > 0
            const hasSchedule = (entry.expectedScheduleImageUrl && entry.expectedScheduleImageUrl.length > 0) ||
                (entry.actualScheduleImageUrl && entry.actualScheduleImageUrl.length > 0)
            if (hasReflection && hasSchedule) {
                flameDates.push(dateStr)
            }
        }
        flameDates = flameDates.sort()

        // Streak logic: count consecutive flame days ending at today or yesterday
        let streak = 0
        if (flameDates.length > 0) {
            const todayStr = todayString
            const yesterday = new Date(todayString)
            yesterday.setDate(yesterday.getDate() - 1)
            const yestStr = yesterday.toISOString().slice(0, 10)

            // Helper to count consecutive flame days ending at a given date
            function countConsecutiveUpTo(targetDate: string) {
                let dt = new Date(targetDate)
                let idx = flameDates.length - 1
                let count = 0
                while (idx >= 0) {
                    const dateStr = dt.toISOString().slice(0, 10)
                    if (flameDates[idx] === dateStr) {
                        count++
                        dt.setDate(dt.getDate() - 1)
                        idx--
                    } else {
                        break
                    }
                }
                return count
            }

            if (flameDates.includes(todayStr)) {
                streak = countConsecutiveUpTo(todayStr)
            } else if (flameDates.includes(yestStr)) {
                streak = countConsecutiveUpTo(yestStr)
            } else {
                streak = 0
            }
        }

        const response = { streak, flameDates }
        streakSchema.parse(response)

        return NextResponse.json(response)
    } catch (error) {
        console.error("Error calculating streak:", error)
        return NextResponse.json({ streak: 0 })
    }
}
