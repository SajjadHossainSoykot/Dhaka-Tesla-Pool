import { Router } from "express";
import { z } from "zod";
import { calculateFare } from "../domain/fare.js";
import { ZONES, ZONE_LABELS } from "../domain/zones.js";

const router = Router();

const FareSchema = z.object({
  pickupZone: z.enum(ZONES),
  destinationZone: z.enum(ZONES),
  seats: z.coerce.number().int().min(1).max(3).default(1),
  pooled: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default("false"),
});

router.get("/zones", (_req, res) => {
  res.json({ zones: ZONES.map((id) => ({ id, label: ZONE_LABELS[id] })) });
});

router.get("/fare-estimate", (req, res) => {
  const input = FareSchema.parse(req.query);
  res.json({ fare: calculateFare(input) });
});

export default router;
