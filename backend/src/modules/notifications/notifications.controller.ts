import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as service from "./notifications.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await service.listNotifications(req.user!.id));
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await service.markRead(req.user!.id, req.params.id);
  sendSuccess(res, { ok: true });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await service.markAllRead(req.user!.id);
  sendSuccess(res, { ok: true });
});
