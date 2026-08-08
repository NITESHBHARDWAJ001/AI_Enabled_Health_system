import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/database";
import { logger } from "../config/logger";

/**
 * Fires a fire-and-forget audit log entry after the response is sent.
 * Use on routes that touch sensitive patient data or perform state changes.
 */
export function audit(action: string, resource: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      if (res.statusCode >= 400) return;
      const resourceId = req.params.id ?? req.params.patientId ?? undefined;
      prisma.auditLog
        .create({
          data: {
            userId: req.user?.id,
            action,
            resource,
            resourceId,
            ipAddress: req.ip,
            metadata: { method: req.method, path: req.originalUrl },
          },
        })
        .catch((err) => logger.error({ err }, "Failed to write audit log"));
    });
    next();
  };
}
