# Free-tier Deployment Guide

Recommended internship-demo layout:

- **Frontend:** Vercel Hobby, root directory `apps/web`
- **API:** Render Free Web Service, root directory `apps/api` (or use the included `render.yaml`)
- **Database:** Neon Free Postgres

## 1. Create Neon Postgres

Create a free Neon project and copy:

- pooled/runtime connection -> `DATABASE_URL`
- direct connection -> `DIRECT_URL`

The API uses the pooled URL at runtime and the direct URL for Prisma migrations.

## 2. Deploy API to Render

Connect the public GitHub repository.

Settings if not using Blueprint:

```text
Root directory: apps/api
Build command: npm install && npm run db:generate && npm run build
Start command: npm run db:deploy && npm run db:seed && npm run start
Health check: /health
Plan: Free
```

Environment variables:

```text
NODE_ENV=production
DATABASE_URL=<Neon pooled URL>
DIRECT_URL=<Neon direct URL>
JWT_SECRET=<long random value>
CORS_ORIGIN=<final Vercel URL>
```

Render free web services can spin down when idle. For the evaluation video, open the API/website once before recording so the cold start is not mistaken for a broken flow.

## 3. Deploy frontend to Vercel

Import the same repository and set:

```text
Root directory: apps/web
NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com/api
```

Deploy, then return to Render and set `CORS_ORIGIN` to the exact Vercel production origin. Redeploy/restart the API if needed.

## 4. Smoke test

1. Open `/health` on the API; expect `{ "status": "ok" ... }`.
2. Open the web app and login as Nusrat.
3. Request Banani -> Mohakhali.
4. Login as Rafiq in another browser profile and request Banani -> Gulshan 1.
5. Confirm both display pooled fares.
6. Login as Jashim and complete ACCEPT -> ARRIVE -> START -> COMPLETE.
7. Confirm passenger history shows COMPLETED.
