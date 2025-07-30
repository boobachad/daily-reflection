"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityHeatmap } from "./activity-heatmap";
import { ProductivityStats } from "./productivity-stats";
import { useHeatmapData } from "@/hooks/use-heatmap-data";

interface HeatmapSectionProps {
    className?: string;
}

interface ConfigStatus {
    enabled: boolean;
    hasGithubUsername: boolean;
    hasLeetcodeUsername: boolean;
    hasGithubToken: boolean;
    valid: boolean;
    errors: string[];
}

export const HeatmapSection = ({ className }: HeatmapSectionProps) => {
    const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
    const [configLoading, setConfigLoading] = useState(true);

    // The usernames will be read from environment variables by the API routes
    // We just need to know if they're configured - but we need to call the hook unconditionally
    const githubUsername = configStatus?.hasGithubUsername ? "configured" : "";
    const leetcodeUsername = configStatus?.hasLeetcodeUsername ? "configured" : "";

    // Fetch combined heatmap data - MUST be called unconditionally (Rules of Hooks)
    const {
        combinedData,
        stats,
        loading,
        error,
        refetch,
        isFromCache,
    } = useHeatmapData(githubUsername, leetcodeUsername);

    // Load configuration status from API
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch('/api/heatmap/config');
                if (response.ok) {
                    const status = await response.json();
                    setConfigStatus(status);
                } else {
                    console.error('Failed to load heatmap configuration');
                    setConfigStatus({
                        enabled: false,
                        hasGithubUsername: false,
                        hasLeetcodeUsername: false,
                        hasGithubToken: false,
                        valid: false,
                        errors: ['Failed to load configuration']
                    });
                }
            } catch (error) {
                console.error('Error loading heatmap configuration:', error);
                setConfigStatus({
                    enabled: false,
                    hasGithubUsername: false,
                    hasLeetcodeUsername: false,
                    hasGithubToken: false,
                    valid: false,
                    errors: ['Failed to load configuration']
                });
            } finally {
                setConfigLoading(false);
            }
        };

        loadConfig();
    }, []);

    // Show loading state while checking configuration
    if (configLoading) {
        return (
            <section className={`space-y-6 ${className || ""}`}>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-center">
                            <div className="text-sm text-muted-foreground">Preparing your activity dashboard...</div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        );
    }

    // If configuration is invalid, show configuration message
    if (!configStatus?.valid) {
        console.warn("Heatmap configuration invalid:", configStatus?.errors);
        return (
            <section
                className={`space-y-6 ${className || ""}`}
                aria-label="Activity heatmap configuration"
            >
                <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                    <CardHeader>
                        <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                            <span className="text-yellow-600 dark:text-yellow-400">⚙️</span>
                            Heatmap Configuration Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <p className="text-yellow-700 dark:text-yellow-300">
                                To display your activity heatmap, please configure the following environment variables in your <code className="bg-yellow-100 dark:bg-yellow-800 px-1 py-0.5 rounded text-xs">.env.local</code> file:
                            </p>
                            <div className="bg-yellow-100 dark:bg-yellow-800/50 p-3 rounded-md">
                                <pre className="text-xs text-yellow-800 dark:text-yellow-200">
                                    {`# Heatmap Configuration
GITHUB_USERNAME=your_github_username_here
LEETCODE_USERNAME=your_leetcode_username_here
GITHUB_TOKEN=your_github_token_here`}
                                </pre>
                            </div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                <p><strong>Missing:</strong></p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    {configStatus?.errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        );
    }

    // Show warning if using cached data
    const showCacheWarning = isFromCache && !loading;

    return (
        <section
            className={`space-y-6 ${className || ""}`}
            aria-label="Activity heatmap and statistics"
        >
            {/* Activity Heatmap Card */}
            <Card className="relative">
                <CardHeader className="pb-2 sm:pb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                        <CardTitle className="text-lg sm:text-xl">
                            Activity Heatmap
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            {showCacheWarning && (
                                <span className="inline-flex items-center rounded-md bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-500 ring-1 ring-inset ring-yellow-600/20">
                                    Cached Data
                                </span>
                            )}
                            {error && (
                                <button
                                    onClick={refetch}
                                    className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/30 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-500 ring-1 ring-inset ring-red-600/20 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center">
                        <div className="flex w-full">
                            <div className="flex flex-col w-full justify-center items-center overflow-x-auto">
                                <div className="min-w-fit">
                                    <ActivityHeatmap
                                        combinedData={combinedData}
                                        loading={loading}
                                        error={error}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics Section */}
            <section aria-label="Activity statistics">
                <h2 className="sr-only">Coding and Productivity Statistics</h2>
                <ProductivityStats
                    stats={stats}
                    loading={loading}
                    error={error}
                />
            </section>
        </section>
    );
};

export default HeatmapSection;