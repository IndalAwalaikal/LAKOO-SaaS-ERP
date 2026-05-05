import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  // If it's a relative path (MinIO path starting with /bucket-name)
  if (url.startsWith('/')) {
    const minioBase = "http://localhost:9000";
    return `${minioBase}${url}`;
  }

  // Transforms Docker-internal Minio host to localhost for browser accessibility
  return url.replace('http://minio:9000', 'http://localhost:9000');
}
