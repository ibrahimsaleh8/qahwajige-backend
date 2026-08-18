import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { openai } from "../config/openai";
import dotenv from "dotenv";

dotenv.config();

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

// ---- Helpers ---------------------------------------------------------------

export interface AuthRequest extends Request {
  admin?: { id: string; email: string };
}

/** Wraps an async route handler and forwards errors to Express. */
export function asyncHandler(
  fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };
}

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

// ---- Controllers -----------------------------------------------------------

/* ============================================================
   POST /api/admin/articles/ai-generate  — AI-generate article
============================================================ */
export const aiGenerateArticle = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { title, description, categoryId } = req.body;

    if (!title) throw new AppError("title is required.", 400);
    if (!categoryId) throw new AppError("categoryId is required.", 400);
    if (description !== undefined && typeof description !== "string") {
      throw new AppError("description must be a string.", 400);
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new AppError("Category not found.", 404);

    const userPromptContent =
      `Raw title: "${title}"\n` +
      (description && description.trim()
        ? `Description / Additional Context: "${description.trim()}"\n`
        : "") +
      `Category: "${category.name}"`;

    // --- Structured output schema ---
    const response = await openai.responses.parse({
      model: process.env.OPENAI_MODEL as string,
      input: [
        {
          role: "system",
          content:
            "You are an expert Arabic SEO content writer specialising in Saudi local SEO, with a strong focus on Riyadh and the broader Saudi market. " +
            "Given a raw article title and a category, you must:\n" +
            "1. Detect the search intent (informational, commercial, or transactional) and write the article to match that intent.\n" +
            "2. Improve the title for SEO — write it in Arabic (Modern Standard Arabic), keep it natural, compelling, and locally relevant.\n" +
            "3. Write a comprehensive, high-quality SEO article fully in Arabic (Modern Standard Arabic), as valid semantic HTML (minimum 600 words). " +
            "Use only these tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <blockquote>. " +
            "Do NOT include <html>, <head>, <body>, or any wrapper/document tags. Do NOT use Markdown syntax. " +
            "The HTML must be clean, valid, and ready to be inserted directly into a Tiptap rich-text editor. " +
            "Mention Riyadh or Saudi Arabia only when it is naturally relevant to the topic — do not force or repeat local references unnecessarily.\n" +
            "4. Generate 5–10 relevant Arabic SEO keywords as an array of strings; include local keywords (e.g., city or neighbourhood names) only where they add genuine search value.\n" +
            "IMPORTANT: Do NOT invent prices, statistics, laws, regulations, specific locations, reviews, or business claims.\n" +
            "The article must be original, well-structured with proper HTML heading hierarchy, and match the given category topic. " +
            "All text output (title, content, keywords) must be in Arabic.",
        },
        {
          role: "user",
          content: userPromptContent,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "generated_article",
          schema: {
            type: "object",
            properties: {
              improvedTitle: {
                type: "string",
                description: "SEO-optimised article title in Arabic",
              },
              content: {
                type: "string",
                description:
                  "Full article body in Arabic as semantic HTML (using <h2>–<h3>, <p>, <ul>, <ol>, <li>, <strong>, <blockquote> only — no Markdown, no wrapper tags)",
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "5–10 Arabic SEO keywords",
              },
            },
            required: ["improvedTitle", "content", "keywords"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    const parsed = response.output_parsed as unknown as {
      improvedTitle: string;
      content: string;
      keywords: string[];
    };

    if (!parsed)
      throw new AppError("OpenAI returned an unexpected response.", 502);

    const article = await prisma.article.create({
      data: {
        title: parsed.improvedTitle,
        description:
          description && description.trim() ? description.trim() : null,
        content: parsed.content,
        keywords: parsed.keywords,
        status: "DRAFT",
        categoryId,
        projectId: category.projectId,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    return sendSuccess(
      res,
      article,
      "Article generated and saved as draft.",
      201,
    );
  },
);

/* ============================================================
   POST /api/admin/articles/:id/ai-improve  — AI-improve article
============================================================ */
export const aiImproveArticle = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    const article = await prisma.article.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    if (!article) throw new AppError("Article not found.", 404);

    // --- Structured output schema ---
    const response = await openai.responses.parse({
      model: process.env.OPENAI_MODEL as string,
      input: [
        {
          role: "system",
          content:
            "You are an expert Arabic SEO editor specialising in Saudi local SEO, with a strong focus on Riyadh and the broader Saudi market. " +
            "Given an article's title and existing content, you must:\n" +
            "1. Identify the search intent (informational, commercial, or transactional) from the title and content, then strengthen the article to better satisfy that intent.\n" +
            "2. Improve the content for SEO, readability, structure, and overall usefulness — keeping all text in Arabic (Modern Standard Arabic).\n" +
            "3. Output the improved content as valid semantic HTML using only these tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <blockquote>. " +
            "Do NOT include <html>, <head>, <body>, or any wrapper/document tags. Do NOT use Markdown syntax. " +
            "The HTML must be clean, valid, and ready to be inserted directly into a Tiptap rich-text editor.\n" +
            "4. Mention Riyadh or Saudi Arabia only when naturally relevant to the topic — do not repeat local references unnecessarily or stuff keywords.\n" +
            "5. Preserve the article's original topic and intent. Do NOT translate or change the language.\n" +
            "6. Review the existing keywords; return 5–10 improved Arabic SEO keywords, adding local keywords (city/neighbourhood names) only where they add genuine search value.\n" +
            "IMPORTANT: Do NOT invent prices, statistics, laws, regulations, specific locations, reviews, or business claims.\n" +
            "Do NOT change the title. Return only the improved Arabic HTML content and keywords.",
        },
        {
          role: "user",
          content:
            `Title: "${article.title}"\n` +
            (article.description
              ? `Description / Additional Context: "${article.description}"\n\n`
              : "\n") +
            `Existing content:\n${article.content}\n\n` +
            `Current keywords: ${article.keywords.join(", ")}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "improved_article",
          schema: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description:
                  "Improved article content in Arabic as semantic HTML (using <h2>–<h3>, <p>, <ul>, <ol>, <li>, <strong>, <blockquote> only — no Markdown, no wrapper tags)",
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "Updated Arabic SEO keywords",
              },
            },
            required: ["content", "keywords"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    const parsed = response.output_parsed as unknown as {
      content: string;
      keywords: string[];
    };

    if (!parsed)
      throw new AppError("OpenAI returned an unexpected response.", 502);

    const updated = await prisma.article.update({
      where: { id },
      data: {
        content: parsed.content,
        keywords: parsed.keywords,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    return sendSuccess(res, updated, "Article content improved.");
  },
);
