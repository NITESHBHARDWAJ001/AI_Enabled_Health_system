import { Request, Response } from "express";
import { AppointmentStatus } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as service from "./appointments.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.createAppointment(req.user!, req.body), 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as AppointmentStatus | undefined;
  sendSuccess(res, await service.listAppointments(req.user!, status));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.getAppointmentById(req.user!, req.params.id));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.updateAppointmentStatus(req.user!, req.params.id, req.body.status));
});
