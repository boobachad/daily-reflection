// Type definitions for heatmap functionality
// Copied and adapted from testing-heatmap/lib/types.ts

export interface ActivityData {
    date: string;
    count: number;
}

export interface GitHubJsonData {
    data: {
        user: {
            contributionsCollection: {
                contributionCalendar: {
                    weeks: {
                        contributionDays: {
                            date: string;
                            contributionCount: number;
                        }[];
                    }[];
                };
            };
        };
    };
    errors?: [
        {
            message: string;
        }
    ];
}

export interface LeetCodeJsonData {
    data: {
        matchedUser: {
            submissionCalendar: string;
        };
    };
}

export interface GitHubDataHook {
    data: ActivityData[];
    setData: React.Dispatch<React.SetStateAction<ActivityData[]>>;
    loading: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    fetchData: (username?: string) => Promise<void>;
    isFromCache: boolean;
}

export interface LeetCodeDataHook {
    data: ActivityData[];
    setData: React.Dispatch<React.SetStateAction<ActivityData[]>>;
    loading: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    fetchData: (username?: string) => Promise<void>;
    isFromCache: boolean;
}

// Additional types for productivity data integration
export interface ProductivityData {
    date: string;
    hasReflection: boolean;
    hasExpectedSchedule: boolean;
    hasActualSchedule: boolean;
    completionScore: number; // 0-1 based on completed items
}

export interface CombinedActivityData extends ActivityData {
    githubCount: number;
    leetcodeCount: number;
    productivityScore: number;
    totalActivity: number;
}

export interface HeatmapStats {
    currentStreak: number;
    longestStreak: number;
    totalContributions: number;
    averagePerDay: number;
    bestDay: { date: string; count: number };
    productivityRate: number; // Percentage of days with reflections
    scheduleAdherence: number; // Percentage of days with both schedules
}