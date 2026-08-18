import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { aiGenerateArticle, aiImproveArticle } from "./ai-articles.controller";

// ---- Admin router (mounted at /api/admin/articles) ----
export const adminArticlesRouter = Router();

adminArticlesRouter.use(authenticate);

// AI routes — registered BEFORE /:id to avoid route parameter shadowing
adminArticlesRouter.post("/ai-generate", aiGenerateArticle);
adminArticlesRouter.post("/:id/ai-improve", aiImproveArticle);
