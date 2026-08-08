import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as service from "./hospitals.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await service.listHospitals());
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.getHospitalById(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.createHospital(req.body), 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.updateHospital(req.params.id, req.body));
});

export const addDepartment = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.addDepartment(req.params.id, req.body.name), 201);
});

export const listInfectionAlerts = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.listInfectionAlerts(req.params.id));
});
