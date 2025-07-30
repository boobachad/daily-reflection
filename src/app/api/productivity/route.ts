import { NextRequest, NextResponse } from "next/server";
import { getProductivityDataForHeatmap } from "@/lib/heatmap/productivity-data";

export async function GET(request: NextRequest) {
    try {
        const data = await getProductivityDataForHeatmap();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching productivity data:", error);
        return NextResponse.json(
            { error: "Failed to fetch productivity data" },
            { status: 500 }
        );
    }
}