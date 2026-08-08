import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as service from "./consultations.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.createConsultation(req.user!, req.body), 201);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.getConsultationById(req.user!, req.params.id));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.updateConsultation(req.user!, req.params.id, req.body));
});
