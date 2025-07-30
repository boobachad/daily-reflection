import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Create unique filename
        const fileName = `${uuidv4()}.png`
        const uploadDir = join(process.cwd(), "public/uploads/schedules")
        const filePath = join(uploadDir, fileName)

        // Write file to disk
        await writeFile(filePath, buffer)

        // Return the URL path
        return NextResponse.json({ url: `/uploads/schedules/${fileName}` })
    } catch (error) {
        console.error("Error uploading file:", error)
        return NextResponse.json(
            { error: "Error uploading file" },
            { status: 500 }
        )
    }
} 