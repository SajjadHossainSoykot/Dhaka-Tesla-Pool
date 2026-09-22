import { Router } from "express";
import { z } from "zod";
import { ZONES } from "../domain/zones.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  cancelPassengerRide,
  createRideRequest,
  getPassengerRides,
  getRideForPassenger,
} from "../services/ride.service.js";

const router = Router();
router.use(requireAuth, requireRole("PASSENGER"));

const RideRequestSchema = z.object({
  pickupZone: z.enum(ZONES),
  destinationZone: z.enum(ZONES),
  seats: z.number().int().min(1).max(3),
  paymentMethod: z.enum(["CASH", "TESLAPAY"]).default("CASH"),
});

router.post("/", async (req, res) => {
  const input = RideRequestSchema.parse(req.body);
  const ride = await createRideRequest({ passengerId: req.auth!.sub, ...input });
  res.status(201).json({ ride });
});

router.get("/mine", async (req, res) => {
  res.json({ rides: await getPassengerRides(req.auth!.sub) });
});

router.get("/:rideId", async (req, res) => {
  res.json({ ride: await getRideForPassenger(req.auth!.sub, req.params.rideId) });
});

router.post("/:rideId/cancel", async (req, res) => {
  res.json({ ride: await cancelPassengerRide(req.auth!.sub, req.params.rideId) });
});

export default router;
