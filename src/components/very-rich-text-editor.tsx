"use client"

import type React from "react"
import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { marked } from "marked"
import DOMPurify from "isomorphic-dompurify"
import { cn, getCharacterCount, hasReflectionChanges } from "@/lib/utils"

interface VeryRichTextEditorProps {
    initialContent: string
    onContentChange: (content: string, hasChanges: boolean) => void
    readOnly?: boolean
}

export default function VeryRichTextEditor({
    initialContent,
    onContentChange,
    readOnly = false
}: VeryRichTextEditorProps) {
    const [content, setContent] = useState(initialContent)
    const [activeTab, setActiveTab] = useState<"write" | "preview">(readOnly ? "preview" : "write")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Detect changes
    const hasChanges = useMemo(
        () => hasReflectionChanges(content, initialContent),
        [content, initialContent]
    )

    // Character count
    const characterCount = useMemo(() => getCharacterCount(content), [content])

    // Sync with initialContent prop
    useEffect(() => {
        setContent(initialContent)
    }, [initialContent])

    // Notify parent
    useEffect(() => {
        onContentChange(content, hasChanges)
    }, [content, hasChanges, onContentChange])

    // Handle textarea change
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        if (newValue.length <= 2000) {
            setContent(newValue)
        }
    }, [])

    // Insert text at cursor position
    const insertTextAtCursor = useCallback(
        (text: string) => {
            const textarea = textareaRef.current
            if (!textarea) return
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const before = content.substring(0, start)
            const after = content.substring(end)
            setContent(before + text + after)
            setTimeout(() => {
                textarea.focus()
                const newPosition = start + text.length
                textarea.setSelectionRange(newPosition, newPosition)
            }, 0)
        },
        [content]
    )

    // Render markdown preview
    const renderMarkdown = () => {
        marked.setOptions({ breaks: true, gfm: true })
        const rawHtml = marked.parse(content) as string
        const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
            ALLOWED_TAGS: [
                "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "p", "a", "ul", "ol", "nl", "li", "b", "i", "strong", "em", "strike", "code", "hr", "br", "div", "table", "thead", "caption", "tbody", "tr", "th", "td", "pre", "img", "span"
            ],
            ALLOWED_ATTR: ["href", "name", "target", "src", "alt", "class", "id", "rel"],
            ADD_URI_SAFE_ATTR: ["src"]
        })
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = sanitizedHtml
        const links = tempDiv.querySelectorAll("a")
        links.forEach((link) => {
            if (link.hasAttribute("href")) {
                link.setAttribute("target", "_blank")
                link.setAttribute("rel", "noopener noreferrer nofollow")
            }
        })
        return { __html: tempDiv.innerHTML }
    }

    return (
        <div className="space-y-4">
            <div className="border border-border rounded-md overflow-hidden bg-card">
                <div className="flex flex-col md:flex-row border-b border-border bg-muted">
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={() => setActiveTab("write")}
                            className={cn(
                                "px-4 py-2 text-sm font-medium focus:outline-none",
                                activeTab === "write"
                                    ? "border-b-2 border-primary text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            aria-selected={activeTab === "write"}
                            aria-controls="very-rich-text-editor-write"
                            id="very-rich-text-editor-tab-write"
                        >
                            Write
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setActiveTab("preview")}
                        className={cn(
                            "px-4 py-2 text-sm font-medium focus:outline-none",
                            activeTab === "preview"
                                ? "border-b-2 border-primary text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        aria-selected={activeTab === "preview"}
                        aria-controls="very-rich-text-editor-preview"
                        id="very-rich-text-editor-tab-preview"
                    >
                        Preview
                    </button>
                </div>
                {activeTab === "write" && !readOnly ? (
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleChange}
                            placeholder="Write your markdown here..."
                            className={cn(
                                "w-full min-h-[400px] p-4 font-mono resize-y border-0 focus:ring-0 focus:outline-none bg-background text-foreground placeholder:text-muted-foreground",
                                characterCount >= 2000 ? "bg-muted" : ""
                            )}
                            aria-label="Markdown text editor"
                            aria-describedby="very-rich-text-editor-character-count"
                            role="textbox"
                            aria-multiline="true"
                            id="very-rich-text-editor-write"
                            disabled={readOnly}
                        />
                        <div className="absolute bottom-0 left-0 right-0 px-4 py-1 bg-muted text-xs border-t border-border flex justify-between items-center">
                            <span
                                id="very-rich-text-editor-character-count"
                                className={cn(
                                    characterCount > 1800 && characterCount <= 1900
                                        ? "text-muted-foreground"
                                        : characterCount > 1900
                                            ? "text-red-500"
                                            : "text-muted-foreground"
                                )}
                            >
                                {characterCount} / 2000 characters
                            </span>
                            {hasChanges ? (
                                <span
                                    className="inline-flex items-center px-2 py-1 rounded-full bg-orange-900 text-orange-400 border border-orange-900"
                                    role="status"
                                    aria-live="polite"
                                >
                                    Unsaved changes
                                </span>
                            ) : (
                                <span
                                    className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 
                                    text-green-800 border 
                                    border-green-200"
                                    role="status"
                                    aria-live="polite"
                                >
                                    All changes saved
                                </span>
                            )}
                            {characterCount >= 2000 && <span className="text-red-500">Character limit reached</span>}
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <div
                            id="very-rich-text-editor-preview"
                            className="min-h-[400px] p-4 prose prose-slate max-w-none overflow-auto bg-background text-foreground"
                            dangerouslySetInnerHTML={renderMarkdown()}
                            aria-label="Markdown preview"
                            tabIndex={0}
                        />
                        <div className="absolute bottom-0 left-0 right-0 px-4 py-1 bg-muted text-xs border-t border-border flex justify-between items-center">
                            <span
                                className={cn(
                                    characterCount > 1800 && characterCount <= 1900
                                        ? "text-muted-foreground"
                                        : characterCount > 1900
                                            ? "text-red-500"
                                            : "text-muted-foreground"
                                )}
                            >
                                {characterCount} / 2000 characters
                            </span>
                            {hasChanges ? (
                                <span
                                    className="inline-flex items-center px-2 py-1 rounded-full bg-orange-900 text-orange-400 border border-orange-900"
                                    role="status"
                                    aria-live="polite"
                                >
                                    Unsaved changes
                                </span>
                            ) : (
                                <span
                                    className="inline-flex items-center px-2 py-1 rounded-full bg-blue-900 text-blue-400 border border-blue-900"
                                    role="status"
                                    aria-live="polite"
                                >
                                    All changes saved
                                </span>
                            )}
                            {characterCount >= 2000 && <span className="text-red-500">Character limit reached</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
