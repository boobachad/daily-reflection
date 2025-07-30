"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getCurrentMonthAndYear,
  getDaysInMonth,
  isToday,
  parseDateFromUrl,
  getPreviousMonth,
  getNextMonth,
  formatMonthName,
  dateToApiFormat
} from "@/lib/date-utils"
import { DateTime } from "luxon"
import { cn } from "@/lib/utils"

interface CalendarDay {
  day: number
  dateString: string
  hasEntry: boolean
  isToday: boolean
  isFlameDay: boolean
}

interface MonthData {
  year: number
  month: number
  name: string
  days: CalendarDay[]
}


export default function StreakHeader() {
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)

  const [currentMonth, setCurrentMonth] = useState<MonthData | null>(null)
  const [streakCount, setStreakCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  //new
  const [autoScrollToToday, setAutoScrollToToday] = useState(true);
  const [touchStart, setTouchStart] = useState(0);


  // Fetch the current month data
  useEffect(() => {
    async function fetchMonthData() {
      setIsLoading(true);
      // Get date from URL if available
      const dateFromUrl = pathname.startsWith('/entries/')
        ? parseDateFromUrl(pathname)
        : null;

      const initialDate = dateFromUrl?.isValid ? dateFromUrl : DateTime.local();

      const { month, year } = dateFromUrl?.isValid
        ? { month: initialDate.month, year: initialDate.year }
        : getCurrentMonthAndYear();

      setAutoScrollToToday(!dateFromUrl?.isValid);
      await loadMonthData(year, month);
      setIsLoading(false);
    }
    fetchMonthData();
  }, [pathname]);

  // Scroll to today when month data is loaded
  useEffect(() => {
    if (currentMonth && autoScrollToToday && todayRef.current && scrollRef.current) {
      todayRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentMonth, autoScrollToToday]);

  // Load data for a specific month
  async function loadMonthData(year: number, month: number) {
    try {
      const dt = DateTime.local(year, month)
      const monthName = formatMonthName(dt)
      const prevDt = getPreviousMonth(dt)
      const nextDt = getNextMonth(dt)

      const daysInMonth = getDaysInMonth(year, month)
      const dateStrings = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        return dateToApiFormat(DateTime.local(year, month, day))
      })

      const [entriesResponse, streakResponse] = await Promise.all([
        fetch(`/api/entries/dates?start_date=${dateStrings[0]}&end_date=${dateStrings[dateStrings.length - 1]}`),
        fetch("/api/entries/streak")
      ])

      const [entriesData, streakData] = await Promise.all([
        entriesResponse.json(),
        streakResponse.json()
      ])

      setStreakCount(streakData.streak)

      // Normalize all entry dates to YYYY-MM-DD
      const normalizedEntryDates = entriesData.dates.map((d: string) => d.slice(0, 10))

      const days: CalendarDay[] = dateStrings.map((dateString, i) => ({
        day: i + 1,
        dateString,
        hasEntry: normalizedEntryDates.includes(dateString),
        isToday: isToday(dateString),
        isFlameDay: streakData.flameDates.includes(dateString)
      }))

      setCurrentMonth({
        year,
        month,
        name: monthName,
        days,
      })
    } catch (error) {
      console.error("Error loading month data:", error)
    }
  }

  function goToPrevMonth() {
    if (!currentMonth) return
    const prevDate = getPreviousMonth(DateTime.local(currentMonth.year, currentMonth.month))
    loadMonthData(prevDate.year, prevDate.month)
  }

  function goToNextMonth() {
    if (!currentMonth) return
    const nextDate = getNextMonth(DateTime.local(currentMonth.year, currentMonth.month))
    loadMonthData(nextDate.year, nextDate.month)
  }

  if (isLoading) {
    return (
      <header className="sticky top-0 z-10 bg-background">
        <div className="h-20 flex items-center justify-center">
          <div className="animate-pulse flex space-x-4">
            <div className="h-4 w-24 bg-muted rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-10 bg-background">
      {/* Top section with fixed width for month navigation */}
      <div className="h-20 px-6 flex items-center justify-between">
        <div className="w-1/3 flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevMonth}
            className="text-muted-foreground hover:text-foreground min-w-[120px] text-left"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            {currentMonth ? formatMonthName(getPreviousMonth(DateTime.local(currentMonth.year, currentMonth.month))) : ''}
          </Button>
        </div>

        <div className="w-1/3 text-center">
          <h2 className="text-xl font-bold text-foreground">
            {currentMonth?.name} {currentMonth?.year}
          </h2>
        </div>

        <div className="w-1/3 flex justify-end gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="text-muted-foreground hover:text-foreground min-w-[120px] text-right"
          >
            {currentMonth ? formatMonthName(getNextMonth(DateTime.local(currentMonth.year, currentMonth.month))) : ''}
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
          {/* Streak counter - orange accent */}
          <div className="flex items-center gap-2 bg-orange-900 px-4 py-2 rounded-full">
            <Flame className="h-5 w-5 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">
              {streakCount} day streak
            </span>
          </div>
        </div>
      </div>

      {/* Calendar days */}
      <ScrollArea className="h-16">
        <div className="flex items-center justify-center h-full px-4">
          {currentMonth?.days.map((day: CalendarDay) => (
            <Link key={day.dateString} href={`/entries/${day.dateString}`} passHref>
              <div
                ref={day.isToday ? todayRef : null}
                className={cn(
                  "mx-1 flex items-center justify-center w-10 h-10 rounded-full transition-all relative",
                  day.isFlameDay
                    ? "bg-orange-500"
                    : day.isToday
                      ? "bg-primary text-primary-foreground"
                    : day.hasEntry
                        ? "bg-card text-foreground"
                        : "text-muted-foreground hover:bg-muted"
                )}
              >
                {day.isFlameDay ? (
                  <Flame className="h-10 w-10 text-white z-10" />
                ) : (
                  <span className="z-0 relative">{day.day}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </header>
  )
}
