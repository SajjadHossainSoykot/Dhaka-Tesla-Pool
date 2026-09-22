import { describe, expect, it } from "vitest";
import { canPassengerCancel, canTransition } from "../../src/domain/lifecycle.js";

describe("ride lifecycle", () => {
  it("accepts the happy-path lifecycle", () => {
    expect(canTransition("REQUESTED", "MATCHED")).toBe(true);
    expect(canTransition("MATCHED", "DRIVER_ARRIVED")).toBe(true);
    expect(canTransition("DRIVER_ARRIVED", "STARTED")).toBe(true);
    expect(canTransition("STARTED", "COMPLETED")).toBe(true);
  });

  it("rejects skipping states and cancelling after start", () => {
    expect(canTransition("REQUESTED", "STARTED")).toBe(false);
    expect(canTransition("STARTED", "CANCELLED")).toBe(false);
    expect(canPassengerCancel("STARTED")).toBe(false);
  });
});
