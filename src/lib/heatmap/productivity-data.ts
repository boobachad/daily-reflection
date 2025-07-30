// Productivity data fetching and transformation utilities
// Following testing-heatmap/lib/types.ts patterns and integrating with existing EntryModel

import { connectToDatabase } from "@/lib/server/db";
import { EntryModel, DbEntry } from "@/models/entry";
import { utcDateToDateString } from "@/lib/date-utils";
import { ActivityData, ProductivityData } from "./types";
import { normalizeDate } from "./data-transformer";

/**
 * Fetch productivity data from EntryModel for a date range
 * References testing-heatmap data transformation approach for consistent date handling
 */
export async function fetchProductivityData(
    startDate: Date,
    endDate: Date
): Promise<ProductivityData[]> {
    try {
        await connectToDatabase();

        // Query entries within the date range
        const entries = await EntryModel.find({
            date: {
                $gte: startDate,
                $lte: endDate,
            },
        }).lean<DbEntry[]>();

        // Transform entries to ProductivityData format
        return entries.map((entry) => {
            const dateString = utcDateToDateString(entry.date);

            return {
                date: normalizeDate(dateString),
                hasReflection: !!entry.reflectionText && entry.reflectionText.trim().length > 0,
                hasExpectedSchedule: !!entry.expectedScheduleImageUrl && entry.expectedScheduleImageUrl.trim().length > 0,
                hasActualSchedule: !!entry.actualScheduleImageUrl && entry.actualScheduleImageUrl.trim().length > 0,
                completionScore: calculateCompletionScore(entry),
            };
        });
    } catch (error) {
        console.error("Error fetching productivity data:", error);
        return [];
    }
}

/**
 * Calculate completion score based on entry completeness
 * Adapted from testing-heatmap scoring patterns
 */
function calculateCompletionScore(entry: DbEntry): number {
    let score = 0;
    const totalItems = 3; // reflection, expected schedule, actual schedule

    if (entry.reflectionText && entry.reflectionText.trim().length > 0) {
        score += 1;
    }

    if (entry.expectedScheduleImageUrl && entry.expectedScheduleImageUrl.trim().length > 0) {
        score += 1;
    }

    if (entry.actualScheduleImageUrl && entry.actualScheduleImageUrl.trim().length > 0) {
        score += 1;
    }

    return score / totalItems; // Returns 0-1
}

/**
 * Convert ProductivityData to ActivityData format for heatmap integration
 * Following testing-heatmap ActivityData interface from testing-heatmap/lib/types.ts
 */
export function transformProductivityToActivity(productivityData: ProductivityData[]): ActivityData[] {
    return productivityData.map((data) => ({
        date: data.date,
        count: Math.round(data.completionScore * 10), // Scale 0-1 to 0-10 for better visualization
    }));
}

/**
 * Get productivity data for the last 12 months
 * References testing-heatmap date range patterns
 */
export async function getProductivityDataForHeatmap(): Promise<{
    productivityData: ProductivityData[];
    activityData: ActivityData[];
}> {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const productivityData = await fetchProductivityData(startDate, endDate);
    const activityData = transformProductivityToActivity(productivityData);

    return {
        productivityData,
        activityData,
    };
}

/**
 * Calculate productivity metrics for statistics display
 * Extended from testing-heatmap statistics patterns
 */
export function calculateProductivityMetrics(productivityData: ProductivityData[]): {
    productivityRate: number;
    scheduleAdherence: number;
    reflectionRate: number;
    totalProductiveDays: number;
} {
    if (productivityData.length === 0) {
        return {
            productivityRate: 0,
            scheduleAdherence: 0,
            reflectionRate: 0,
            totalProductiveDays: 0,
        };
    }

    const totalDays = productivityData.length;
    const daysWithReflection = productivityData.filter(d => d.hasReflection).length;
    const daysWithBothSchedules = productivityData.filter(d =>
        d.hasExpectedSchedule && d.hasActualSchedule
    ).length;
    const daysWithAnyActivity = productivityData.filter(d =>
        d.hasReflection || d.hasExpectedSchedule || d.hasActualSchedule
    ).length;

    return {
        productivityRate: (daysWithAnyActivity / totalDays) * 100,
        scheduleAdherence: (daysWithBothSchedules / totalDays) * 100,
        reflectionRate: (daysWithReflection / totalDays) * 100,
        totalProductiveDays: daysWithAnyActivity,
    };
}