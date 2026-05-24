export interface TemplateRule {
  name: string;
  category:
    | "architecture"
    | "styling"
    | "security"
    | "performance"
    | "testing"
    | "documentation"
    | "custom";
  content: string;
  priority: number;
  pattern?: string;
  severity?: "error" | "warning" | "info";
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  rules: TemplateRule[];
}

export const ruleTemplates: RuleTemplate[] = [
  {
    id: "nextjs-16-essentials",
    name: "Next.js 16 Essentials",
    description:
      "Core architectural rules for modern Next.js 16 App Router applications.",
    category: "Framework",
    icon: "layers",
    rules: [
      {
        name: "Server Components by Default",
        category: "architecture",
        priority: 10,
        content:
          "Always use React Server Components by default. Only add the `'use client'` directive at the very top of files when you absolutely need interactivity (useState, useEffect, event listeners, or browser APIs). Keep client components as leaves in the component tree.",
      },
      {
        name: "Data Fetching in Server Components",
        category: "performance",
        priority: 20,
        content:
          "Fetch data directly inside Server Components using `await fetch()`. Avoid using `useEffect` for data fetching unless absolutely necessary for client-side only data. Use `next: { revalidate: 3600 }` or tag-based revalidation instead of legacy `getStaticProps`.",
      },
      {
        name: "Server Actions for Mutations",
        category: "architecture",
        priority: 15,
        content:
          "Use Server Actions for all form submissions and data mutations. Define actions in a separate `actions.ts` file with `'use server'` at the top. Wrap actions used in client components with React's `useActionState` hook.",
      },
      {
        name: "Serialization Boundary Rule",
        category: "architecture",
        priority: 5,
        content:
          "Never pass complex objects (like Date, Map, or Database classes) directly from Server Components to Client Components. Serialize them to plain JSON or ISO strings first.",
        pattern: "props.*Date|Timestamp",
        severity: "error",
      },
    ],
  },
  {
    id: "react-19-modern",
    name: "React 19 Modern Patterns",
    description: "Leverage the new hooks and features introduced in React 19.",
    category: "Library",
    icon: "code",
    rules: [
      {
        name: "Use 'use' Hook for Promises",
        category: "architecture",
        priority: 25,
        content:
          "In client components, prefer the new `use()` hook to unwrap Promises passed from Server Components instead of `useEffect` + `useState`. This works natively with Suspense.",
      },
      {
        name: "Optimistic Updates with useOptimistic",
        category: "performance",
        priority: 30,
        content:
          "When calling a Server Action that modifies data, use the `useOptimistic` hook to immediately update the UI before the server responds. Do not wait for the server roundtrip for visual feedback.",
      },
      {
        name: "useActionState for Form State",
        category: "architecture",
        priority: 20,
        content:
          "Always use `useActionState` (formerly `useFormState`) to manage loading states, errors, and responses from Server Actions in forms. Stop using manual `useState(false)` loading toggles.",
        pattern: "const \\[isLoading, setIsLoading\\] = useState",
        severity: "warning",
      },
    ],
  },
  {
    id: "tailwind-v4",
    name: "Tailwind CSS v4 Standards",
    description:
      "Strict styling rules for clean, maintainable utility classes.",
    category: "Styling",
    icon: "paintbrush",
    rules: [
      {
        name: "No Inline Styles",
        category: "styling",
        priority: 15,
        content:
          "Never use the React `style={{}}` prop for styling. All styling must be done via Tailwind CSS classes.",
        pattern: "style={{",
        severity: "error",
      },
      {
        name: "Dynamic Classes with clsx/tailwind-merge",
        category: "styling",
        priority: 25,
        content:
          "When composing dynamic Tailwind classes, always wrap them in a utility function that uses `clsx` and `tailwind-merge` (typically named `cn`). Do not use template literals directly `\${cond ? 'p-4' : 'p-2'}`.",
      },
      {
        name: "Semantic Color Tokens",
        category: "styling",
        priority: 35,
        content:
          "Use semantic color variables defined in the design system (e.g., `text-primary`, `bg-surface`) rather than literal colors (e.g., `text-blue-500`) unless the design system explicitly uses literal colors.",
      },
    ],
  },
  {
    id: "node-api-security",
    name: "Node/API Security Guard",
    description: "Essential rules for secure API route development.",
    category: "Security",
    icon: "shield",
    rules: [
      {
        name: "Input Validation (Zod Gate)",
        category: "security",
        priority: 5,
        content:
          "Every API Route and Server Action MUST validate its inputs using Zod. Never trust `req.body` or `formData` directly without parsing.",
        pattern: "const body = await request.json\\(\\);\\s*if\\s*\\(!",
        severity: "error",
      },
      {
        name: "Rate Limiting Required",
        category: "security",
        priority: 10,
        content:
          "All state-mutating endpoints (POST, PATCH, DELETE) and authentication routes MUST have rate limiting applied before executing business logic.",
      },
      {
        name: "No Secrets in Client Bundles",
        category: "security",
        priority: 1,
        content:
          "Never prefix database URIs, Admin API keys, or private service tokens with `NEXT_PUBLIC_`. These will leak into the client JavaScript bundle.",
        pattern: "NEXT_PUBLIC_.*(?:KEY|SECRET|PASSWORD|URI)",
        severity: "error",
      },
    ],
  },
];
