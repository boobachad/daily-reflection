import { z } from "zod"
import { BaseEntry, EntryWithComputed } from "./base"
import { MissingImageError } from "./api"

/**
 * Base validation schema for entry fields
 */
export const baseEntrySchema = z.object({
    date: z.string(),
    expectedScheduleImageUrl: z.string().default(""),
    actualScheduleImageUrl: z.string().default(""),
    reflectionText: z.string().default("")
})

/**
 * Schema for entry creation/update operations
 */
export const entryInputSchema = z.object({
    date: z.union([z.date(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
    expectedScheduleImageUrl: z.string().optional(),
    actualScheduleImageUrl: z.string().optional(),
    reflectionText: z.string().optional()
})

/**
 * Schema for API request payload
 */
export const apiEntryInputSchema = baseEntrySchema.strict()

/**
 * Schema for entry with computed fields
 */
export const entryWithComputedSchema = baseEntrySchema.extend({
    id: z.string(),
    dayX: z.number(),
    hasReflection: z.boolean(),
    hasExpectedSchedule: z.boolean(),
    hasActualSchedule: z.boolean(),
    imageStatus: z.object({
        expectedScheduleImageUrl: z.object({
            exists: z.boolean(),
            error: z.object({
                type: z.literal("missing_image"),
                field: z.enum(["expectedScheduleImageUrl", "actualScheduleImageUrl"]),
                message: z.string()
            }).optional()
        }),
        actualScheduleImageUrl: z.object({
            exists: z.boolean(),
            error: z.object({
                type: z.literal("missing_image"),
                field: z.enum(["expectedScheduleImageUrl", "actualScheduleImageUrl"]),
                message: z.string()
            }).optional()
        })
    })
})

/**
 * Schema for streak response
 */
export const streakSchema = z.object({
    streak: z.number().int().min(0),
    flameDates: z.array(z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)).default([])
}).strict()

/**
 * Schema for health check response
 */
export const healthSchema = z.object({
    status: z.enum(["healthy", "unhealthy"]),
    error: z.string().optional()
}).strict()

/**
 * Schema for entry dates response
 */
export const entryDatesSchema = z.object({
    dates: z.array(z.date())
}).strict()

/**
 * Schema for entry list response
 */
export const entryListSchema = z.object({
    entries: z.array(entryWithComputedSchema),
    pagination: z.object({
        total: z.number().int().min(0),
        page: z.number().int().min(1),
        limit: z.number().int().min(1),
        pages: z.number().int().min(0)
    })
}).strict()

/**
 * Schema for entry status response
 */
export const entryStatusSchema = z.object({
    total: z.number().int().min(0),
    withReflection: z.number().int().min(0),
    withExpectedSchedule: z.number().int().min(0),
    withActualSchedule: z.number().int().min(0),
    hasTodayEntry: z.boolean()
}).strict()

/**
 * Schema for validating date strings in YYYY-MM-DD format
 */
export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Invalid date format. Use YYYY-MM-DD"
})

/**
 * Schema for validating file uploads
 */
export const FileUploadSchema = z.object({
    file: z.instanceof(File).refine(
        file => file.size <= 5 * 1024 * 1024,
        "File size must be less than 5MB"
    ).refine(
        file => file.type.startsWith("image/"),
        "Only image files are allowed"
    )
})

/**
 * Schema for validating image URLs
 */
export const ImageUrlSchema = z.string().url().refine(
    url => url.startsWith('http://') || url.startsWith('https://'),
    "Invalid URL scheme"
)

export const missingImageErrorSchema = z.object({
    type: z.literal("missing_image"),
    field: z.enum(["expectedScheduleImageUrl", "actualScheduleImageUrl"]),
    message: z.string()
})

export const imageStatusSchema = z.object({
    exists: z.boolean(),
    error: missingImageErrorSchema.optional()
})

export const entryWithImageStatusSchema = baseEntrySchema.extend({
    id: z.string(),
    dayX: z.number(),
    hasReflection: z.boolean(),
    hasExpectedSchedule: z.boolean(),
    hasActualSchedule: z.boolean(),
    imageStatus: z.object({
        expectedScheduleImageUrl: imageStatusSchema,
        actualScheduleImageUrl: imageStatusSchema
    })
}) 