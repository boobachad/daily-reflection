"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EntryWithDayX {
    id: string;
    date: string;
    formattedDate: string;
    dayX: number;
    hasReflection: boolean;
    hasActualSchedule: boolean;
    hasExpectedSchedule: boolean;
}

interface EntriesListProps {
    entries: EntryWithDayX[];
}

export function EntriesList({ entries }: EntriesListProps) {
    const [deletingEntries, setDeletingEntries] = useState<Set<string>>(new Set());
    const router = useRouter();

    const handleDelete = async (entryDate: string, entryId: string, event: React.MouseEvent) => {
        // Prevent the Link from being triggered
        event.preventDefault();
        event.stopPropagation();

        if (deletingEntries.has(entryId)) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete the entry for ${entryDate}? This action cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingEntries(prev => new Set(prev).add(entryId));

        try {
            const response = await fetch(`/api/entries/${entryDate}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete entry');
            }

            // Refresh the page to show updated entries list
            router.refresh();
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert(`Failed to delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setDeletingEntries(prev => {
                const newSet = new Set(prev);
                newSet.delete(entryId);
                return newSet;
            });
        }
    };

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
                <div key={entry.id} className="relative group">
                    <Link href={`/entries/${entry.date}`} passHref>
                        <Card className="h-full border-border hover:border-border hover:shadow-md transition-all bg-card cursor-pointer">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex justify-between items-center">
                                    <span className="text-foreground font-semibold">Day {entry.dayX}</span>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {entry.formattedDate}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mt-2">
                                    {entry.hasExpectedSchedule && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-900 text-green-400">
                                            Expected
                                        </span>
                                    )}
                                    {entry.hasActualSchedule && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-400">
                                            Actual
                                        </span>
                                    )}
                                    {entry.hasReflection && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-900 text-orange-400">
                                            Reflection
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Delete Button */}
                    <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-600 hover:bg-red-700 text-white"
                        onClick={(e) => handleDelete(entry.date, entry.id, e)}
                        disabled={deletingEntries.has(entry.id)}
                        title={`Delete entry for ${entry.formattedDate}`}
                    >
                        {deletingEntries.has(entry.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <X className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            ))}
        </div>
    );
}