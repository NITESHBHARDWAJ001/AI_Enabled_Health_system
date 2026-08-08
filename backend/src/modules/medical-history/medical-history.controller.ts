import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as service from "./medical-history.service";

export const timeline = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.getPatientTimeline(req.user!, req.params.patientId));
});

export const summary = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.getPatientSummary(req.user!, req.params.patientId));
});
