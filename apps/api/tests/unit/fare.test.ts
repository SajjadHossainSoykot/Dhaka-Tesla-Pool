import { describe, expect, it } from "vitest";
import { calculateFare } from "../../src/domain/fare.js";

describe("fare model", () => {
  it("calculates Nusrat's Banani -> Mohakhali solo and pooled fare", () => {
    const solo = calculateFare({
      pickupZone: "BANANI",
      destinationZone: "MOHAKHALI",
      seats: 1,
      pooled: false,
    });
    const pooled = calculateFare({
      pickupZone: "BANANI",
      destinationZone: "MOHAKHALI",
      seats: 1,
      pooled: true,
    });

    expect(solo.totalPoysha).toBe(11_000); // Tk 110
    expect(pooled.totalPoysha).toBe(8_800); // Tk 88
  });

  it("calculates Rafiq's Banani -> Gulshan 1 pooled fare", () => {
    const pooled = calculateFare({
      pickupZone: "BANANI",
      destinationZone: "GULSHAN_1",
      seats: 1,
      pooled: true,
    });

    expect(pooled.totalPoysha).toBe(7_200); // Tk 72
  });
});
