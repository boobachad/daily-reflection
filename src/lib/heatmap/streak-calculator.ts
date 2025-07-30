// Streak calculation logic for combined GitHub and LeetCode activity
// Copied and adapted from testing-heatmap/lib/calculateStreaks.ts

import { ActivityData, HeatmapStats } from "./types";

export const calculateStreaks = (activities: ActivityData[]): HeatmapStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfYear = new Date(today.getFullYear() - 1, 0, 1);
    startOfYear.setHours(0, 0, 0, 0);

    // Merge activities by date with robust date handling
    const activityMap = new Map<string, number>();
    activities.forEach(({ date, count }) => {
        try {
            if (!date) return;

            // Handle date strings directly if they're already in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                activityMap.set(date, (activityMap.get(date) || 0) + count);
                return;
            }

            // Create a new Date object for other formats
            const activityDate = new Date(date);

            if (!isNaN(activityDate.getTime())) {
                // Format date consistently to avoid timezone issues
                const year = activityDate.getFullYear();
                const month = String(activityDate.getMonth() + 1).padStart(2, "0");
                const day = String(activityDate.getDate()).padStart(2, "0");
                const dateStr = `${year}-${month}-${day}`;

                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + count);
            }
        } catch (err) {
            console.error("Invalid date format:", err, "for date:", date);
        }
    });

    // Filter activities for the current year
    const filteredActivities = Array.from(activityMap.entries())
        .map(([date, count]) => ({ date, count }))
        .filter(({ date }) => {
            const activityDate = new Date(date);
            return activityDate >= startOfYear && activityDate <= today;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Create a set of days with activity for faster lookup
    const activeDays = new Set<string>();
    filteredActivities.forEach(({ date, count }) => {
        if (count > 0) {
            activeDays.add(date);
        }
    });

    // Calculate current streak correctly
    let currentStreak = 0;
    const currentDate = new Date(today);

    // If today has no activity, check if yesterday had activity
    // (to handle case where user hasn't done anything today yet)
    const formatDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const todayStr = formatDateString(currentDate);
    if (!activeDays.has(todayStr)) {
        currentDate.setDate(currentDate.getDate() - 1);
        const yesterdayStr = formatDateString(currentDate);
        if (!activeDays.has(yesterdayStr)) {
            // If neither today nor yesterday has activity, streak is 0
            currentStreak = 0;
        } else {
            // Start counting from yesterday
            while (currentDate >= startOfYear) {
                const dateStr = formatDateString(currentDate);
                if (activeDays.has(dateStr)) {
                    currentStreak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }
    } else {
        // Today has activity, start counting from today
        while (currentDate >= startOfYear) {
            const dateStr = formatDateString(currentDate);
            if (activeDays.has(dateStr)) {
                currentStreak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
    }

    // Calculate longest streak
    let longestStreak = currentStreak > 0 ? currentStreak : 0;

    // Find all continuous streaks in the year
    let streak = 0;
    let lastActiveDay: Date | null = null;

    filteredActivities.forEach(({ date, count }) => {
        if (count > 0) {
            const activityDate = new Date(date);

            if (lastActiveDay === null) {
                // First day with activity
                streak = 1;
            } else {
                // Check if this activity is consecutive with the last one
                const dayDiff = Math.floor(
                    (activityDate.getTime() - lastActiveDay.getTime()) /
                    (24 * 60 * 60 * 1000)
                );

                if (dayDiff === 1) {
                    // Consecutive day
                    streak++;
                } else if (dayDiff > 1) {
                    // Break in the streak
                    longestStreak = Math.max(longestStreak, streak);
                    streak = 1;
                }
                // dayDiff should never be 0 as we've merged activities by date
            }

            lastActiveDay = activityDate;
            longestStreak = Math.max(longestStreak, streak);
        }
    });

    // Calculate total contributions and best day
    let totalContributions = 0;
    let bestDay = { date: "", count: 0 };
    filteredActivities.forEach(({ date, count }) => {
        totalContributions += count;
        if (count > bestDay.count) {
            bestDay = { date, count };
        }
    });

    const averagePerDay =
        filteredActivities.length > 0
            ? totalContributions / filteredActivities.length
            : 0;

    return {
        currentStreak,
        longestStreak,
        totalContributions,
        averagePerDay,
        bestDay,
        productivityRate: 0, // Will be calculated when productivity data is integrated
        scheduleAdherence: 0, // Will be calculated when productivity data is integrated
    };
};

/**
 * Calculate combined statistics from multiple data sources
 * Extended from testing-heatmap patterns to include productivity metrics
 */
export const calculateCombinedStats = (
    githubData: ActivityData[],
    leetcodeData: ActivityData[],
    productivityData?: ActivityData[]
): HeatmapStats => {
    // Combine GitHub and LeetCode data
    const allActivities = [...githubData, ...leetcodeData];

    // Calculate base stats from coding activity
    const baseStats = calculateStreaks(allActivities);

    // If no productivity data, return base stats
    if (!productivityData || productivityData.length === 0) {
        return baseStats;
    }

    // Calculate productivity metrics
    const totalDays = productivityData.length;
    const daysWithActivity = productivityData.filter(d => d.count > 0).length;
    const productivityRate = totalDays > 0 ? (daysWithActivity / totalDays) * 100 : 0;

    // For schedule adherence, we'll need to implement this when we have the actual productivity data structure
    const scheduleAdherence = 0; // Placeholder

    return {
        ...baseStats,
        productivityRate,
        scheduleAdherence,
    };
};