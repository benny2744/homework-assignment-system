FROM node:20-bookworm-slim AS base
WORKDIR /app

# Needed for Prisma engines + some native deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable
RUN yarn install --immutable

FROM base AS build
ARG NEXT_PUBLIC_BASE_PATH=""
ARG NEXT_BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_BASE_PATH=$NEXT_BASE_PATH
ENV NODE_ENV=production

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn prisma generate
RUN yarn build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/.next/standalone ./
# Important: standalone server runs with cwd=/app/app and expects static at /app/app/.next/static
COPY --from=build /app/.next/static ./app/.next/static

EXPOSE 3000
CMD ["node", "app/server.js"]

FROM deps AS migrate
COPY . .
CMD ["sh", "-lc", "yarn prisma db push"]


