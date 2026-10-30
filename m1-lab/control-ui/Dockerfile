FROM node:22-bookworm-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d
WORKDIR /lab
COPY --chown=node:node control-ui/ ./control-ui/
USER node
EXPOSE 4317
CMD ["node", "control-ui/server.mjs"]
