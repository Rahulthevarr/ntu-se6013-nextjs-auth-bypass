FROM node:22-bookworm-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d AS build
WORKDIR /lab/app
ENV NEXT_TELEMETRY_DISABLED=1
COPY app/package.json app/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY app/ ./
COPY shared/ /lab/shared/
RUN npm run build

FROM node:22-bookworm-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d AS runtime
WORKDIR /lab
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /lab/app/.next/standalone/ ./
COPY --from=build --chown=node:node /lab/app/.next/static/ ./app/.next/static/
USER node
EXPOSE 3000
CMD ["node", "app/server.js"]
