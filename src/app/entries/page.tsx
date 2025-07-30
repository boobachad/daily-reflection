import Link from "next/link"
import { connectToDatabase } from "@/lib/server/db"
import { EntryModel, calculateDayX } from "@/models/entry"
import type { DbEntry } from "@/models/entry"
import { utcDateToDateString, formatDateForDisplay, getTodayDateString } from "@/lib/date-utils"
import { ArrowLeft, CalendarDays, NotebookText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApiEntry } from "@/types/entry"
import { EntriesList } from "@/components/entries/entries-list"

interface EntryWithDayX extends Omit<ApiEntry, 'date'> {
    id: string
    date: string // Keep as string for display purposes
    formattedDate: string
    dayX: number
    hasReflection: boolean
    hasActualSchedule: boolean
    hasExpectedSchedule: boolean
}

async function getEntries(): Promise<EntryWithDayX[]> {
    await connectToDatabase()

    const entries = (await EntryModel.find().sort({ date: -1 }).lean()) as unknown as DbEntry[]

    const entriesWithDayX = await Promise.all(
        entries.map(async (entry) => {
            const dayX = await calculateDayX(entry.date)
            const dateString = utcDateToDateString(entry.date)

            return {
                id: entry._id.toString(),
                date: dateString,
                formattedDate: formatDateForDisplay(dateString),
                dayX,
                hasReflection: !!entry.reflectionText && entry.reflectionText.length > 0,
                hasActualSchedule: !!entry.actualScheduleImageUrl,
                hasExpectedSchedule: !!entry.expectedScheduleImageUrl,
                expectedScheduleImageUrl: entry.expectedScheduleImageUrl || "",
                actualScheduleImageUrl: entry.actualScheduleImageUrl || "",
                reflectionText: entry.reflectionText || "",
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt
            }
        }),
    )

    return entriesWithDayX
}

export default async function EntriesPage() {
    const entries = await getEntries()
    const todayString = getTodayDateString()

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-foreground">
                            Your Journal Entries
                        </h1>
                        <div className="flex items-center text-muted-foreground">
                            <CalendarDays className="h-5 w-5 mr-2" />
                            <p className="text-lg">{entries.length} {entries.length === 1 ? 'day' : 'days'} recorded</p>
                        </div>
                    </div>
                    <Link
                        href="/"
                        className="text-sm font-medium flex items-center text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Home
                    </Link>
                </div>

                {/* Entries Grid */}
                {entries.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-xl border border-border">
                        <NotebookText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-medium text-foreground mb-2">No entries yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Start your journey by creating your first entry.
                        </p>
                        <Link href={`/entries/${todayString}`} className="mt-6 inline-block">
                            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
                                Create First Entry
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <EntriesList entries={entries} />
                )}
            </div>
        </div>
    )
}
