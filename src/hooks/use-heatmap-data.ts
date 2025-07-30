"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    transformGitHubData,
    transformLeetCodeData
} from "@/lib/heatmap/data-transformer";
import {
    ActivityData,
    HeatmapStats,
    CombinedActivityData,
    GitHubJsonData,
    LeetCodeJsonData
} from "@/lib/heatmap/types";
import { getCombinedDataWithStats } from "@/lib/heatmap/combined-data";

// Individual hooks removed to prevent infinite loops - functionality moved to useHeatmapData

// Combined heatmap data hook - integrates GitHub, LeetCode, and productivity data
export const useHeatmapData = (githubUsername: string, leetcodeUsername: string) => {
    const [combinedData, setCombinedData] = useState<CombinedActivityData[]>([]);
    const [stats, setStats] = useState<HeatmapStats>({
        currentStreak: 0,
        longestStreak: 0,
        totalContributions: 0,
        averagePerDay: 0,
        bestDay: { date: "", count: 0 },
        productivityRate: 0,
        scheduleAdherence: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFromCache, setIsFromCache] = useState(false);

    // Fetch productivity data and combine all sources
    const fetchAllData = useCallback(async () => {
        // Don't fetch if no usernames are configured
        if (!githubUsername && !leetcodeUsername) {
            setLoading(false);
            setError(null);
            setCombinedData([]);
            setStats({
                currentStreak: 0,
                longestStreak: 0,
                totalContributions: 0,
                averagePerDay: 0,
                bestDay: { date: "", count: 0 },
                productivityRate: 0,
                scheduleAdherence: 0,
            });
            return;
        }

        setLoading(true);
        setError(null);
        setIsFromCache(false);

        try {
            // Fetch data from all sources in parallel
            const promises: Promise<unknown>[] = [];

            if (githubUsername) {
                promises.push(axios.get('/api/github'));
            }

            if (leetcodeUsername) {
                promises.push(axios.get('/api/leetcode'));
            }

            // Always try to fetch productivity data
            promises.push(axios.get('/api/productivity'));

            // Fetch data from all sources in parallel
            const results = await Promise.allSettled(promises);

            // Process results
            let githubData: ActivityData[] = [];
            let leetcodeData: ActivityData[] = [];
            let productivityData: ActivityData[] = [];

            let resultIndex = 0;

            if (githubUsername) {
                const githubResult = results[resultIndex++];
                if (githubResult.status === 'fulfilled') {
                    githubData = transformGitHubData((githubResult.value as { data: GitHubJsonData }).data);
                }
            }

            if (leetcodeUsername) {
                const leetcodeResult = results[resultIndex++];
                if (leetcodeResult.status === 'fulfilled') {
                    leetcodeData = transformLeetCodeData((leetcodeResult.value as { data: LeetCodeJsonData }).data);
                }
            }

            // Handle productivity data (always last)
            const productivityResult = results[resultIndex];
            if (productivityResult.status === 'fulfilled') {
                productivityData = (productivityResult.value as { data: { activityData: ActivityData[] } }).data.activityData;
            } else {
                console.warn('Failed to fetch productivity data:', productivityResult.reason);
            }

            // Combine all data
            const result = getCombinedDataWithStats(
                githubData,
                leetcodeData,
                productivityData
            );

            setCombinedData(result.combinedData);
            setStats(result.stats);

            // Set error if any critical data source failed
            const errors: string[] = [];
            let errorIndex = 0;

            if (githubUsername) {
                const githubResult = results[errorIndex++];
                if (githubResult.status === 'rejected') {
                    errors.push(`GitHub: ${githubResult.reason?.message || 'Failed to fetch'}`);
                }
            }

            if (leetcodeUsername) {
                const leetcodeResult = results[errorIndex++];
                if (leetcodeResult.status === 'rejected') {
                    errors.push(`LeetCode: ${leetcodeResult.reason?.message || 'Failed to fetch'}`);
                }
            }

            if (errors.length > 0) {
                setError(errors.join('; '));
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch heatmap data';
            setError(errorMessage);
            console.error('Heatmap data fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [githubUsername, leetcodeUsername]);

    // Auto-fetch when usernames change
    useEffect(() => {
        if (githubUsername || leetcodeUsername) {
            fetchAllData();
        }
    }, [githubUsername, leetcodeUsername, fetchAllData]);

    return {
        combinedData,
        stats,
        loading,
        error,
        refetch: fetchAllData,
        isFromCache,
    };
};