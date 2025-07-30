// Combined data processing utilities for GitHub, LeetCode, and productivity data
// Referenced from testing-heatmap/components/ActivityDashboard.tsx getCombinedData function

import { ActivityData, CombinedActivityData, HeatmapStats } from "./types";
import { calculateCombinedStats } from "./streak-calculator";
import { normalizeDate } from "./data-transformer";

/**
 * Merge GitHub, LeetCode, and productivity data by date
 * Referenced from testing-heatmap ActivityDashboard getCombinedData function
 */
export function combineActivityData(
    githubData: ActivityData[],
    leetcodeData: ActivityData[],
    productivityData: ActivityData[] = []
): CombinedActivityData[] {
    // Create maps for each data source for efficient lookup
    const githubMap = new Map<string, number>();
    const leetcodeMap = new Map<string, number>();
    const productivityMap = new Map<string, number>();

    // Populate GitHub data map with date normalization
    githubData.forEach((activity) => {
        try {
            if (!activity.date) {
                console.warn("GitHub activity with missing date found");
                return;
            }

            const normalizedDate = normalizeDate(activity.date);
            if (normalizedDate) {
                githubMap.set(normalizedDate, (githubMap.get(normalizedDate) || 0) + activity.count);
            }
        } catch (err) {
            console.error("Error processing GitHub activity:", err, "for date:", activity.date);
        }
    });

    // Populate LeetCode data map with date normalization
    leetcodeData.forEach((activity) => {
        try {
            if (!activity.date) {
                console.warn("LeetCode activity with missing date found");
                return;
            }

            const normalizedDate = normalizeDate(activity.date);
            if (normalizedDate) {
                leetcodeMap.set(normalizedDate, (leetcodeMap.get(normalizedDate) || 0) + activity.count);
            }
        } catch (err) {
            console.error("Error processing LeetCode activity:", err, "for date:", activity.date);
        }
    });

    // Populate productivity data map with date normalization
    productivityData.forEach((activity) => {
        try {
            if (!activity.date) {
                console.warn("Productivity activity with missing date found");
                return;
            }

            const normalizedDate = normalizeDate(activity.date);
            if (normalizedDate) {
                productivityMap.set(normalizedDate, (productivityMap.get(normalizedDate) || 0) + activity.count);
            }
        } catch (err) {
            console.error("Error processing productivity activity:", err, "for date:", activity.date);
        }
    });

    // Get all unique dates from all sources
    const allDates = new Set<string>([
        ...githubMap.keys(),
        ...leetcodeMap.keys(),
        ...productivityMap.keys(),
    ]);

    // Create combined activity data
    const combinedData: CombinedActivityData[] = Array.from(allDates)
        .map((date) => {
            const githubCount = githubMap.get(date) || 0;
            const leetcodeCount = leetcodeMap.get(date) || 0;
            const productivityScore = productivityMap.get(date) || 0;
            const totalActivity = githubCount + leetcodeCount + productivityScore;

            return {
                date,
                count: totalActivity,
                githubCount,
                leetcodeCount,
                productivityScore,
                totalActivity,
            };
        })
        .filter((activity) => activity.date !== "") // Filter out invalid dates
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date

    return combinedData;
}

/**
 * Get combined data with comprehensive statistics
 * Following testing-heatmap ActivityDashboard patterns
 */
export function getCombinedDataWithStats(
    githubData: ActivityData[],
    leetcodeData: ActivityData[],
    productivityData: ActivityData[] = []
): {
    combinedData: CombinedActivityData[];
    stats: HeatmapStats;
    isEmpty: boolean;
} {
    // Early return if no data
    if (githubData.length === 0 && leetcodeData.length === 0 && productivityData.length === 0) {
        return {
            combinedData: [],
            stats: {
                currentStreak: 0,
                longestStreak: 0,
                totalContributions: 0,
                averagePerDay: 0,
                bestDay: { date: "", count: 0 },
                productivityRate: 0,
                scheduleAdherence: 0,
            },
            isEmpty: true,
        };
    }

    // Combine all activity data
    const combinedData = combineActivityData(githubData, leetcodeData, productivityData);

    // Calculate comprehensive statistics
    const stats = calculateCombinedStats(githubData, leetcodeData, productivityData);

    return {
        combinedData,
        stats,
        isEmpty: combinedData.length === 0,
    };
}

/**
 * Create activity map for heatmap visualization
 * Referenced from testing-heatmap data processing patterns
 */
export function createActivityMap(combinedData: CombinedActivityData[]): Map<string, CombinedActivityData> {
    const activityMap = new Map<string, CombinedActivityData>();

    combinedData.forEach((activity) => {
        if (activity.date) {
            activityMap.set(activity.date, activity);
        }
    });

    return activityMap;
}

/**
 * Generate date range for heatmap display (last 12 months)
 * Following testing-heatmap calendar generation patterns
 */
export function generateHeatmapDateRange(): string[] {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const dates: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dateStr = normalizeDate(currentDate.toString());
        if (dateStr) {
            dates.push(dateStr);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

/**
 * Fill missing dates with zero activity
 * Ensures consistent data for heatmap visualization
 */
export function fillMissingDates(
    combinedData: CombinedActivityData[],
    dateRange: string[]
): CombinedActivityData[] {
    const activityMap = createActivityMap(combinedData);

    return dateRange.map((date) => {
        const existingActivity = activityMap.get(date);

        if (existingActivity) {
            return existingActivity;
        }

        // Create empty activity for missing dates
        return {
            date,
            count: 0,
            githubCount: 0,
            leetcodeCount: 0,
            productivityScore: 0,
            totalActivity: 0,
        };
    });
}