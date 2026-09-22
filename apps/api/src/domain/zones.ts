export const ZONES = [
  "BANANI",
  "GULSHAN_1",
  "GULSHAN_2",
  "MOHAKHALI",
  "BASHUNDHARA",
  "FARMGATE",
  "DHANMONDI",
  "MIRPUR",
  "UTTARA",
] as const;

export type Zone = (typeof ZONES)[number];

export const ZONE_LABELS: Record<Zone, string> = {
  BANANI: "Banani",
  GULSHAN_1: "Gulshan 1",
  GULSHAN_2: "Gulshan 2",
  MOHAKHALI: "Mohakhali",
  BASHUNDHARA: "Bashundhara",
  FARMGATE: "Farmgate",
  DHANMONDI: "Dhanmondi",
  MIRPUR: "Mirpur",
  UTTARA: "Uttara",
};

const CORRIDORS: Record<Zone, string> = {
  BANANI: "NORTH_CENTRAL",
  GULSHAN_1: "NORTH_CENTRAL",
  GULSHAN_2: "NORTH_CENTRAL",
  MOHAKHALI: "NORTH_CENTRAL",
  BASHUNDHARA: "NORTH_CENTRAL",
  FARMGATE: "CENTRAL_WEST",
  DHANMONDI: "CENTRAL_WEST",
  MIRPUR: "NORTH_WEST",
  UTTARA: "NORTH_WEST",
};

const DISTANCES_KM: Record<string, number> = {
  "BANANI:MOHAKHALI": 3,
  "BANANI:GULSHAN_1": 2,
  "BANANI:GULSHAN_2": 3,
  "BANANI:BASHUNDHARA": 5,
  "BANANI:FARMGATE": 6,
  "BANANI:DHANMONDI": 8,
  "BANANI:MIRPUR": 10,
  "BANANI:UTTARA": 12,
  "GULSHAN_1:GULSHAN_2": 2,
  "GULSHAN_1:MOHAKHALI": 3,
  "GULSHAN_1:BASHUNDHARA": 4,
  "MOHAKHALI:FARMGATE": 4,
  "FARMGATE:DHANMONDI": 4,
  "FARMGATE:MIRPUR": 7,
  "DHANMONDI:MIRPUR": 8,
  "MIRPUR:UTTARA": 10,
  "BASHUNDHARA:UTTARA": 9,
};

export function routeCorridor(pickup: Zone, destination: Zone): string {
  return `${CORRIDORS[pickup]}->${CORRIDORS[destination]}`;
}

export function areRoutesCompatible(
  aPickup: Zone,
  aDestination: Zone,
  bPickup: Zone,
  bDestination: Zone,
): boolean {
  const pickupCompatible = aPickup === bPickup || CORRIDORS[aPickup] === CORRIDORS[bPickup];
  const destinationCompatible =
    aDestination === bDestination || CORRIDORS[aDestination] === CORRIDORS[bDestination];

  return pickupCompatible && destinationCompatible;
}

export function distanceKm(pickup: Zone, destination: Zone): number {
  if (pickup === destination) return 1;
  const forward = `${pickup}:${destination}`;
  const reverse = `${destination}:${pickup}`;
  return DISTANCES_KM[forward] ?? DISTANCES_KM[reverse] ?? 7;
}
