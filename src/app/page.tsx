import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getTodayDateString, getTomorrowDateString, entryExistsForDate } from "@/lib/date-utils"
import { connectToDatabase } from "@/lib/server/db"
import { EntryModel } from "@/models/entry"
import { dateStringToUtcDate } from "@/lib/date-utils"
import { Sparkles, Calendar, ListChecks } from "lucide-react"
import RotatingText from "@/components/reactbits/RotatingText"
import HeatmapSection from "@/components/heatmap/heatmap-section"

async function getEntryStatus(dateString: string): Promise<boolean> {
  await connectToDatabase()
  return entryExistsForDate(dateString, EntryModel)
}

export default async function Home() {
  const todayString = getTodayDateString()
  const tomorrowString = getTomorrowDateString()

  const hasTodayEntry = await getEntryStatus(todayString)
  const hasTomorrowEntry = await getEntryStatus(tomorrowString)

  const todayButtonText = hasTodayEntry ? "Edit Today" : "Plan Today"
  const tomorrowButtonText = hasTomorrowEntry ? "Edit Tomorrow" : "Plan Tomorrow"
  const todayDescription = hasTodayEntry ? "Continue working on today's plan" : "Start planning your perfect day"
  const tomorrowDescription = hasTomorrowEntry ? "Review and adjust tomorrow's plan" : "Get a head start on tomorrow"

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-900 text-blue-400 mb-4 border border-border">
            <Sparkles className="h-5 w-5 mr-2 text-blue-400" />
            <span className="text-sm font-medium">Daily Productivity System</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground">
            Plan Your{" "}
            <span className="relative inline-block">
              <RotatingText
                texts={["Im-Perfect", "Productive", "Balanced", "Focused", "Mindful"]}
                mainClassName="px-2 sm:px-2 md:px-3 bg-[#9400ff] text-white overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
                staggerFrom={"last"}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2000}
              />
            </span>{" "}
            Day
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Design your schedule and track your progress.
          </p>
        </section>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-border bg-card hover:shadow-lg transition-all">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground flex items-center gap-2">
                <span className="bg-background text-muted-foreground p-2 rounded-lg border border-border">
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </span>
                Today&apos;s Plan
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {todayDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Link href={`/entries/${todayString}`} passHref>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
                  {todayButtonText}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-lg transition-all">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground flex items-center gap-2">
                <span className="bg-background text-muted-foreground p-2 rounded-lg border border-border">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </span>
                Tomorrow&apos;s Plan
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {tomorrowDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Link href={`/entries/${tomorrowString}`} passHref>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
                  {tomorrowButtonText}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* View All Entries */}
        <div className="text-center mt-16">
          <Link href="/entries" passHref>
            <Button
              variant="outline"
              className="border-border text-foreground bg-transparent hover:bg-muted"
            >
              View All Entries
            </Button>
          </Link>
        </div>

        {/* Activity Heatmap Section */}
        <div className="mt-16">
          <HeatmapSection />
        </div>
      </div>
    </div>
  )
}
