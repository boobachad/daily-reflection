// Environment configuration utilities for heatmap integration
// Based on testing-heatmap environment variable usage patterns

export interface HeatmapConfig {
    githubUsername?: string;
    leetcodeUsername?: string;
    githubToken?: string;
    enabled: boolean;
}

/**
 * Load and validate heatmap configuration from environment variables
 * References testing-heatmap environment variable approach
 */
export function loadHeatmapConfig(): HeatmapConfig {
    // For server-side API routes, use process.env directly
    const githubUsername = process.env.GITHUB_USERNAME;
    const leetcodeUsername = process.env.LEETCODE_USERNAME;
    const githubToken = process.env.GITHUB_TOKEN;

    // Debug logging to help troubleshoot
    console.log('Environment variables loaded:', {
        hasGithubUsername: !!githubUsername,
        hasLeetcodeUsername: !!leetcodeUsername,
        hasGithubToken: !!githubToken,
        githubUsernameValue: githubUsername ? `${githubUsername.substring(0, 3)}...` : 'undefined',
        leetcodeUsernameValue: leetcodeUsername ? `${leetcodeUsername.substring(0, 3)}...` : 'undefined'
    });

    // Heatmap is enabled if at least one username is configured
    const enabled = !!(githubUsername || leetcodeUsername);

    return {
        githubUsername,
        leetcodeUsername,
        githubToken,
        enabled,
    };
}

/**
 * Validate that required configuration is present
 * Adapted from testing-heatmap configuration validation patterns
 */
export function validateHeatmapConfig(config: HeatmapConfig): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    console.log('Validating heatmap config:', {
        enabled: config.enabled,
        hasGithubUsername: !!config.githubUsername,
        hasLeetcodeUsername: !!config.leetcodeUsername,
        hasGithubToken: !!config.githubToken
    });

    if (!config.enabled) {
        errors.push("No usernames configured. Set GITHUB_USERNAME or LEETCODE_USERNAME in environment variables.");
        return { valid: false, errors };
    }

    if (config.githubUsername && !config.githubToken) {
        errors.push("GITHUB_TOKEN is required when GITHUB_USERNAME is set.");
    }

    const isValid = errors.length === 0;
    console.log('Validation result:', { valid: isValid, errors });

    return {
        valid: isValid,
        errors,
    };
}

/**
 * Get configuration with fallback handling
 * Following testing-heatmap fallback patterns
 */
export function getHeatmapConfigWithFallback(): {
    config: HeatmapConfig;
    warnings: string[];
} {
    const config = loadHeatmapConfig();
    const validation = validateHeatmapConfig(config);
    const warnings: string[] = [];

    if (!validation.valid) {
        warnings.push(...validation.errors);
        // Return disabled config as fallback
        return {
            config: { ...config, enabled: false },
            warnings,
        };
    }

    // Add warnings for partial configuration
    if (config.githubUsername && !config.leetcodeUsername) {
        warnings.push("Only GitHub username configured. LeetCode data will not be available.");
    }

    if (config.leetcodeUsername && !config.githubUsername) {
        warnings.push("Only LeetCode username configured. GitHub data will not be available.");
    }

    return { config, warnings };
}