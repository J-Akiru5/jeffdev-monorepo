import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn - ClassName Utility
 * ----------------------
 * Merges Tailwind CSS classes intelligently, handling conflicts.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-cyan-500', 'px-6') // 'py-2 px-6 bg-cyan-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility to convert Firestore data (Timestamps) to plain JSON-serializable objects.
 * Recursively walks the object and converts any object with .toDate() to an ISO string.
 */
export function sanitizeFirestoreData<T>(data: any): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Firestore Timestamp (duck typing)
  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString() as any;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFirestoreData(item)) as any;
  }

  // Handle Objects
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = sanitizeFirestoreData(data[key]);
      }
    }
    return result;
  }

  // Return primitive
  return data;
}
