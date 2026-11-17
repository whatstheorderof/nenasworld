# Nena's mind. Build from the repo root so shared/ is included.
FROM node:22-alpine
WORKDIR /app
COPY shared ./shared
COPY mind/package.json ./mind/
RUN cd mind && npm install --omit=dev
COPY mind ./mind
# Mount a persistent volume at /data so her memory survives restarts.
ENV PORT=8080 DATA_DIR=/data
EXPOSE 8080
CMD ["node", "mind/src/server.js"]
