"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { getCharacterCount, hasReflectionChanges } from "@/lib/utils"

interface RichTextEditorProps {
  initialContent: string
  onContentChange: (content: string, hasChanges: boolean) => void
}

export default function RichTextEditor({
  initialContent,
  onContentChange
}: RichTextEditorProps) {
  // State variables for managing editor content
  const [content, setContent] = useState(initialContent)

  // Derive hasChanges from content comparison
  const hasChanges = useMemo(() =>
    hasReflectionChanges(content, initialContent),
    [content, initialContent]
  )

  // Update content when initialContent changes
  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])

  // Notify parent of content changes
  useEffect(() => {
    onContentChange(content, hasChanges)
  }, [content, hasChanges, onContentChange])

  // Handler for content changes in the textarea
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
  }, [])

  return (
    <div className="space-y-4">
      <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full min-h-[300px] p-6 bg-transparent focus:outline-none text-gray-800 placeholder-gray-400 resize-none"
          placeholder="Write your reflection..."
          aria-label="Reflection text editor"
          aria-describedby="character-count"
          role="textbox"
          aria-multiline="true"
        />
        {/* Footer section displaying character count and unsaved changes indicator */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span id="character-count">{getCharacterCount(content)} characters</span>
          {hasChanges && (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100"
              role="status"
              aria-live="polite"
            >
              Unsaved changes
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
