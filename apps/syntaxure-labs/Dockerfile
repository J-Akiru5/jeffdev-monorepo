FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/agency/package.json apps/agency/
COPY packages/ui/package.json packages/ui/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter jeffdev-agency... run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/agency/.next/standalone ./
COPY --from=build /app/apps/agency/.next/static ./apps/agency/.next/static
COPY --from=build /app/apps/agency/public ./apps/agency/public
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/agency/server.js"]
