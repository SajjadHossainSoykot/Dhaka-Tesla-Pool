import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/auth.js";
import { AppError } from "../lib/errors.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
  }

  const token = authorization.slice("Bearer ".length);
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    throw new AppError(401, "Invalid or expired access token", "INVALID_TOKEN");
  }
}

export function requireRole(role: "PASSENGER" | "DRIVER") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
    }
    if (req.auth.role !== role) {
      throw new AppError(403, `${role} role required`, "FORBIDDEN");
    }
    next();
  };
}
