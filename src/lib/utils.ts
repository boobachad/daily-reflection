import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasReflectionChanges(content: string, initialContent?: string): boolean {
  return content !== (initialContent || "");
}

export function getCharacterCount(content: string): number {
  return content.length;
}

export function hasImageUploaderChanges(localImageUrl: string | null, initialImageUrl: string | null): boolean {
  if (initialImageUrl === null && localImageUrl === null) return false;
  if (initialImageUrl === null && localImageUrl !== null) return true;
  if (initialImageUrl !== null && localImageUrl === null) return true;
  return initialImageUrl !== localImageUrl;
}

export function isNapchartUrl(url: string): boolean {
  // Accept full Napchart image URL or a valid chart ID
  return (
    (url.startsWith("https://napchart.com/api/v2/getImage") && url.includes("chartid=")) ||
    /^[a-zA-Z0-9]{9,}$/.test(url)
  );
}
