"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
import Link from "next/link"
import { CalendarDays, Save } from "lucide-react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatDateForDisplay, isPastDate } from "@/lib/date-utils"
import { hasReflectionChanges } from "@/lib/utils"

// Dynamically import the ImageUploader component for code splitting
const ImageUploader = dynamic(
    () => import("@/components/image-uploader"),
    {
        ssr: false // Ensure this component is not rendered on the server
    }
)

// Dynamically import the VeryRichTextEditor component for code splitting
const VeryRichTextEditor = dynamic(
    () => import("@/components/very-rich-text-editor"),
    {
        ssr: false // Ensure this component is not rendered on the server
    }
)

interface Entry {
    id?: string;
    dayX?: number;
    reflectionText?: string;
    expectedScheduleImageUrl?: string | null;
    actualScheduleImageUrl?: string | null;
    imageStatus?: {
        expectedScheduleImageUrl: {
            exists: boolean;
            error?: {
                type: "missing_image";
                field: "expectedScheduleImageUrl" | "actualScheduleImageUrl";
                message: string;
            };
        };
        actualScheduleImageUrl: {
            exists: boolean;
            error?: {
                type: "missing_image";
                field: "expectedScheduleImageUrl" | "actualScheduleImageUrl";
                message: string;
            };
        };
    };
}

const isBase64 = (value: string | null) => typeof value === 'string' && value.startsWith('data:image/')

