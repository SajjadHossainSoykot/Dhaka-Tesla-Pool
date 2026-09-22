FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json prisma7.config.ts ./
COPY prisma ./prisma
COPY src ./src
COPY tests ./tests
RUN DATABASE_URL=postgresql://postgres:postgres@localhost:5432/build_only npm run db:generate && npm run build
EXPOSE 4000
CMD ["sh", "-c", "npm run db:deploy && npm run db:seed && npm run start"]
