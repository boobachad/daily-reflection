import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { MissingImageError } from "@/types/entry"
import { DbEntry } from "@/models/entry"
import { Readable } from "stream"
import { finished } from "stream/promises"

/**
 * Verify if an image exists at the given URL
 */
export async function verifyImageExists(url: string): Promise<boolean> {
    if (!url) return false
    try {
        const filePath = path.join(process.cwd(), 'public', url)
        await fs.promises.access(filePath)
        return true
    } catch {
        return false
    }
}

/**
 * Process a file upload
 * @param file - The uploaded file
 * @param prefix - The filename prefix (e.g., 'expectedschedule' or 'actualschedule')
 */
export async function processFileUpload(file: File, prefix: string = ""): Promise<string> {
    const buffer = await file.arrayBuffer()
    const fileName = `${prefix ? prefix + '-' : ''}${uuidv4()}.png`
    const filePath = path.join(process.cwd(), 'public/uploads/schedules', fileName)

    await fs.promises.writeFile(filePath, Buffer.from(buffer))
    return `/uploads/schedules/${fileName}`
}

/**
 * Process a base64 image
 * @param base64Data - The base64 image string
 * @param prefix - The filename prefix (e.g., 'expectedschedule' or 'actualschedule')
 */
export async function processBase64Image(base64Data: string, prefix: string = ""): Promise<string> {
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Image, 'base64')
    const fileName = `${prefix ? prefix + '-' : ''}${uuidv4()}.png`
    const filePath = path.join(process.cwd(), 'public/uploads/schedules', fileName)

    await fs.promises.writeFile(filePath, buffer)
    return `/uploads/schedules/${fileName}`
}

/**
 * Delete a file from the uploads directory
 */
export async function deleteFile(fileUrl: string) {
    if (!fileUrl) return
    try {
        const filePath = path.join(process.cwd(), 'public', fileUrl)
        await fs.promises.unlink(filePath)
        console.log(`Successfully deleted file: ${fileUrl}`)
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            console.log(`File does not exist: ${fileUrl}`)
        } else {
            console.error(`Error deleting file ${fileUrl}:`, error)
        }
    }
}

/**
 * Check image status and create error if missing
 */
export async function checkImageStatus(url: string, field: "expectedScheduleImageUrl" | "actualScheduleImageUrl"): Promise<{ exists: boolean; error?: MissingImageError }> {
    const exists = await verifyImageExists(url)
    if (!exists && url) {
        return {
            exists: false,
            error: {
                type: "missing_image",
                field,
                message: `Image file is missing: ${url}`
            }
        }
    }
    return { exists: !!url }
}

/**
 * Clean up invalid image URLs in an entry
 */
export async function cleanupInvalidImageUrls(entry: DbEntry): Promise<DbEntry> {
    // Do not clear image URLs if the file is missing; let the frontend handle missing images
    return entry
}

/**
 * Downloads an image from a Napchart URL, validates it, and saves it to /public/uploads/.
 * Returns the relative path (e.g., /uploads/napchart-<chartid>-<hash>.png) or throws on error.
 */
export async function downloadAndSaveImageFromUrl(url: string, fileName: string): Promise<string> {
    // Only allow Napchart URLs
    if (!url.startsWith("https://napchart.com/api/v2/getImage?chartid=")) {
        throw new Error("Only Napchart image URLs are allowed.")
    }
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)

    // Validate content-type
    const contentType = res.headers.get("content-type") || ""
    if (!contentType.startsWith("image/")) {
        throw new Error("URL does not point to an image.")
    }

    // Validate size (max 5MB)
    const contentLength = res.headers.get("content-length")
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
        throw new Error("Image is too large (max 5MB).")
    }

    // Ensure uploads directory exists
    const uploadsDir = path.resolve("./public/uploads/schedules/")
    if (!fs.existsSync(uploadsDir)) await fs.promises.mkdir(uploadsDir, { recursive: true })

    // Sanitize filename
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
    const destination = path.join(uploadsDir, safeFileName)

    // Save file
    if (!res.body) throw new Error("No response body")
    const arrayBuffer = await res.arrayBuffer()
    await fs.promises.writeFile(destination, Buffer.from(arrayBuffer))

    // Return relative path for DB
    return `/uploads/schedules/${safeFileName}`
}