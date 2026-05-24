---
description: For scaffolding
---

🏁 WORKFLOW: FEATURE_SCAFFOLD (V1.0)
Trigger: /scaffold [feature-name] [target-app]

Step 1: The Blueprint (packages/ui)

Create the visual primitive in packages/ui/src/components.

Constraint: Must use Tailwind 4 and Framer Motion for micro-interactions.

Aesthetic Rule: Apply active:scale-95 and bg-void transitions.

Step 2: The Logic (packages/db)

Generate the Zod schema for the feature’s data.

Create a Server Action in the target app that validates input via the schema.

Step 3: The View (apps/[target-app])

Scaffold the Next.js 16 Page/Layout.

Constraint: Use async params and the useActionState hook for form handling.

Animation Rule: If the target is public-site, wrap the main container in a GSAP ScrollTrigger context.

Step 4: The Quality Gate

Verify that Editorial New is used for headings and JetBrains Mono for technical data.

Run a check to ensure no NEXT*PUBLIC* keys are exposed.
