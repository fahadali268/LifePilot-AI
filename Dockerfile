# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev=false

# Copy source files and build the app
COPY . .
RUN npm run build

# Runtime image
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev=false && npm cache clean --force
COPY --from=base /app/dist ./dist
COPY --from=base /app/server.ts ./server.ts
COPY --from=base /app/src ./src
COPY --from=base /app/index.html ./index.html
COPY --from=base /app/vite.config.ts ./vite.config.ts
COPY --from=base /app/tsconfig.json ./tsconfig.json
COPY --from=base /app/metadata.json ./metadata.json
COPY --from=base /app/assets ./assets
COPY --from=base /app/firebase-applet-config.json ./firebase-applet-config.json
COPY --from=base /app/firebase-blueprint.json ./firebase-blueprint.json
COPY --from=base /app/firestore.rules ./firestore.rules

EXPOSE 8080
CMD ["npm", "run", "start"]
