# Next.js Stack Template

> **Stack**: nextjs  
> **Version**: Next.js 14+ (App Router)  
> **Runtime**: React 18+, Server Components

## Project Structure

```
app/
├── (routes)/         # Route groups
│   ├── page.tsx      # Server Component (default)
│   └── layout.tsx    # Shared layout
├── api/              # API routes
│   └── route.ts
├── components/
│   ├── ui/           # Client components (interactive)
│   └── server/       # Server components (data fetching)
└── lib/              # Utilities and configs
```

## Server vs Client Components

### Server Component (Default)
```tsx
// app/components/UserList.tsx
// No 'use client' - runs on server

async function UserList() {
  const users = await db.users.findMany();
  
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

export default UserList;
```

### Client Component (Interactive)
```tsx
'use client';

import { useState } from 'react';

interface CounterProps {
  initialCount?: number;
}

export function Counter({ initialCount = 0 }: CounterProps) {
  const [count, setCount] = useState(initialCount);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

## Data Fetching

### Server Component Fetching
```tsx
// Runs on server - no loading states needed
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetch(`/api/products/${params.id}`).then(r => r.json());
  
  return <ProductDetails product={product} />;
}
```

### Client Fetching (useTransition)
```tsx
'use client';

import { useTransition } from 'react';

export function SaveButton({ onSave }: { onSave: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => onSave())}
    >
      {isPending ? 'Saving...' : 'Save'}
    </button>
  );
}
```

## Server Actions

```tsx
// app/actions.ts
'use server';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  
  await db.posts.create({ title, content });
  revalidatePath('/posts');
}
```

```tsx
// In component
<form action={createPost}>
  <input name="title" />
  <textarea name="content" />
  <button type="submit">Create</button>
</form>
```

## Routing with Link

```tsx
import Link from 'next/link';

<Link href="/dashboard" className="text-blue-500 hover:underline">
  Dashboard
</Link>

// Programmatic navigation
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard');
```

## Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/hero.png"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Load immediately for LCP
/>
```

## Metadata

```tsx
// app/layout.tsx or page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
};
```

## Loading & Error States

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div className="animate-pulse">Loading...</div>;
}

// app/dashboard/error.tsx
'use client';

export default function Error({ error, reset }: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## AI Generation Rules

When generating Next.js components:

1. **Add 'use client'** only for interactive components
2. **Prefer Server Components** for data display
3. **Use Server Actions** for mutations
4. **Import from 'next/link'** for navigation
5. **Import from 'next/image'** for images
6. **Use useRouter from 'next/navigation'** (not 'next/router')
7. **Async components** can await data directly
8. **No useEffect for data fetching** in Server Components
