FROM node:lts AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential

RUN npm install -g pnpm node-gyp

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm build

RUN npm pkg delete scripts.prepare

RUN rm -rf node_modules && pnpm install --production --no-optional

FROM node:lts AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/package.json ./package.json

COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

COPY --from=builder /app/eula.md ./eula.md

CMD ["npm", "start"]
