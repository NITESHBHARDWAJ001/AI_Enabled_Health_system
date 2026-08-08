import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as orchestrator from "../../services/ai/aiOrchestrator";

export const startConversation = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await orchestrator.startConversation(req.user!, req.body), 201);
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await orchestrator.sendMessage(req.user!, req.params.id, req.body.content));
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await orchestrator.getConversation(req.user!, req.params.id));
});

export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await orchestrator.listConversations(req.user!, req.params.patientId));
});

export const symptomAnalysis = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await orchestrator.runSymptomAnalysis(req.user!, req.body), 201);
});
