import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getDriverPools,
  getDriverVehicle,
  setDriverOnline,
  transitionDriverPool,
} from "../services/driver.service.js";

const router = Router();
router.use(requireAuth, requireRole("DRIVER"));

router.get("/vehicle", async (req, res) => {
  res.json({ vehicle: await getDriverVehicle(req.auth!.sub) });
});

router.patch("/vehicle/online", async (req, res) => {
  const input = z.object({ isOnline: z.boolean() }).parse(req.body);
  res.json({ vehicle: await setDriverOnline(req.auth!.sub, input.isOnline) });
});

router.get("/pools", async (req, res) => {
  res.json({ pools: await getDriverPools(req.auth!.sub) });
});

router.post("/pools/:poolId/transition", async (req, res) => {
  const input = z
    .object({ action: z.enum(["ACCEPT", "ARRIVE", "START", "COMPLETE"]) })
    .parse(req.body);
  res.json({ pool: await transitionDriverPool(req.auth!.sub, req.params.poolId, input.action) });
});

export default router;
