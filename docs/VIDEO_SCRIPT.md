# Six-Minute Walkthrough Script

Keep the final video **under 6:00**. Do not read the README; explain what you understand.

## 0:00-1:00 — Problem, users, core idea

**Screen:** README top / live landing page.

- “This is Dhaka Tesla Pool, a ride-pooling MVP built around three actors: passengers, a driver with a fixed-capacity vehicle, and the pool itself.”
- “The key problem is not maps. It is safely deciding who can share Bullet’s three seats, giving each passenger their own fare/status, and preserving a clear lifecycle and history.”
- Introduce Nusrat (Banani -> Mohakhali), Rafiq (Banani -> Gulshan 1), Shirin (edge case), and Jashim/Bullet.

## 1:00-3:00 — Engineering

**Screen:** `docs/ARCHITECTURE.md`, then `docs/ERD.md`.

- Browser -> Next.js -> Express API -> PostgreSQL.
- “The frontend never owns fare, capacity, authorization, or state-transition rules.”
- Explain User, Vehicle, RideRequest, Pool, PoolMember, and status-history tables.
- Explain lifecycle: REQUESTED -> MATCHED -> DRIVER_ARRIVED -> STARTED -> COMPLETED; cancellation before start.
- Explain static-zone matching and why no map API.
- Explain fare in poysha: base Tk 50 + Tk 20/km, 20% pool discount.
- **Key decision:** atomic `reservedSeats` update + DB check constraint so two concurrent users cannot both claim the last seat.
- **Trade-off:** static zones/distance table are deterministic and testable but not real routing; production would move to geospatial/ETA matching.

## 3:00-6:00 — Product tour

**Screen:** Live app, preferably separate browser profiles/windows.

### Passenger
- Nusrat signs in and requests Banani -> Mohakhali. Point out solo estimate Tk 110.
- Rafiq signs in and requests Banani -> Gulshan 1.
- Refresh Nusrat: her fare becomes Tk 88; Rafiq sees Tk 72. Neither sees the other passenger’s private fare/status.

### Driver
- Jashim signs in. Show Bullet is online, 2/3 seats reserved, and both assigned passengers.
- ACCEPT -> ARRIVE -> START. Flip to passenger once to show status synchronization.

### Edge case
Pick one:
- Try to cancel after STARTED and show the API/UI rejection; or
- Run the concurrency test and explain only one of Rafiq/Shirin can claim the final seat.

### Finish
- COMPLETE the pool and show ride history.
- Show the deployed URL and briefly mention Docker: `docker compose up` runs web + API + Postgres locally.
