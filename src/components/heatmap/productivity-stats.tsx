"use client";

import React from "react";
import { InfoIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdaptiveTooltip } from "@/components/ui/adaptive-tooltip";
import { HeatmapStats } from "@/lib/heatmap/types";

// Individual StatsCard component copied and adapted from testing-heatmap/components/StatsCard.tsx
const StatsCard = ({
    title,
    value,
    helpText,
}: {
    title: string;
    value: string | number;
    helpText?: string;
}) => (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-background to-muted/20 pb-2">
            <div className="flex justify-between items-center">
                <CardTitle className="text-base font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {helpText && (
                    <AdaptiveTooltip content={<p>{helpText}</p>} className="max-w-xs">
                        <button
                            className="rounded-full p-1 hover:bg-muted transition-colors"
                            aria-label={`Info about ${title}`}>
                            <InfoIcon size={14} className="text-muted-foreground" />
                        </button>
                    </AdaptiveTooltip>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-4">
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                {value}
            </div>
        </CardContent>
    </Card>
);

interface ProductivityStatsProps {
    stats: HeatmapStats;
    loading?: boolean;
    error?: string | null;
}

export const ProductivityStats = ({
    stats,
    loading = false,
    error = null,
}: ProductivityStatsProps) => {
    // Loading state
    if (loading) {
        return (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="h-8 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="text-center py-6 text-destructive">
                <p>Error loading statistics: {error}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <StatsCard
                title="Current Streak"
                value={`${stats.currentStreak} days`}
                helpText="Combined streak from GitHub contributions, LeetCode submissions, and productivity activities"
            />
            <StatsCard
                title="Longest Streak"
                value={`${stats.longestStreak} days`}
                helpText="Your longest continuous streak of daily activity across all platforms"
            />
            <StatsCard
                title="Total Activity"
                value={stats.totalContributions}
                helpText="Total contributions from GitHub, LeetCode submissions, and productivity entries"
            />
            <StatsCard
                title="Average Per Day"
                value={stats.averagePerDay.toFixed(1)}
                helpText="Average daily activity across all tracked platforms and productivity metrics"
            />
        </div>
    );
};

export default ProductivityStats;