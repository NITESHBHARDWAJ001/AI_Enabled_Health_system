import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as service from "./patients.service";
import { Role } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listPatients(req.query.search as string | undefined);
  sendSuccess(res, result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  service.assertPatientAccess(req.user!, req.params.id);
  const result = await service.getPatientById(req.params.id);
  sendSuccess(res, result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  service.assertPatientAccess(req.user!, req.params.id);
  const result = await service.updatePatient(req.params.id, req.body);
  sendSuccess(res, result);
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  service.assertPatientAccess(req.user!, req.params.id);
  const result = await service.updateLocation(req.params.id, req.body.latitude, req.body.longitude);
  sendSuccess(res, result);
});

export const addVital = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role === Role.PATIENT) throw ApiError.forbidden("Only clinical staff can record vitals");
  const result = await service.addVital(req.params.id, req.body);
  sendSuccess(res, result, 201);
});

export const listVitals = asyncHandler(async (req: Request, res: Response) => {
  service.assertPatientAccess(req.user!, req.params.id);
  const result = await service.listVitals(req.params.id);
  sendSuccess(res, result);
});

export const addCondition = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role === Role.PATIENT) throw ApiError.forbidden("Only clinical staff can record conditions");
  const result = await service.addCondition(req.params.id, req.body);
  sendSuccess(res, result, 201);
});

export const listConditions = asyncHandler(async (req: Request, res: Response) => {
  service.assertPatientAccess(req.user!, req.params.id);
  const result = await service.listConditions(req.params.id);
  sendSuccess(res, result);
});
