FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/prism-admin/package.json apps/prism-admin/
COPY packages/ui/package.json packages/ui/
COPY packages/db/package.json packages/db/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter prism-admin... run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/prism-admin/.next/standalone ./
COPY --from=build /app/apps/prism-admin/.next/static ./apps/prism-admin/.next/static
COPY --from=build /app/apps/prism-admin/public ./apps/prism-admin/public
EXPOSE 3004
ENV PORT=3004
CMD ["node", "apps/prism-admin/server.js"]
