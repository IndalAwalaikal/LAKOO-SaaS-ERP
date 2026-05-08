import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  // If it's a relative path from our new local storage
  if (url.startsWith('/storage/')) {
    const apiBase = "http://localhost:8080";
    return `${apiBase}${url}`;
  }

  // Fallback for old minio data if any still exists during transition
  if (url.startsWith('/')) {
    return `http://localhost:9000${url}`;
  }

  return url.replace('http://minio:9000', 'http://localhost:9000');
}
