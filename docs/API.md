# API Overview

Base URL locally: `http://localhost:4000/api`

All authenticated endpoints use `Authorization: Bearer <token>`.

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register passenger |
| POST | `/auth/login` | Public | Sign in passenger/driver |
| GET | `/auth/me` | Auth | Current user |
| GET | `/meta/zones` | Public | Predefined Dhaka zones |
| GET | `/meta/fare-estimate` | Public | Hand-checkable fare estimate |
| POST | `/rides` | Passenger | Request ride and enter compatible pool |
| GET | `/rides/mine` | Passenger | Own ride history only |
| GET | `/rides/:rideId` | Passenger | Own ride details only |
| POST | `/rides/:rideId/cancel` | Passenger | Cancel before STARTED |
| GET | `/driver/vehicle` | Driver | Bullet state/capacity |
| PATCH | `/driver/vehicle/online` | Driver | Go online/offline |
| GET | `/driver/pools` | Driver | Candidate, active, and finished pools |
| POST | `/driver/pools/:poolId/transition` | Driver | ACCEPT / ARRIVE / START / COMPLETE |

## Error shape

```json
{
  "error": {
    "code": "CANCELLATION_NOT_ALLOWED",
    "message": "Ride cannot be cancelled from STARTED"
  }
}
```

## Fare example

Nusrat: Banani -> Mohakhali, 3 km.

- Base: Tk 50
- Distance: 3 × Tk 20 = Tk 60
- Solo subtotal: Tk 110
- Pooled discount: 20% = Tk 22
- Pooled fare: **Tk 88**

Rafiq: Banani -> Gulshan 1, 2 km.

- Solo: Tk 50 + (2 × Tk 20) = Tk 90
- Pooled fare: **Tk 72**

All stored values use integer poysha, so Tk 88 is `8800`.
