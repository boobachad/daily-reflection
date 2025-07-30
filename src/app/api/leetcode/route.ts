import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { responseCache } from "@/lib/cache";

interface LeetCodeResponse {
    data: {
        matchedUser: {
            submissionCalendar: string;
        };
    };
}

interface ErrorResponse {
    error: string;
}

export async function GET(request: NextRequest) {
    try {
        // Get username from environment variables
        const username = process.env.LEETCODE_USERNAME;

        console.log('LeetCode API - Environment check:', {
            hasUsername: !!username,
            usernameType: typeof username,
            usernameValue: username ? `${username.substring(0, 3)}...` : 'undefined'
        });

        if (!username || typeof username !== "string") {
            return NextResponse.json(
                { error: "LeetCode username not configured" },
                { status: 400 }
            );
        }

        // Generate cache key
        const cacheKey = `leetcode:${username}`;

        // Check if we have a fresh cached response
        const cachedData = responseCache.get<LeetCodeResponse>(cacheKey);
        if (cachedData) {
            return NextResponse.json(cachedData, {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                }
            });
        }

        // Add timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await axios.post(
            "https://leetcode.com/graphql",
            {
                query: `
                    query ($username: String!) {
                        matchedUser(username: $username) {
                            submissionCalendar
                        }
                    }
                `,
                variables: { username },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
                },
                timeout: 8000, // Extended timeout for high load
                maxBodyLength: 1024 * 500, // Limit response size
                validateStatus: (status) => status < 500, // Only reject on server errors
                signal: controller.signal,
            }
        );

        clearTimeout(timeoutId);

        // Validate response data format
        if (!response.data?.data?.matchedUser?.submissionCalendar) {
            // Try to use cached data if response is invalid
            const cachedData = responseCache.get<LeetCodeResponse>(cacheKey);
            if (cachedData) {
                return NextResponse.json(cachedData);
            }

            return NextResponse.json(
                { error: "No data found for this LeetCode user" },
                { status: 404 }
            );
        }

        // Cache the response for future requests - storing for 2 hours
        responseCache.set(cacheKey, response.data, 2 * 60 * 60 * 1000);

        return NextResponse.json(response.data, {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
            }
        });

    } catch (error: unknown) {
        console.error(
            "LeetCode API error:",
            error instanceof Error ? error.message : error
        );

        const username = process.env.LEETCODE_USERNAME;
        const cacheKey = `leetcode:${username}`;

        // Try to use cache if available on error
        const cachedData = responseCache.get<LeetCodeResponse>(cacheKey);
        if (cachedData) {
            console.log("Using cached LeetCode data due to API error");
            return NextResponse.json(cachedData);
        }

        // Handle different types of errors
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const message =
                status === 404
                    ? "LeetCode user not found"
                    : status === 429
                        ? "LeetCode API rate limit exceeded - please try again later"
                        : "Failed to fetch LeetCode data";

            return NextResponse.json({ error: message }, { status });
        } else if (error instanceof Error && "request" in error) {
            console.error("Network error or timeout:", error.message);
            return NextResponse.json(
                { error: "LeetCode API timeout or network error" },
                { status: 504 }
            );
        } else {
            console.error("Unexpected LeetCode API error:", error);
            return NextResponse.json(
                { error: "Failed to fetch LeetCode data. Please try again later." },
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