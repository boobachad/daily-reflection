// Data transformation utilities for GitHub and LeetCode responses
// Copied and adapted from testing-heatmap/lib/transformData.ts

import { ActivityData, GitHubJsonData, LeetCodeJsonData } from "./types";

export const transformGitHubData = (
    jsonData: GitHubJsonData
): ActivityData[] => {
    if (jsonData.errors) {
        throw new Error(jsonData.errors[0].message);
    }

    const data =
        jsonData?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;

    if (!data) {
        throw new Error("Invalid GitHub data");
    }
    try {
        // Flatten the weeks and map contribution days
        const response = data
            .flatMap((week) => week.contributionDays || [])
            .map((day) => {
                // Ensure consistent date format (YYYY-MM-DD)
                let dateString = day.date;
                if (dateString) {
                    // Make sure date is in YYYY-MM-DD format without timezone effects
                    try {
                        const date = new Date(dateString);
                        if (!isNaN(date.getTime())) {
                            // Get year, month, day components and create a clean date string
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, "0");
                            const dt = String(date.getDate()).padStart(2, "0");
                            dateString = `${year}-${month}-${dt}`;
                        }
                    } catch (err) {
                        console.error("Date parsing error:", err);
                    }
                }

                return {
                    date: dateString,
                    count: day.contributionCount || 0,
                };
            });

        return response;
    } catch (error) {
        console.error("Error transforming GitHub data:", error);
        return [];
    }
};

export const transformLeetCodeData = (
    jsonData: LeetCodeJsonData
): ActivityData[] => {
    // Validate the input structure
    if (!jsonData?.data?.matchedUser?.submissionCalendar) {
        throw new Error("Invalid Leetcode");
    }

    try {
        // Parse the submission calendar
        const rawCalendar = JSON.parse(
            jsonData.data.matchedUser.submissionCalendar
        );

        // Transform the data with more robust date handling
        return Object.entries(rawCalendar)
            .map(([timestamp, count]) => {
                // Create a date from the timestamp
                const date = new Date(parseInt(timestamp) * 1000);

                // Ensure the date is valid
                if (isNaN(date.getTime())) {
                    console.error("Invalid timestamp:", timestamp);
                    return { date: "", count: 0 }; // Return a placeholder
                }

                // Format the date consistently as YYYY-MM-DD without timezone effects
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const dateStr = `${year}-${month}-${day}`;

                return {
                    date: dateStr,
                    count: Number(count) || 0, // Ensure count is a number, default to 0 if invalid
                };
            })
            .filter((item) => item.date !== ""); // Filter out invalid dates
    } catch (error) {
        console.error("Error transforming LeetCode data:", error);
        return [];
    }
};

/**
 * Normalize date string to YYYY-MM-DD format
 * Referenced from testing-heatmap date handling patterns
 */
export const normalizeDate = (dateInput: string | Date): string => {
    try {
        let date: Date;

        if (typeof dateInput === 'string') {
            // Handle date strings directly if they're already in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                return dateInput;
            }
            date = new Date(dateInput);
        } else {
            date = dateInput;
        }

        if (isNaN(date.getTime())) {
            console.error("Invalid date:", dateInput);
            return "";
        }

        // Format date consistently to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    } catch (err) {
        console.error("Date normalization error:", err, "for date:", dateInput);
        return "";
    }
};