# Build the TypeScript backend in a reproducible Node environment.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Keep the runtime image small and exclude development dependencies.
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Render provides PORT automatically (usually 10000); the backend reads it.
EXPOSE 10000
CMD ["node", "dist/index.js"]
