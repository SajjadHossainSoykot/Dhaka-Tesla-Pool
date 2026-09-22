export const RIDE_STATUSES = [
  "REQUESTED",
  "MATCHED",
  "DRIVER_ARRIVED",
  "STARTED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type RideStatus = (typeof RIDE_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<RideStatus, readonly RideStatus[]> = {
  REQUESTED: ["MATCHED", "CANCELLED"],
  MATCHED: ["DRIVER_ARRIVED", "CANCELLED"],
  DRIVER_ARRIVED: ["STARTED", "CANCELLED"],
  STARTED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: RideStatus, to: RideStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: RideStatus, to: RideStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid ride transition: ${from} -> ${to}`);
  }
}

export function canPassengerCancel(status: RideStatus): boolean {
  return ["REQUESTED", "MATCHED", "DRIVER_ARRIVED"].includes(status);
}
