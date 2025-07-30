import { useQuery } from "@tanstack/react-query";
import { type EntryWithImageStatus } from "@/models/entry";

export function useEntry(dateString: string) {
    return useQuery<EntryWithImageStatus>({
        queryKey: ["entry", dateString],
        queryFn: async () => {
            const res = await fetch(`/api/entries/${dateString}`);
            if (!res.ok) throw new Error("Failed to fetch entry");
            return res.json();
        }
    });
}

export function useEntries() {
    return useQuery<{ entries: EntryWithImageStatus[] }>({
        queryKey: ["entries"],
        queryFn: async () => {
            const res = await fetch("/api/entries");
            if (!res.ok) throw new Error("Failed to fetch entries");
            return res.json();
        }
    });
}