// Main component to display and edit entry content
export default function EntryContent({
    entry,
    dateString
}: {
    entry?: Entry;
    dateString: string;
}) {
    // Defensive: if entry is missing, show a message and clear staged cache
    if (!entry) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2 text-foreground">Entry Not Found</h2>
                    <p className="text-muted-foreground mb-4">This entry does not exist or has been deleted.</p>
                    <a href="/entries" className="text-blue-400 underline">Back to All Entries</a>
                </div>
            </div>
        )
    }

    const [reflectionContent, setReflectionContent] = useState(entry?.reflectionText || "")
    const [imageChanges, setImageChanges] = useState<{
        expectedScheduleImageUrl: string | null;
        actualScheduleImageUrl: string | null;
    }>({
        expectedScheduleImageUrl: null,
        actualScheduleImageUrl: null
    })

    // Track individual changes
    const [hasReflectionChanges, setHasReflectionChanges] = useState(false)
    const [hasExpectedImageChanges, setHasExpectedImageChanges] = useState(false)
    const [hasActualImageChanges, setHasActualImageChanges] = useState(false)

    // Derive overall hasChanges state
    const hasChanges = useMemo(() =>
        hasReflectionChanges || hasExpectedImageChanges || hasActualImageChanges,
        [hasReflectionChanges, hasExpectedImageChanges, hasActualImageChanges]
    )

    // Track changes from child components
    const handleReflectionChange = useCallback((content: string, hasChanges: boolean) => {
        setReflectionContent(content)
        setHasReflectionChanges(hasChanges)
    }, [])

    const handleImageChange = useCallback((fieldName: string, url: string, hasChanges: boolean) => {
        setImageChanges(prev => {
            // Only update if the URL is different
            if (prev[fieldName as keyof typeof prev] === url) return prev
            return { ...prev, [fieldName]: url }
        })

        if (fieldName === "expectedScheduleImageUrl") {
            setHasExpectedImageChanges(hasChanges)
        } else if (fieldName === "actualScheduleImageUrl") {
            setHasActualImageChanges(hasChanges)
        }
    }, [])

    // Reset changes when entry changes
    useEffect(() => {
        // Only reset if entry changes
        if (!entry) return

        setReflectionContent(entry.reflectionText || "")
        setImageChanges({
            expectedScheduleImageUrl: null,
            actualScheduleImageUrl: null
        })
        setHasReflectionChanges(false)
        setHasExpectedImageChanges(false)
        setHasActualImageChanges(false)
    }, [entry])

    const { mutate: saveEntry, isPending: isSaving } = useMutation({
        mutationFn: async () => {
            const formData = new FormData()

            // Always append all fields, using the current value from state or props
            formData.append('reflectionText', reflectionContent)
            formData.append('expectedScheduleImageUrl', imageChanges.expectedScheduleImageUrl !== null ? imageChanges.expectedScheduleImageUrl : (entry?.expectedScheduleImageUrl ?? ''))
            formData.append('actualScheduleImageUrl', imageChanges.actualScheduleImageUrl !== null ? imageChanges.actualScheduleImageUrl : (entry?.actualScheduleImageUrl ?? ''))

            // Only append base64 fields if they have changes and are base64
            if (hasExpectedImageChanges && imageChanges.expectedScheduleImageUrl && isBase64(imageChanges.expectedScheduleImageUrl)) {
                formData.append('expectedScheduleBase64', imageChanges.expectedScheduleImageUrl)
            }
            if (hasActualImageChanges && imageChanges.actualScheduleImageUrl && isBase64(imageChanges.actualScheduleImageUrl)) {
                formData.append('actualScheduleBase64', imageChanges.actualScheduleImageUrl)
            }

            const response = await fetch(`/api/entries/${dateString}`, {
                method: 'PUT',
                body: formData
            })
            if (!response.ok) throw new Error('Failed to save')
            return response.json()
        },
        onSuccess: (data) => {
            // Update local state with the saved data
            if (hasReflectionChanges) {
                setReflectionContent(data.reflectionText || "")
                setHasReflectionChanges(false)
            }

            if (hasExpectedImageChanges) {
                setImageChanges(prev => ({
                    ...prev,
                    expectedScheduleImageUrl: data.expectedScheduleImageUrl || null
                }))
                setHasExpectedImageChanges(false)
            }

            if (hasActualImageChanges) {
                setImageChanges(prev => ({
                    ...prev,
                    actualScheduleImageUrl: data.actualScheduleImageUrl || null
                }))
                setHasActualImageChanges(false)
            }

            toast.success("Changes saved successfully")
        },
        onError: (error) => {
            toast.error("Save failed", { description: error.message })
        }
    })

    const isLocked = isPastDate(dateString) && !!entry

    const expectedImageUrl = entry?.expectedScheduleImageUrl ?? null
    const actualImageUrl = entry?.actualScheduleImageUrl ?? null
    const stagedReflectionText = entry?.reflectionText ?? ''

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            {/* Header section with Day number, formatted date, and back link */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-foreground">Day {entry?.dayX}</h1>
                        <div className="flex items-center text-muted-foreground">
                        <CalendarDays className="h-5 w-5 mr-2 flex-shrink-0" />
                        {/* Format and display the date */}
                        <p className="text-lg leading-tight">
                            {formatDateForDisplay(dateString)}
                        </p>
                    </div>
                </div>
                {/* Link back to the entries list */}
                <Link
                    href="/entries"
                        className="text-sm font-medium flex items-center text-muted-foreground hover:text-foreground"
                >
                    ← Back to All Entries
                </Link>
            </div>

            {/* Add save button at the top */}
                {!isLocked && (
                    <div className="flex justify-end mt-6 mb-8">
                <Button
                    onClick={() => saveEntry()}
                    disabled={!hasChanges || isSaving}
                            className="bg-primary hover:bg-primary/80 text-primary-foreground"
                >
                    {isSaving ? (
                        <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-foreground mr-2"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save All Changes
                        </>
                    )}
                </Button>
            </div>
                )}

            {/* Container for the two ImageUploader components */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Card for Expected Schedule Image Uploader */}
                    <Card className="border-border bg-card">
                        <CardHeader className="border-b border-border">
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <span>Expected Schedule</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {/* Image uploader component for expected schedule */}
                        <ImageUploader
                                initialImageUrl={expectedImageUrl}
                            onImageChange={(url, hasChanges) => handleImageChange("expectedScheduleImageUrl", url, hasChanges)}
                                dateString={dateString}
                                isLocked={isLocked}
                        />
                    </CardContent>
                </Card>

                {/* Card for Actual Schedule Image Uploader */}
                    <Card className="border-border bg-card">
                        <CardHeader className="border-b border-border">
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            Actual Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {/* Image uploader component for actual schedule */}
                        <ImageUploader
                                initialImageUrl={actualImageUrl}
                            onImageChange={(url, hasChanges) => handleImageChange("actualScheduleImageUrl", url, hasChanges)}
                                dateString={dateString}
                                isLocked={isLocked}
                        />
                    </CardContent>
                </Card>
            </div>

                {/* Updated VeryRichTextEditor */}
                <Card className="border-border bg-card mt-8">
                    <CardHeader className="border-b border-border">
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        Daily Reflection
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                        <VeryRichTextEditor
                            initialContent={stagedReflectionText}
                        onContentChange={handleReflectionChange}
                            readOnly={isLocked}
                    />
                </CardContent>
            </Card>
            </div>
        </div>
    )
}