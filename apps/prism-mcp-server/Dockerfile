FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/prism-mcp-server/package.json apps/prism-mcp-server/
COPY packages/db/package.json packages/db/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter prism-mcp-server... run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/prism-mcp-server/dist ./apps/prism-mcp-server/dist
COPY --from=build /app/apps/prism-mcp-server/package.json ./apps/prism-mcp-server/
COPY --from=build /app/packages ./packages
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3003
ENTRYPOINT ["node", "apps/prism-mcp-server/dist/index.js"]
CMD ["--standalone"]
