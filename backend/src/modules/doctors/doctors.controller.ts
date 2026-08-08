import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as service from "./doctors.service";
import * as availabilityService from "./availability.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listDoctors({
    specialty: req.query.specialty as string | undefined,
    hospitalId: req.query.hospitalId as string | undefined,
    search: req.query.search as string | undefined,
  });
  sendSuccess(res, result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getDoctorById(req.params.id);
  sendSuccess(res, result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.createDoctor(req.user!, req.body);
  sendSuccess(res, result, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.updateDoctor(req.user!, req.params.id, req.body);
  sendSuccess(res, result);
});

export const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const result = await availabilityService.getWeeklyAvailability(req.params.id);
  sendSuccess(res, result);
});

export const setAvailability = asyncHandler(async (req: Request, res: Response) => {
  const result = await availabilityService.setWeeklyAvailability(req.user!, req.params.id, req.body.windows);
  sendSuccess(res, result);
});

export const getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
  const result = await availabilityService.getAvailableSlots(req.params.id, req.query.date as string);
  sendSuccess(res, result);
});
