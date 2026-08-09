import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import * as service from "./transcription.service";

export const transcribe = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as { audio?: Express.Multer.File[]; document?: Express.Multer.File[] } | undefined;
  const audioFile = files?.audio?.[0];
  const documentFile = files?.document?.[0];

  if (!audioFile && !documentFile) {
    throw ApiError.badRequest("Provide at least one of 'audio' or 'document' files");
  }

  const result = await service.transcribe({
    audio: audioFile,
    document: documentFile,
    language: req.body.language,
    ocrLang: req.body.ocrLang,
  });

  sendSuccess(res, result, 201);
});
