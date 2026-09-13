# Next.js production image: install with the locked pnpm version, build, then run the
# standalone server alone. API_BASE_URL is read at runtime (lib/env.ts),
# so one image serves any environment.
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# Standalone output leaves out public/ (the logo), which the server still serves.
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
