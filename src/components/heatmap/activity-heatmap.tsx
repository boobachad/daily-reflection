"use client";
import React, { useState, useEffect } from "react";
import { ActivityData, CombinedActivityData } from "@/lib/heatmap/types";
import { normalizeDate } from "@/lib/heatmap/data-transformer";
import { AdaptiveTooltip } from "@/components/ui/adaptive-tooltip";
import { HeatmapLoadingState } from "./heatmap-loadingstate";

interface ActivityHeatmapProps {
    combinedData: CombinedActivityData[];
    loading?: boolean;
    error?: string | null;
}

export const ActivityHeatmap = ({
    combinedData,
    loading = false,
    error = null,
}: ActivityHeatmapProps) => {
    const [showLoadingState, setShowLoadingState] = useState(true); // Always start with loading animation

    // Handle loading state completion - always allow the animation to complete
    const handleLoadingComplete = () => {
        setShowLoadingState(false);
    };

    // Show loading state if we're loading OR if the loading animation hasn't completed yet
    const shouldShowLoading = loading || showLoadingState;

    // If we should show loading, show the loading state
    // Always pass the onComplete callback so the animation can finish regardless of data arrival
    if (shouldShowLoading) {
        return <HeatmapLoadingState onComplete={handleLoadingComplete} />;
    }
    // Data processing adapted from testing-heatmap/components/LeetCodeHeatmap.tsx
    const getData = () => {
        // Early exit if no data
        if (!combinedData || combinedData.length === 0) {
            return [];
        }

        // Generate calendar months with improved date handling
        // Referenced from testing-heatmap LeetCodeHeatmap component
        const now = new Date();
        const endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999); // End of current day

        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 11); // Go back 12 months (including current)
        startDate.setDate(1); // Start at the first day of month
        startDate.setHours(0, 0, 0, 0); // Start of day

        const months: { name: string; days: CombinedActivityData[] }[] = [];

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            // Get days in month using last day calculation (more reliable)
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            const monthDays: CombinedActivityData[] = [];
            for (let day = 1; day <= daysInMonth; day++) {
                // Use the date utility function for consistent formatting
                const dayDate = new Date(year, month, day);
                const dateStr = normalizeDate(dayDate.toString());
                monthDays.push({
                    date: dateStr,
                    count: 0,
                    githubCount: 0,
                    leetcodeCount: 0,
                    productivityScore: 0,
                    totalActivity: 0,
                });
            }

            months.push({
                name: currentDate.toLocaleString("default", {
                    month: "short",
                    year: "numeric"
                }),
                days: monthDays,
            });

            // Move to first day of next month (avoiding date arithmetic issues)
            currentDate.setMonth(currentDate.getMonth() + 1);
            currentDate.setDate(1);
        }

        // Create activity map for efficient lookup
        const activityMap = new Map<string, CombinedActivityData>();
        combinedData.forEach((activity) => {
            if (activity.date) {
                activityMap.set(activity.date, activity);
            }
        });

        // Improved data merging with robust date parsing
        // Referenced from testing-heatmap LeetCodeHeatmap data processing
        const monthMap = new Map<string, number>();
        months.forEach((m, index) => {
            if (m.days.length > 0) {
                const key = m.days[0].date.slice(0, 7);
                monthMap.set(key, index);
            }
        });

        // Merge actual activity data into the calendar structure
        activityMap.forEach((activity, date) => {
            try {
                if (!date) {
                    console.warn("Activity with missing date found");
                    return;
                }

                const normalizedDate = normalizeDate(date);
                if (!normalizedDate) {
                    console.warn("Could not normalize date:", date);
                    return;
                }

                const key = normalizedDate.slice(0, 7);
                const monthIndex = monthMap.get(key);

                if (monthIndex !== undefined) {
                    // Extract day from YYYY-MM-DD format
                    const parts = normalizedDate.split("-");
                    if (parts.length === 3) {
                        const day = parseInt(parts[2], 10);

                        // Ensure day is within valid range
                        if (day > 0 && day <= months[monthIndex].days.length) {
                            const dayIndex = day - 1;
                            if (months[monthIndex].days[dayIndex]) {
                                // Replace the empty day with actual activity data
                                months[monthIndex].days[dayIndex] = {
                                    ...activity,
                                    date: normalizedDate,
                                };
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(
                    "Error processing activity date:",
                    err,
                    "for date:",
                    date
                );
            }
        });

        return months;
    };

    const data = getData();

    // Color class function adapted from testing-heatmap LeetCodeHeatmap
    const getColorClass = (activity: CombinedActivityData) => {
        const count = activity.totalActivity;

        const baseColors = [
            "bg-gray-100",
            "bg-green-200",
            "bg-green-400",
            "bg-green-600",
            "bg-green-800",
        ];

        const darkColors = [
            "dark:bg-gray-800",
            "dark:bg-yellow-900",
            "dark:bg-yellow-700",
            "dark:bg-yellow-500",
            "dark:bg-yellow-300",
        ];

        const thresholds = [0, 1, 4, 7, 10];

        for (let i = thresholds.length - 1; i >= 0; i--) {
            if (count >= thresholds[i]) {
                return `${baseColors[i]} ${darkColors[i]}`;
            }
        }
        return `${baseColors[0]} ${darkColors[0]}`;
    };

    // Chunk days into weeks (7 days each)
    const chunkedDays = (days: CombinedActivityData[], size: number) => {
        const chunks: CombinedActivityData[][] = [];
        for (let i = 0; i < days.length; i += size) {
            chunks.push(days.slice(i, i + size));
        }
        return chunks;
    };

    // This section is now handled above with the state-based approach

    // Error state
    if (error) {
        return (
            <div className="w-full text-center py-6 text-destructive">
                <p>Error loading activity data: {error}</p>
            </div>
        );
    }

    // Empty state - referenced from testing-heatmap LeetCodeHeatmap
    if (data.length === 0) {
        return (
            <div className="w-full text-center py-6 text-muted-foreground">
                <p>
                    No activity data available. Configure GitHub and LeetCode usernames to view contributions.
                </p>
            </div>
        );
    }

    return (
        <div
            className="w-full overflow-x-auto pb-1"
            role="region"
            aria-label="Activity heatmap by month">
            <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-3 md:gap-4 max-w-fit mx-auto">
                    {data.map((month, monthIndex) => {
                        const columns = chunkedDays(month.days, 7);
                        // Use a more stable key format including month name
                        const monthKey = `month-${monthIndex}-${month.name}`;

                        return (
                            <div key={monthKey} className="flex flex-col">
                                <div className="text-sm sm:text-sm font-medium mb-2 sm:mb-2">
                                    {month.name}
                                </div>
                                <div className="flex gap-[4px] p-1 sm:gap-[3px]">
                                    {columns.map((column, colIndex) => (
                                        <div
                                            key={`col-${monthKey}-${colIndex}`}
                                            className="flex flex-col gap-[4px] sm:gap-[3px]">
                                            {column.map((day, dayIndex) => (
                                                <AdaptiveTooltip
                                                    key={`day-${day.date}-${dayIndex}`}
                                                    content={
                                                        <>
                                                            <span className="font-medium">
                                                                {new Date(day.date).toLocaleDateString(
                                                                    undefined,
                                                                    {
                                                                        weekday: "short",
                                                                        month: "short",
                                                                        day: "numeric",
                                                                        year: "numeric",
                                                                    }
                                                                )}
                                                            </span>
                                                            <br />
                                                            <span>
                                                                GitHub: {day.githubCount} | LeetCode: {day.leetcodeCount}
                                                            </span>
                                                            <br />
                                                            <span>
                                                                Productivity: {day.productivityScore} | Total: {day.totalActivity}
                                                            </span>
                                                        </>
                                                    }>
                                                    <div
                                                        className={`w-[12px] h-[12px] sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded transition-colors duration-200 hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-500 hover:ring-offset-0 ${getColorClass(
                                                            day
                                                        )}`}
                                                        role="gridcell"
                                                        aria-label={`${day.date}: ${day.totalActivity} total activities (GitHub: ${day.githubCount}, LeetCode: ${day.leetcodeCount}, Productivity: ${day.productivityScore})`}
                                                    />
                                                </AdaptiveTooltip>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ActivityHeatmap;