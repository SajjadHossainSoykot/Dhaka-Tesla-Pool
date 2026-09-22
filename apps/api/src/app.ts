import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import rideRoutes from "./routes/rides.routes.js";
import { errorHandler, notFound } from "./middleware/errors.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "100kb" }));

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", service: "dhaka-tesla-pool-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/rides", rideRoutes);
app.use(notFound);
app.use(errorHandler);
