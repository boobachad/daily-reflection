"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Upload, X, RefreshCw, Link2 } from "lucide-react"
import { isNapchartUrl } from "@/lib/utils"

interface ImageUploaderProps {
  initialImageUrl: string | null
  onImageChange: (url: string, hasChanges: boolean) => void
  dateString: string // required for localStorage staging
  isLocked?: boolean
}

type ImageSourceType = "file" | "url" | null

interface ImageState {
  isUploading: boolean
  hasError: boolean
}

// Utility: Convert chart ID to Napchart image URL if needed
function normalizeNapchartInput(input: string): string {
  const chartIdPattern = /^[a-zA-Z0-9]{9,}$/
  if (chartIdPattern.test(input)) {
    return `https://napchart.com/api/v2/getImage?chartid=${input}`
  }
  return input
}

export default function ImageUploader({ initialImageUrl, onImageChange, dateString, isLocked }: ImageUploaderProps) {
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(initialImageUrl)
  const [imageState, setImageState] = useState<ImageState>({
    isUploading: false,
    hasError: false
  })
  const [inputUrl, setInputUrl] = useState("")
  const [sourceType, setSourceType] = useState<ImageSourceType>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [base64Preview, setBase64Preview] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)

  // Determine initial source type
  useEffect(() => {
    if (initialImageUrl) {
      setSourceType(isNapchartUrl(initialImageUrl) ? "url" : "file")
    }
  }, [initialImageUrl])

  // Use staged value if present
  useEffect(() => {
    setLocalImageUrl(initialImageUrl)
  }, [initialImageUrl])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleSourceTypeToggle = useCallback((type: "file" | "url") => {
    setSourceType(type)
    setImageState(prev => ({ ...prev, hasError: false }))
    if (type === "file") setInputUrl("")
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)')
      return
    }

    // Read file as base64 and stage it
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setBase64Preview(base64)
      setLocalImageUrl(base64)
      onImageChange(base64, true)
    }
    reader.readAsDataURL(file)

    setImageState(prev => ({ ...prev, isUploading: false, hasError: false }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [onImageChange])

  const handleUrlSubmit = useCallback(async () => {
    if (!inputUrl) {
      toast.error("Please enter a URL")
      return
    }

    if (!isNapchartUrl(inputUrl)) {
      toast.error("Please enter a valid Napchart URL")
      return
    }

    setImageState(prev => ({ ...prev, isUploading: true, hasError: false }))

    try {
      // Validate the URL by attempting to load the image
      const urlToValidate = normalizeNapchartInput(inputUrl)
      const img = new window.Image()
      img.onload = () => {
        setLocalImageUrl(urlToValidate)
        setImageState(prev => ({ ...prev, isUploading: false }))
        onImageChange(urlToValidate, true)
      }
      img.onerror = () => {
        toast.error("Failed to load image from URL")
        setImageState(prev => ({ ...prev, isUploading: false }))
      }
      img.src = urlToValidate
    } catch {
      toast.error("Failed to validate URL")
      setImageState(prev => ({ ...prev, isUploading: false }))
    }
  }, [inputUrl, onImageChange])

  const handleRemoveImage = useCallback(() => {
    setLocalImageUrl(null)
    setSourceType(null)
    setInputUrl("")
    onImageChange('', true)
  }, [onImageChange])

  const handleInputUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUrl(e.target.value)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleUrlSubmit()
    }
  }, [handleUrlSubmit])

  const hasImage = !!(base64Preview || localImageUrl)

  if (isLocked) {
    return (
      <div className="space-y-4">
        {localImageUrl ? (
          <div className="relative border border-border rounded-lg overflow-hidden h-[300px] w-full bg-card">
            <Image
              src={base64Preview || localImageUrl}
              alt="Schedule"
              fill
              className="object-contain p-4"
              onError={() => setImageState(prev => ({ ...prev, hasError: true }))}
              unoptimized={sourceType === 'url'}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] w-full border border-border rounded-lg bg-card">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} onChange={handleFileChange}
        accept="image/*" className="hidden" />

      {localImageUrl ? (
        <div className="space-y-4">
          <div className="relative border border-border rounded-lg overflow-hidden h-[300px] w-full bg-card">
            {imageState.hasError ? (
              <div className="flex items-center justify-center h-full flex-col">
                <p className="text-red-500">Image not found</p>
                <p className="text-xs text-muted-foreground mt-1">It&apos;s not you, it&apos;s us.</p>
              </div>
            ) : (
              <Image
                src={base64Preview || localImageUrl}
                alt="Schedule"
                fill
                className="object-contain p-4"
                onError={() => setImageState(prev => ({ ...prev, hasError: true }))}
                unoptimized={sourceType === "url"}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 bg-background/90 border border-border hover:bg-muted"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-2 min-w-0">
            <Button
              variant="outline"
              onClick={() => {
                handleUploadClick();
              }}
              className="flex-1 w-full min-w-0 whitespace-normal break-words py-3 items-center justify-center"
              disabled={imageState.isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {hasImage ? 'Replace Image (Device)' : 'Upload Image (Device)'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowUrlInput((prev) => !prev);
              }}
              className="flex-1 w-full min-w-0 whitespace-normal break-words py-3 items-center justify-center"
              disabled={imageState.isUploading}
            >
              <Link2 className="mr-2 h-4 w-4" />
              {hasImage ? 'Replace Image (URL)' : 'Upload Image (URL)'}
            </Button>
          </div>

          {showUrlInput && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={inputUrl}
                onChange={handleInputUrlChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter Chart ID or Napchart URL"
                className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleUrlSubmit}
                disabled={imageState.isUploading}
              >
                {imageState.isUploading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2 min-w-0">
            <Button
              variant={sourceType === "file" ? "default" : "outline"}
              onClick={() => handleSourceTypeToggle("file")}
              className="flex-1 w-full min-w-0 whitespace-normal break-words py-3 items-center justify-center"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
            <Button
              variant={sourceType === "url" ? "default" : "outline"}
              onClick={() => handleSourceTypeToggle("url")}
              className="flex-1 w-full min-w-0 whitespace-normal break-words py-3 items-center justify-center"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Enter URL
            </Button>
          </div>

          {sourceType === "file" && (
            <div
              onClick={handleUploadClick}
              className="border-2 border-dashed border-border rounded-lg bg-card hover:border-muted cursor-pointer py-10 flex flex-col items-center gap-3"
            >
              <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
              <p className="text-foreground font-medium">
                {imageState.isUploading ? "Uploading..." : "Click to upload"}
              </p>
            </div>
          )}

          {sourceType === "url" && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={inputUrl}
                onChange={handleInputUrlChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter Napchart URL"
                className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleUrlSubmit}
                disabled={imageState.isUploading}
              >
                {imageState.isUploading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}