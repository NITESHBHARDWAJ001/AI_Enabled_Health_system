import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../config/database";

export interface AuthUser {
  id: string;
  role: Role;
  patientId?: string;
  doctorId?: string;
  hospitalAdminId?: string;
  hospitalId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Missing or invalid Authorization header");
    }
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { patient: true, doctor: true, hospitalAdmin: true },
    });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Account not found or inactive");
    }

    req.user = {
      id: user.id,
      role: user.role,
      patientId: user.patient?.id,
      doctorId: user.doctor?.id,
      hospitalAdminId: user.hospitalAdmin?.id,
      hospitalId: user.doctor?.hospitalId ?? user.hospitalAdmin?.hospitalId ?? undefined,
    };
    next();
  } catch (err) {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}
