import { distanceKm, type Zone } from "./zones.js";

export const BASE_FARE_POYSHA = 5_000; // Tk 50
export const PER_KM_POYSHA = 2_000; // Tk 20 / km
export const POOL_DISCOUNT_BPS = 2_000; // 20%
const BPS_DENOMINATOR = 10_000;

export type FareBreakdown = {
  distanceKm: number;
  seats: number;
  baseFarePoysha: number;
  distanceChargePoysha: number;
  subtotalPoysha: number;
  poolDiscountPoysha: number;
  totalPoysha: number;
};

export function calculateFare(input: {
  pickupZone: Zone;
  destinationZone: Zone;
  seats: number;
  pooled: boolean;
}): FareBreakdown {
  const km = distanceKm(input.pickupZone, input.destinationZone);
  const perSeatSubtotal = BASE_FARE_POYSHA + km * PER_KM_POYSHA;
  const subtotalPoysha = perSeatSubtotal * input.seats;
  const poolDiscountPoysha = input.pooled
    ? Math.round((subtotalPoysha * POOL_DISCOUNT_BPS) / BPS_DENOMINATOR)
    : 0;

  return {
    distanceKm: km,
    seats: input.seats,
    baseFarePoysha: BASE_FARE_POYSHA * input.seats,
    distanceChargePoysha: km * PER_KM_POYSHA * input.seats,
    subtotalPoysha,
    poolDiscountPoysha,
    totalPoysha: subtotalPoysha - poolDiscountPoysha,
  };
}

export function formatTaka(poysha: number): string {
  return `৳${(poysha / 100).toFixed(2)}`;
}
