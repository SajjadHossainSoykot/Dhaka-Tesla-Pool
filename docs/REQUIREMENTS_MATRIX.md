# PRD Traceability Matrix

| Requirement | Implementation / evidence |
|---|---|
| Passenger sign up/in | `apps/api/src/routes/auth.routes.ts`, `apps/web/app/login/page.tsx` |
| Request pickup/destination/seats | `POST /api/rides`, passenger dashboard |
| Estimated fare | `src/domain/fare.ts`, `/api/meta/fare-estimate` |
| Passenger lifecycle/status/history | `RideRequest`, `RideStatusHistory`, passenger dashboard |
| Valid cancellation | `cancelPassengerRide`, integration test |
| Driver sign in + online/offline | driver routes/service/dashboard |
| Vehicle fixed capacity | `Vehicle.capacity`, `Pool.capacitySnapshot` |
| Driver sees assigned passengers/seats | `/api/driver/pools` |
| Accept/arrive/start/complete | driver transition endpoint + lifecycle guard |
| Multiple requests share Tesla | `assignRequestToPool`, `PoolMember` |
| Capacity never exceeded | conditional atomic `reservedSeats` update + DB CHECK + concurrency test |
| Individual passenger fare | `PoolMember.farePoysha`, `RideRequest.finalFarePoysha` |
| Clear pool membership | explicit `PoolMember` join model |
| Simplified geography | predefined zones/corridors + deterministic distance table |
| Hand-testable fare | Tk 50 + Tk 20/km - 20% pool discount; integer poysha |
| React/Next frontend | Next.js 16 App Router |
| Node backend | Express 5 + TypeScript |
| Relational database | PostgreSQL + Prisma 7 |
| Auth/validation/error handling | JWT role middleware, Zod, structured errors |
| Schema relationships/constraints/indexes | Prisma schema + checked-in SQL migration |
| Docker Compose | `docker-compose.yml`, API/Web Dockerfiles, health checks |
| `.env.example` / no secrets | root `.env.example`, `.gitignore`, secret scan script |
| Migrations + story seed | Prisma migration + Jashim/Nusrat/Rafiq/Shirin/Bullet seed |
| Architecture diagram | `docs/ARCHITECTURE.md` |
| ERD | `docs/ERD.md` |
| Technology justifications | `docs/DECISIONS.md`, README stack table |
| Meaningful tests | unit + integration suites including race condition |
| Git workflow | master + feature branches + pre-release + release/v1.0.0 |
| Conventional commit format | actual repository history |
| AI usage disclosure | README AI Usage section |
| 6-minute video plan | `docs/VIDEO_SCRIPT.md` |
| Scale-to-1M bonus | `docs/SCALING.md` |
| Deployment plan | `docs/DEPLOYMENT.md`, `render.yaml` |
