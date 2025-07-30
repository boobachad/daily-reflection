"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function ClearAllButton() {
    const handleClearAll = async () => {
        try {
            // Check if there are entries to delete
            const checkResponse = await fetch('/api/entries')
            if (!checkResponse.ok) throw new Error('Failed to check entries')
            const { count } = await checkResponse.json()

            if (count === 0) {
                toast.warning("No entries to clear")
                return
            }

            const deleteResponse = await fetch('/api/entries', {
                method: 'DELETE'
            })

            if (!deleteResponse.ok) throw new Error('Failed to clear entries')

            toast.success("All entries cleared successfully", {
                action: { label: 'Undo', onClick: () => { } }
            })
            window.location.reload()
        } catch (error) {
            console.error("Clear all error:", error)
            toast.error("Error", {
                description: "Failed to clear all entries. Please try again."
            })
        }
    }

    return (
        <Button variant="destructive" onClick={handleClearAll}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Entries
        </Button>
    )
}