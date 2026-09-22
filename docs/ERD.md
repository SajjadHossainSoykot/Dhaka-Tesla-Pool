# Database ERD

```mermaid
erDiagram
    User ||--o| Vehicle : drives
    User ||--o{ RideRequest : requests
    User ||--o{ PoolMember : joins
    Vehicle ||--o{ Pool : serves
    Pool ||--o{ PoolMember : contains
    RideRequest ||--o| PoolMember : assigned_to
    RideRequest ||--o{ RideStatusHistory : records
    Pool ||--o{ PoolStatusHistory : records
    User o|--o{ RideStatusHistory : acts
    User o|--o{ PoolStatusHistory : acts

    User {
      string id PK
      string name
      string email UK
      string passwordHash
      Role role
    }
    Vehicle {
      string id PK
      string driverId UK_FK
      string name
      string plateLabel UK
      int capacity
      boolean isOnline
    }
    RideRequest {
      string id PK
      string passengerId FK
      string pickupZone
      string destinationZone
      int seats
      RideStatus status
      int soloFarePoysha
      int finalFarePoysha
      PaymentMethod paymentMethod
    }
    Pool {
      string id PK
      string vehicleId FK
      RideStatus status
      string pickupZone
      string routeCorridor
      int capacitySnapshot
      int reservedSeats
    }
    PoolMember {
      string id PK
      string poolId FK
      string rideRequestId UK_FK
      string passengerId FK
      int seats
      int farePoysha
    }
```
