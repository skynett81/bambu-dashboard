FROM node:22-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

RUN mkdir -p data certs

EXPOSE 3000 3443 9001

CMD ["node", "--experimental-sqlite", "server/index.js"]
