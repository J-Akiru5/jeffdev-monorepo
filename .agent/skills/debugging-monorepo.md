# Monorepo Debugging & Troubleshooting

This skill provides systematic debugging protocols for common issues in the JeffDev Turborepo monorepo.

## 🔍 Debugging Framework: The 5-Phase Protocol

### Phase 0: Infrastructure Audit (ALWAYS START HERE)

Before touching code, verify the foundation:

```bash
# 1. Check dependency alignment
npx syncpack list-mismatches

# 2. Verify Doppler is injecting secrets
echo $FIREBASE_ADMIN_PRIVATE_KEY        # Should not be empty
echo $COSMOS_ENDPOINT                    # Should not be empty

# 3. Verify Node.js version
node --version                           # Must be >= 18

# 4. Clear any stale artifacts
turbo clean
pnpm install
```

**If Phase 0 fails:** The problem is environmental, not code.

---

### Phase 1: Version & Boundary Verification

Next.js 16 + React 19 have specific requirements:

```bash
# Are we running the latest versions?
grep '"react":' packages/*/package.json apps/*/package.json
grep '"next":' apps/*/package.json

# Are there circular imports?
turbo run lint --filter=packages/ui
turbo run check-types --filter=packages/ui

# Is a Server Component importing Client code?
# Look for patterns like: import { useClient } from 'client-component'
# in files without 'use client' directive
```

**Common symptoms:**
- `Invalid Hook Call` → React version mismatch
- `Module not found` → Circular dependency
- `ReferenceError: document` → Client code on server

---

### Phase 2: Isolation (Debug ONE Thing at a Time)

Use Turborepo's `--filter` flag to isolate the problem:

```bash
# Is the error in agency or prism-dashboard?
turbo run build --filter=apps/agency
turbo run build --filter=apps/prism-dashboard

# Is the error in the app or a shared package?
turbo run build --filter=apps/agency         # Works?
turbo run build --filter=packages/ui         # Works?
turbo run build --filter=apps/agency         # Still works?

# Build the dependency chain to find the culprit
turbo run build --filter=apps/prism-dashboard^
  # (^ = include all dependencies)
```

---

### Phase 3: Layer Stripping (Remove Complexity)

Identify whether the issue is in UI, State, or Data:

```typescript
// Step 1: Test the Data Layer
// Remove all UI/animations, keep data fetching
export default function TestPage() {
  const [data, setData] = useState(null);
  
  useEffect(async () => {
    const result = await fetchData();  // Does this work?
    setData(result);
  }, []);
  
  if (!data) return <div>Loading...</div>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

// Step 2: Add UI without animations
export default function TestPage() {
  return <div>{data.name}</div>;
}

// Step 3: Add animations/complex features
export default function TestPage() {
  return <motion.div>{data.name}</motion.div>;
}
```

**Decision tree:**
- **Data layer fails** → DB connection / Serialization issue
- **UI layer fails** → Component / Styling issue
- **Animation fails** → Framer Motion / GSAP issue

---

### Phase 4: Root Cause Diagnosis

Use strategic logging to pinpoint the exact line:

```typescript
// ❌ BAD: Vague console.log
console.log('Error:', error);

// ✅ GOOD: Structured logging with context
console.error('[prism-dashboard:api/rules]', {
  method: 'POST',
  projectId: params.projectId,
  error: error.message,
  stack: error.stack,
  cosmos: { endpoint: process.env.COSMOS_ENDPOINT?.slice(0, 10) + '...' },
});
```

---

## 🚨 Common Error Patterns

### 1. "Only plain objects can be passed to Client Components"

**Root Cause:** Firestore `Timestamp` passed from Server → Client

```typescript
// ❌ WRONG
export async function getProject(id: string) {
  const doc = await firestore.collection('projects').doc(id).get();
  return doc.data(); // createdAt is a Timestamp!
}

// ✅ CORRECT
export async function getProject(id: string) {
  const doc = await firestore.collection('projects').doc(id).get();
  const data = doc.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
  };
}
```

**Debugging steps:**
1. Find the server action returning the data
2. Check for all Firestore Timestamp fields
3. Add `.toDate().toISOString()` conversion
4. Test with `JSON.stringify()` first

---

### 2. "Module not found" in Workspace Dependency

**Root Cause:** Package not properly exported or symlink broken

```bash
# Check if the package is listed in exports
cat packages/ui/package.json | grep -A 10 '"exports"'

# Verify the file exists
ls -la packages/ui/src/Button.tsx

# Clear and reinstall
turbo clean
pnpm install
turbo run build --filter=packages/ui
turbo run build --filter=apps/agency
```

---

### 3. "Connection Refused" to Cosmos DB

**Root Cause:** Doppler not injecting secrets or wrong endpoint

```bash
# Check if Doppler is working
doppler run -- printenv | grep COSMOS

# If empty, restart dev:
pkill -f "turbo dev"
doppler run -- turbo dev

# Test connection directly
node -e "
  const { CosmosClient } = require('@azure/cosmos');
  new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY,
  }).getDatabaseAccount()
    .then(() => console.log('✅ Connected'))
    .catch(e => console.error('❌', e.message));
"
```

---

### 4. "Hydration Mismatch" or "Text Content Mismatch"

