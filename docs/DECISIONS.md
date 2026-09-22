# Architecture Decision Log

## ADR-001: REST over GraphQL

**Pick:** REST endpoints grouped by auth, passenger rides, driver pools, and metadata.

**Alternatives:** GraphQL, tRPC.

**Why it fits:** The MVP has a small command/resource surface and strong role boundaries. REST keeps the network contract obvious in Postman, Supertest, the browser dev tools, and the interview.

**Switch later when:** Several clients need substantially different projections or the API becomes dominated by flexible graph-shaped reads.

## ADR-002: PostgreSQL over MongoDB or SQLite

**Pick:** PostgreSQL.

**Why it fits:** Pool membership, capacity, state history, and authorization are relational. Transactions, row updates, constraints, and indexes matter more than schema flexibility.

**Alternatives:** SQLite would be excellent for a local-only prototype but weaker as the deployed concurrency target. MongoDB could work, but the relationships and cross-document invariants add complexity here.

**Switch later when:** There is a concrete workload that the relational model cannot serve economically; not merely because another datastore is popular.

## ADR-003: Prisma ORM 7

**Pick:** Prisma 7 with PostgreSQL driver adapter.

**Why it fits:** Type-safe queries, explicit schema, migrations, and fast iteration for a small team.

**Alternatives:** Drizzle, raw `pg`, Kysely.

**Switch later when:** Critical hot paths need SQL features or tuning that become awkward through the ORM. Raw SQL remains available for targeted operations.

## ADR-004: Static zones and distance matrix

**Pick:** predefined Dhaka zones and a small deterministic distance table.

**Why it fits:** The challenge is about engineering judgment and pool integrity, not map routing. The fare can be verified by hand.

**Switch later when:** Product requirements need real ETA, geocoding, turn-by-turn routing, or geospatial matching.

## ADR-005: Money as integer poysha

**Pick:** all monetary values are integer poysha.

**Why it fits:** Avoids floating-point money errors and makes equality assertions reliable. `11000` means Tk 110.00.

**Switch later when:** Never switch to binary floating point; for multi-currency or accounting requirements, use currency + integer minor units or a decimal type.

## ADR-006: Capacity with atomic reserved-seat counter

**Pick:** `Pool.reservedSeats` plus a conditional atomic update and a database check constraint.

**Why it fits:** It directly solves the final-seat race without distributed locks or infrastructure beyond PostgreSQL.

**Alternatives:** `SELECT ... FOR UPDATE`, serializable transactions with retries, advisory locks.

**Switch later when:** Matching spans shards/regions or reservations need expirations, at which point an idempotent reservation workflow and stronger coordination strategy may be needed.

## ADR-007: Short-lived JWT bearer token for the internship demo

**Pick:** 2-hour signed JWT returned after login; the web client keeps it in `sessionStorage`, not persistent storage.

**Why it fits:** It keeps the API independently testable and makes role authorization explicit without introducing a session store.

**Trade-off:** Browser-accessible token storage is still exposed to XSS. For a production consumer app, use secure HTTP-only cookies, refresh-token rotation, CSRF protection where applicable, device/session revocation, and stronger account security.

## ADR-008: One active ride per passenger

**Pick:** a passenger may have only one ride in REQUESTED/MATCHED/DRIVER_ARRIVED/STARTED at a time.

**Why it fits:** It prevents accidental duplicate bookings and keeps the demo lifecycle easy to reason about.

**Switch later when:** The product explicitly supports scheduled/future rides; then enforce one active immediate ride while allowing separately scheduled requests.

## ADR-009: Queue candidate pools, but allow one accepted/in-progress pool per vehicle

**Pick:** Bullet may accumulate several REQUESTED candidate pools, but Jashim can have only one MATCHED/DRIVER_ARRIVED/STARTED pool at a time.

**Why it fits:** Incompatible passenger requests can still queue while the vehicle is online, without pretending one vehicle can simultaneously serve two active trips.

**Switch later when:** A fleet/matching service assigns requests across many drivers and rebalances queued work dynamically.
