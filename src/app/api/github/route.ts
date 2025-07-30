import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { responseCache } from "@/lib/cache";

interface GitHubResponse {
    data: {
        user: {
            contributionsCollection: {
                contributionCalendar: {
                    totalContributions: number;
                    weeks: {
                        contributionDays: {
                            contributionCount: number;
                            date: string;
                        }[];
                    }[];
                };
            };
        };
    };
}

interface ErrorResponse {
    error: string;
}

export async function GET(request: NextRequest) {
    try {
        // Get username from environment variables
        const username = process.env.GITHUB_USERNAME;

        console.log('GitHub API - Environment check:', {
            hasUsername: !!username,
            usernameType: typeof username,
            usernameValue: username ? `${username.substring(0, 3)}...` : 'undefined'
        });

        if (!username) {
            return NextResponse.json(
                { error: "GitHub username not configured" },
                { status: 400 }
            );
        }

        // Generate cache key
        const cacheKey = `github:${username}`;

        // Check if we have a fresh cached response
        const cachedData = responseCache.get<GitHubResponse>(cacheKey);
        if (cachedData) {
            return NextResponse.json(cachedData, {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                }
            });
        }

        const query = `
            query ($login: String!) {
                user(login: $login) {
                    contributionsCollection {
                        contributionCalendar {
                            totalContributions
                            weeks {
                                contributionDays {
                                    contributionCount
                                    date
                                }
                            }
                        }
                    }
                }
            }
        `;

        // Ensure GitHub token exists
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            console.error("GitHub token is not configured");

            // Try to use cached data if available
            const cachedData = responseCache.get<GitHubResponse>(cacheKey);
            if (cachedData) {
                return NextResponse.json(cachedData);
            }

            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        // Add timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await axios.post(
            "https://api.github.com/graphql",
            { query, variables: { login: username } },
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    "Content-Type": "application/json",
                },
                timeout: 8000, // Extended timeout for high load
                maxBodyLength: 1024 * 500, // Limit response size
                validateStatus: (status) => status < 500, // Only reject on server errors
                signal: controller.signal,
            }
        );

        clearTimeout(timeoutId);

        // Validate response data format
        if (!response.data?.data?.user?.contributionsCollection) {
            // Try to use cached data if response is invalid
            const cachedData = responseCache.get<GitHubResponse>(cacheKey);
            if (cachedData) {
                return NextResponse.json(cachedData);
            }

            return NextResponse.json(
                { error: "No valid data found for this user" },
                { status: 404 }
            );
        }

        // Cache the response for future requests - storing for 1 hour
        responseCache.set(cacheKey, response.data, 60 * 60 * 1000);

        return NextResponse.json(response.data, {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
            }
        });

    } catch (error: unknown) {
        console.error(
            "GitHub API error:",
            error instanceof Error ? error.message : error
        );

        const username = process.env.GITHUB_USERNAME;
        const cacheKey = `github:${username}`;

        // Try to use cache if available on error
        const cachedData = responseCache.get<GitHubResponse>(cacheKey);
        if (cachedData) {
            console.log("Using cached GitHub data due to API error");
            return NextResponse.json(cachedData);
        }

        // Handle different types of errors
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const message =
                status === 404
                    ? "GitHub user not found"
                    : status === 403
                        ? "GitHub API rate limit exceeded"
                        : status === 429
                            ? "Too many requests, please try again later"
                            : "Failed to fetch GitHub data";

            return NextResponse.json({ error: message }, { status });
        } else if (error instanceof Error && "request" in error) {
            console.error("Network error or timeout:", error.message);
            return NextResponse.json(
                { error: "GitHub API timeout or network error" },
                { status: 504 }
            );
        } else {
            console.error("Unexpected GitHub API error:", error);
            return NextResponse.json(
                { error: "Failed to fetch GitHub data. Please try again later." },
                { status: 500 }
            );
        }
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}