**Root Cause:** Server rendered different HTML than client expected

```typescript
// ❌ WRONG: Random data on render
export function Component() {
  return <div>{Math.random()}</div>; // Server: 0.5, Client: 0.7
}

// ✅ CORRECT: Use useEffect to sync
export function Component() {
  const [random, setRandom] = useState(null);
  
  useEffect(() => {
    setRandom(Math.random());
  }, []);
  
  if (random === null) return null; // Or a loading state
  return <div>{random}</div>;
}

// ✅ ALTERNATIVE: Suppress the warning if expected
export function Component() {
  return <div suppressHydrationWarning>{Math.random()}</div>;
}
```

---

### 5. "Invalid Hook Call"

**Root Cause:** React version mismatch or hook used outside component

```bash
# Fix version mismatch
npx syncpack fix-mismatches
pnpm install

# Verify same React version everywhere
grep '"react":' apps/*/package.json packages/*/package.json | sort | uniq
```

---

### 6. "ReferenceError: document is not defined"

**Root Cause:** Client code running on server

```typescript
// ❌ WRONG: Top-level use of document
const theme = localStorage.getItem('theme'); // Server context!

// ✅ CORRECT: Add 'use client' directive
'use client';
const theme = localStorage.getItem('theme');

// ✅ ALTERNATIVE: Use dynamic() for client-only components
import dynamic from 'next/dynamic';
const ClientComponent = dynamic(() => import('./client'), { ssr: false });
```

---

### 7. Stale Cache After Data Mutation

**Root Cause:** `revalidatePath()` not called

```typescript
'use server';
import { revalidatePath } from 'next/cache';

export async function updateProject(data: unknown) {
  const validated = schema.parse(data);
  
  // Update in database
  await db.update(validated);
  
  // ⚡ Clear the cache so Next.js refetches
  revalidatePath('/admin/projects');
  revalidatePath(`/admin/projects/${validated.id}`);
  
  return { success: true };
}
```

---

### 8. "Rate Limited" on API Route

**Root Cause:** Rate limiter exceeded, or Upstash Redis not connected

```typescript
// Check rate limiter configuration
cat apps/prism-dashboard/src/middleware.ts | grep -A 10 'rateLimit'

// Test Redis connection
redis.ping()
  .then(() => console.log('✅ Redis connected'))
  .catch(e => console.error('❌', e.message));

// Temporarily increase limits for testing
// In middleware.ts:
const limit = process.env.NODE_ENV === 'development' ? 1000 : 10;
```

---

## 📋 Debugging Checklist Template

Use this when debugging any issue:

```markdown
## Issue: [Brief description]

### Phase 0: Infrastructure
- [ ] `npx syncpack list-mismatches` → No mismatches
- [ ] `doppler run -- env | grep KEY` → Secrets injected
- [ ] `node --version` → >= 18
- [ ] `turbo clean && pnpm install` → Success

### Phase 1: Boundaries
- [ ] Check Node vs React versions across workspaces
- [ ] Verify no cross-app imports
- [ ] Check for 'use client' directives in right places

### Phase 2: Isolation
- [ ] `turbo run build --filter=BROKEN_APP` → Error reproduced
- [ ] `turbo run build --filter=BROKEN_APP^` → Dep chain works?
- [ ] `turbo run lint --filter=BROKEN_PACKAGE` → Lint errors?

### Phase 3: Layer Stripping
- [ ] Data layer working? (log raw fetch result)
- [ ] UI rendering correctly? (remove animations)
- [ ] Animations working? (add back incrementally)

### Phase 4: Root Cause
- [ ] Identified exact file and line
- [ ] Reproduced in minimal example
- [ ] Fix applied and tested locally
- [ ] Tested in full `turbo dev` environment
```

---

## 🔧 Debugging Tools & Commands

| Tool | Command | Purpose |
|------|---------|---------|
| Turbo Visualizer | `turbo run build --graph` | See dependency graph |
| Type Check | `turbo run check-types` | Find TypeScript errors |
| Lint | `turbo run lint -- --debug` | Debug ESLint issues |
| Dependency Tree | `pnpm list @jdstudio/ui` | Check transitive deps |
| Network Inspector | Browser DevTools Network tab | Check Cosmos/Firebase calls |
| VS Code Debugger | `node --inspect-brk` | Debug Node.js server |

---

## 🚀 Prevention Strategies

### 1. Test Before Committing

```bash
# Run full test suite
turbo run test

# Run linting
turbo run lint

# Check types
turbo run check-types

# Or use a pre-commit hook (husky)
cat .husky/pre-commit
```

### 2. Use TypeScript Strictly

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 3. Create Isolated Test Cases

```typescript
// __tests__/serialization.test.ts
import { Timestamp } from 'firebase-admin/firestore';

describe('Timestamp Serialization', () => {
  it('should convert Timestamp to ISO string', () => {
    const ts = Timestamp.now();
    const iso = ts.toDate().toISOString();
    expect(JSON.stringify({ date: iso })).toBeDefined();
  });
});
```

---

## 📚 Related Documentation

- [Firestore Server Boundaries](./firestore-server-boundaries.md)
- [Debugging Armor Rules](../rules/debbuging-armor.md)
- [Monorepo Structure](./monorepo-structure.md)
