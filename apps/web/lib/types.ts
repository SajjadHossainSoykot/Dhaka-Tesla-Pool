export type Role = "PASSENGER" | "DRIVER";
export type RideStatus =
  | "REQUESTED"
  | "MATCHED"
  | "DRIVER_ARRIVED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";

export type Session = {
  token: string;
  user: { id: string; name: string; email: string; role: Role };
};

export type Zone = { id: string; label: string };

export type PassengerRide = {
  id: string;
  pickupZone: string;
  destinationZone: string;
  seats: number;
  status: RideStatus;
  paymentMethod: "CASH" | "TESLAPAY";
  soloFarePoysha: number;
  farePoysha: number;
  isPooled: boolean;
  sharedWithCount: number;
  poolId: string | null;
  vehicle: { name: string; driverName: string } | null;
  history: Array<{
    fromStatus: RideStatus | null;
    toStatus: RideStatus;
    note: string | null;
    createdAt: string;
  }>;
  createdAt: string;
};

export type DriverPool = {
  id: string;
  status: RideStatus;
  pickupZone: string;
  routeCorridor: string;
  capacity: number;
  reservedSeats: number;
  availableSeats: number;
  createdAt: string;
  members: Array<{
    rideId: string;
    passenger: { id: string; name: string };
    pickupZone: string;
    destinationZone: string;
    seats: number;
    farePoysha: number;
    paymentMethod: string;
    status: RideStatus;
  }>;
};
