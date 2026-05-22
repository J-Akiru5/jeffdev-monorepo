## Proposed Changes

Provide a brief summary of the changes introduced by this pull request.

-

## Checklist

Please check all that apply:

- [ ] My code follows the monorepo architecture rules (no cross-app imports).
- [ ] New/generic UI components are created in `packages/ui` instead of the local app.
- [ ] No raw Firestore `Timestamp` objects are passed from Server Components to Client Components (properly serialized to ISO string).
- [ ] Next.js 16 layouts and dynamic pages are forced dynamic (`await cookies()`) where appropriate.
- [ ] Verified build succeeds with zero lint warnings or typescript check errors (`pnpm check-types && pnpm lint && pnpm build`).
- [ ] Local tests pass (`pnpm test`).
- [ ] Any required environment variables are updated/validated.

## Verification / Screenshots

Detail how you verified these changes, and attach screenshots or videos for UI updates.
