import { Router } from "express";
import { generateKeywords } from "./seo.controller";

// ---- SEO router (mounted at /api/v1/seo) ----
export const seoRouter = Router();

seoRouter.post("/keyword-generator", generateKeywords);
