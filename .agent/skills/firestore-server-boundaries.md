# Next.js 16 Firestore Server Boundaries

This skill focuses on the critical patterns for passing data from Next.js 16 Server Components to Client Components, especially when using Firebase Firestore.

## 🚨 The Core Problem

Firestore `Timestamp` objects are **class instances** that cannot be serialized to JSON. When passed from a Server Component to a Client Component, Next.js 16 throws:

```
Error: Only plain objects can be passed to Client Components from Server Components. 
Classes or null prototypes are not supported.
```

**This is NOT a bug—it's by design.** React 19 (Server Components) enforces serialization boundaries to prevent leaking non-serializable objects to the browser.

---

## ✅ The Correct Pattern

### Step 1: Serialize in Server Actions

All server actions that return Firestore data **must serialize Timestamps to ISO strings**:

```typescript
// ❌ WRONG - Will crash
export async function getProject(projectId: string) {
  const snapshot = await firestore
    .collection('projects')
    .doc(projectId)
    .get();
  
  return snapshot.data(); // createdAt is a Timestamp!
}

// ✅ CORRECT - Serialize before returning
export async function getProject(projectId: string) {
  const snapshot = await firestore
    .collection('projects')
    .doc(projectId)
    .get();
  
  const data = snapshot.data();
  if (!data) return null;
  
  // Serialize all Timestamp fields
  return {
    ...data,
    createdAt: data.createdAt?.toDate?.()
      ? data.createdAt.toDate().toISOString()
      : new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()
      ? data.updatedAt.toDate().toISOString()
      : new Date().toISOString(),
  };
}
```

### Step 2: Type the Returned Data

Use **Zod** to define the shape of serialized data:

```typescript
// lib/schemas.ts
import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(), // ISO string, NOT Timestamp
  updatedAt: z.string().datetime(),
});

export type Project = z.infer<typeof ProjectSchema>;

// app/actions/projects.ts
'use server';
import { ProjectSchema } from '@/lib/schemas';

export async function getProject(projectId: string) {
  const data = await fetchFromFirestore(projectId);
  return ProjectSchema.parse(data); // Type-safe!
}
```

### Step 3: Pass to Client Components

Now the data is safe to pass as props:

```typescript
// app/projects/[id]/page.tsx (Server Component)
import { getProject } from '@/app/actions/projects';
import { ProjectClient } from '@/components/project-client';

export default async function ProjectPage({ params }) {
  const project = await getProject(params.id);
  
  // Data is serialized and type-safe ✅
  return <ProjectClient project={project} />;
}

// components/project-client.tsx (Client Component)
'use client';
import { Project } from '@/lib/schemas';

export function ProjectClient({ project }: { project: Project }) {
  // ✅ createdAt is a string, not a Timestamp
  const date = new Date(project.createdAt);
  return <div>{date.toLocaleDateString()}</div>;
}
```

---

## 🔄 Pattern: Batch Queries with Serialization

When fetching multiple documents:

```typescript
'use server';

export async function listProjects(limit = 10) {
  const snapshot = await firestore
    .collection('projects')
    .limit(limit)
    .get();
  
  // Serialize ALL documents
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()
        ? data.createdAt.toDate().toISOString()
        : null,
      updatedAt: data.updatedAt?.toDate?.()
        ? data.updatedAt.toDate().toISOString()
        : null,
    };
  });
}
```

---

## 🔧 Pattern: Mutations with Revalidation

When mutating data, always call `revalidatePath()` to clear Next.js cache:

```typescript
'use server';
import { revalidatePath } from 'next/cache';

export async function updateProject(
  projectId: string, 
  data: unknown
) {
  const validated = ProjectSchema.partial().parse(data);
  
  // Update in Firestore
  await firestore
    .collection('projects')
    .doc(projectId)
    .update({
      ...validated,
      updatedAt: FieldValue.serverTimestamp(),
    });
  
  // ⚡ Invalidate cache so Next.js refetches
  revalidatePath(`/projects/${projectId}`);
  
  return { success: true };
}
```

---

## 🎯 Pattern: Real-Time Subscriptions (Admin Pages)

For admin dashboards that need **always fresh** data:

```typescript
// app/admin/page.tsx
import { cookies } from 'next/headers';

export default async function AdminPage() {
  // ⚡ Force dynamic rendering (ignore cache)
  await cookies();
  
  // This will run fresh every request
  const projects = await listProjects();
  
  return <AdminClient projects={projects} />;
}
```

---

## 📋 Serialization Checklist

Before passing data from Server → Client, verify:

- [ ] All Firestore `Timestamp` fields are converted to ISO strings (`.toDate().toISOString()`)
- [ ] All nested objects (arrays of objects, etc.) have timestamps serialized
- [ ] Function return type is defined with Zod schema
- [ ] Server action uses `'use server';` directive
- [ ] Client component uses `'use client';` directive
- [ ] No circular references
- [ ] No functions or class instances in the data

### Auto-Serialization Helper

Create a utility to avoid repetitive serialization:

```typescript
// lib/firestore-helpers.ts
import { Timestamp } from 'firebase-admin/firestore';

export function serializeTimestamps<T extends Record<string, any>>(
  obj: T
): T {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value instanceof Timestamp) {
      acc[key as keyof T] = value.toDate().toISOString() as any;
    } else if (Array.isArray(value)) {
      acc[key as keyof T] = value.map(item =>
        item instanceof Timestamp ? item.toDate().toISOString() : item
      ) as any;
    } else if (value && typeof value === 'object') {
      acc[key as keyof T] = serializeTimestamps(value) as any;
    } else {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as T);
}

// Usage:
export async function getProject(projectId: string) {
  const data = await firestore.collection('projects').doc(projectId).get();
  return serializeTimestamps(data.data() || {});
}
```

---

## 🐛 Debugging Serialization Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Classes or null prototypes...` | Timestamp passed to Client | Use `.toDate().toISOString()` in server action |
| `Hydration mismatch` | Server rendered different data than client expected | Check if cache is stale; use `await cookies()` or `revalidatePath()` |
| `Undefined in JSON` | Function/Symbol in data | Filter out non-serializable values |
| `BigInt serialization` | Number too large for JSON | Convert to string in server action |

---

## 📚 Related Documentation

- [Firestore Best Practices](../rules/admin-guide.md#2-firestore-data-architecture)
- [Server Actions](../rules/admin-guide.md#next-js-16-server-client-boundaries)
- [Debugging Armor](../rules/debbuging-armor.md)
