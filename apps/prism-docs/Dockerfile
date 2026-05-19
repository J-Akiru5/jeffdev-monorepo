FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/prism-docs/package.json apps/prism-docs/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter prism-docs... run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/prism-docs/.next/standalone ./
COPY --from=build /app/apps/prism-docs/.next/static ./apps/prism-docs/.next/static
COPY --from=build /app/apps/prism-docs/public ./apps/prism-docs/public
EXPOSE 3002
ENV PORT=3002
CMD ["node", "apps/prism-docs/server.js"]
