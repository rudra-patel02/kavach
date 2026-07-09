# Production backend image: prod deps only, runs as the non-root `node` user.
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

# Drop privileges — never run the server as root.
USER node

CMD ["node", "src/index.js"]
