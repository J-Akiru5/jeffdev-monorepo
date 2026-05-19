FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/prism-dashboard/package.json apps/prism-dashboard/
COPY packages/db/package.json packages/db/
COPY packages/ui/package.json packages/ui/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/prism-cli/package.json packages/prism-cli/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter prism-dashboard... run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/prism-dashboard/.next/standalone ./
COPY --from=build /app/apps/prism-dashboard/.next/static ./apps/prism-dashboard/.next/static
COPY --from=build /app/apps/prism-dashboard/public ./apps/prism-dashboard/public
EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/prism-dashboard/server.js"]
