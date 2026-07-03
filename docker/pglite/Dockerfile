FROM node:22-alpine

RUN apk add --no-cache tini postgresql-client

WORKDIR /app

COPY pglite-package.json ./package.json

RUN npm install && \
    rm -rf /root/.npm /root/.cache /tmp/*

EXPOSE 51214

VOLUME ["/data"]

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", \
     "node_modules/@electric-sql/pglite-socket/dist/scripts/server.js", \
     "--db", "/data/pglite", \
     "--port", "51214", \
     "--max-connections", "10"]
