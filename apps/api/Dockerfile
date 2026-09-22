FROM node:22-alpine
WORKDIR /app

COPY package*.json ./

# node:22-alpine currently ships npm 10.9.8, which can crash
# during dependency resolution with an Arborist "edgesOut" error.
RUN npm install -g npm@11.19.1 --no-audit --no-fund \
    && npm install --no-audit --no-fund

COPY tsconfig.json prisma7.config.ts ./
COPY prisma ./prisma
COPY src ./src
COPY tests ./tests

RUN DATABASE_URL=postgresql://postgres:postgres@localhost:5432/build_only npm run db:generate \
    && npm run build

EXPOSE 4000

CMD ["sh", "-c", "npm run db:deploy && npm run db:seed && npm run start"]
