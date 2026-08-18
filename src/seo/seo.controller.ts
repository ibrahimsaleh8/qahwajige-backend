import { Request, Response } from "express";
import { asyncHandler } from "../articles/ai-articles.controller";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { openai } from "../config/openai";
import dotenv from "dotenv";

dotenv.config();

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

function sendSuccess<T>(
  res: Response,
  data: T,
  message = "OK",
  status = 200,
): Response {
  return res.status(status).json({ success: true, message, data });
}

/* ============================================================
   POST /api/v1/seo/keyword-generator
   Body: { projectId: string }

   Generates SEO keywords for a specific project based on:
     - SiteSettings: siteTitle, siteDescription, siteKeywords
     - HeroSection: headline
     - Last 10 published article titles for that project
============================================================ */
export const generateKeywords = asyncHandler(
  async (req: Request, res: Response) => {
    // ── 0. Validate input ───────────────────────────────────
    const { projectId } = req.body as { projectId?: string };

    if (!projectId || typeof projectId !== "string") {
      throw new AppError("projectId is required.", 400);
    }

    // ── 1. Resolve project (look up by projectId slug → internal id) ─
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new AppError("Project not found.", 404);
    }

    const internalId = project.id;

    // ── 2. Fetch site settings for the project ──────────────
    const settings = await prisma.siteSettings.findUnique({
      where: { projectId: internalId },
      select: {
        siteTitle: true,
        siteDescription: true,
        siteKeywords: true,
      },
    });

    // ── 3. Fetch hero section for the project ───────────────
    const hero = await prisma.heroSection.findUnique({
      where: { projectId: internalId },
      select: { headline: true },
    });

    // ── 4. Fetch the latest 10 published article titles ─────
    const articles = await prisma.article.findMany({
      where: { projectId: internalId, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { title: true },
    });

    const articleTitles = articles.map((a) => a.title);

    // ── 5. Build prompt context ─────────────────────────────
    const siteContext = [
      settings?.siteTitle ? `Site Title: ${settings.siteTitle}` : null,
      settings?.siteDescription
        ? `Site Description: ${settings.siteDescription}`
        : null,
      settings?.siteKeywords && settings.siteKeywords.length > 0
        ? `Existing Site Keywords: ${settings.siteKeywords.join(", ")}`
        : null,
      hero?.headline ? `Hero Headline: ${hero.headline}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const articlesContext =
      articleTitles.length > 0
        ? `Latest Article Titles:\n${articleTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
        : "No articles available yet.";

    const userPrompt =
      `Website Information:\n${siteContext}\n\n` + articlesContext;

    // ── 6. Call OpenAI with Structured Outputs ──────────────
    const response = await openai.responses.parse({
      model: process.env.OPENAI_MODEL as string,
      input: [
        {
          role: "system",
          content:
            "You are an expert Arabic SEO specialist focusing on the Saudi Arabian market. " +
            "Your task is to generate a comprehensive list of highly relevant SEO keywords " +
            "for a website, targeting Arabic-speaking users in Saudi Arabia.\n\n" +
            "Given the website's site title, site description, existing keywords, hero headline, " +
            "and latest article titles, you must:\n" +
            "1. Generate a comprehensive, diverse list of SEO keywords in Arabic.\n" +
            "2. Include all of the following keyword types:\n" +
            "   - Primary keywords: high-volume, core topic keywords\n" +
            "   - Secondary keywords: related but slightly less competitive terms\n" +
            "   - Long-tail keywords: specific multi-word phrases that reflect real user searches\n" +
            "   - Semantic/related keywords: synonyms, related concepts, and contextually relevant terms\n" +
            "3. Target keywords for Arabic-speaking users specifically in Saudi Arabia — " +
            "include city names (e.g., الرياض, جدة, الدمام, مكة) and Saudi-specific phrases where genuinely relevant.\n" +
            "4. Remove all duplicates and irrelevant keywords.\n" +
            "5. Do NOT generate search volumes, difficulty scores, keyword clusters, " +
            "article mappings, or strategic recommendations.\n" +
            "6. Return ONLY the keywords array — nothing else.\n" +
            "7. All keywords must be in Arabic.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "seo_keywords",
          schema: {
            type: "object",
            properties: {
              keywords: {
                type: "array",
                items: { type: "string" },
                description:
                  "A comprehensive list of Arabic SEO keywords for the website, " +
                  "including primary, secondary, long-tail, and semantic/related keywords. " +
                  "All keywords must be in Arabic. No duplicates.",
              },
            },
            required: ["keywords"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    // ── 7. Parse response ───────────────────────────────────
    const parsed = response.output_parsed as unknown as {
      keywords: string[];
    };

    if (!parsed || !Array.isArray(parsed.keywords)) {
      throw new AppError("OpenAI returned an unexpected response.", 502);
    }

    // ── 8. Deduplicate ──────────────────────────────────────
    const uniqueKeywords = [...new Set(parsed.keywords)];

    return sendSuccess(
      res,
      { keywords: uniqueKeywords },
      "SEO keywords generated successfully.",
    );
  },
);
