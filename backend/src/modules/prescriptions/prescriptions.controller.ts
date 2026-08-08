import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as service from "./prescriptions.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.createPrescription(req.user!, req.body), 201);
});

export const listForPatient = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.listPrescriptionsForPatient(req.user!, req.params.patientId));
});
