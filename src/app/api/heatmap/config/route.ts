import { NextResponse } from "next/server";
import { loadHeatmapConfig, validateHeatmapConfig } from "@/lib/heatmap/config";

export async function GET() {
    try {
        const config = loadHeatmapConfig();
        const validation = validateHeatmapConfig(config);

        // Return configuration status without exposing sensitive data
        return NextResponse.json({
            enabled: config.enabled,
            hasGithubUsername: !!config.githubUsername,
            hasLeetcodeUsername: !!config.leetcodeUsername,
            hasGithubToken: !!config.githubToken,
            valid: validation.valid,
            errors: validation.errors,
        });
    } catch (error) {
        console.error("Error loading heatmap configuration:", error);
        return NextResponse.json(
            { error: "Failed to load configuration" },
            { status: 500 }
        );
    }
}