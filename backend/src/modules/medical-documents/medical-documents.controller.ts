import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import * as service from "./medical-documents.service";

export const upload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");
  const result = await service.uploadDocument(req.user!, req.body, req.file);
  sendSuccess(res, result, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.listDocuments(req.user!, req.params.patientId));
});
