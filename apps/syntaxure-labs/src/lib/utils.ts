/**
 * Utility to convert Firestore data (Timestamps) to plain JSON-serializable objects.
 * Recursively walks the object and converts any object with .toDate() to an ISO string.
 */
export function sanitizeFirestoreData<T>(data: unknown): T {
  if (data === null || data === undefined) {
    return data as unknown as T;
  }

  // Handle Firestore Timestamp (duck typing)
  if (
    typeof data === "object" &&
    data !== null &&
    "toDate" in data &&
    typeof (data as { toDate: unknown }).toDate === "function"
  ) {
    return (data as { toDate: () => Date })
      .toDate()
      .toISOString() as unknown as T;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }

  // Handle Objects
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = sanitizeFirestoreData(obj[key]);
      }
    }
    return result as unknown as T;
  }

  // Return primitive
  return data as unknown as T;
}
