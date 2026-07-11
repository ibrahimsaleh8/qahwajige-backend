import express, { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

export const socialMediaLinksRouter = express.Router();

// -------------------------
// Social Media Links Routes
// -------------------------

/**
 * POST /api/dashboard/:id/social-media-links
 * Create social media links for a project.
 * All fields (instagram, facebook, tiktok, twitter, youtube) are optional.
 */
socialMediaLinksRouter.post(
  "/api/dashboard/:id/social-media-links",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body || {};

      const { instagram, facebook, tiktok, twitter, youtube } = body;

      // Ensure the project exists
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check if social media links already exist for this project
      const existing = await prisma.socialMediaLinks.findUnique({
        where: { projectId: id },
      });

      if (existing) {
        return res.status(409).json({
          error: "Social media links already exist for this project",
          message:
            "Use PUT /api/dashboard/:id/social-media-links to update them",
        });
      }

      const socialMediaLinks = await prisma.socialMediaLinks.create({
        data: {
          projectId: id,
          instagram: instagram ?? null,
          facebook: facebook ?? null,
          tiktok: tiktok ?? null,
          twitter: twitter ?? null,
          youtube: youtube ?? null,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Social media links created successfully",
        data: socialMediaLinks,
      });
    } catch (error) {
      console.error("Error creating social media links:", error);
      return res.status(500).json({
        error: "Failed to create social media links",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * PUT /api/dashboard/:id/social-media-links
 * Update (upsert) social media links for a project.
 * All fields are optional – only provided fields will be updated.
 */
socialMediaLinksRouter.put(
  "/api/dashboard/:id/social-media-links",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body || {};

      const { instagram, facebook, tiktok, twitter, youtube } = body;

      // Ensure the project exists
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const socialMediaLinks = await prisma.socialMediaLinks.upsert({
        where: { projectId: id },
        update: {
          ...(instagram !== undefined && { instagram }),
          ...(facebook !== undefined && { facebook }),
          ...(tiktok !== undefined && { tiktok }),
          ...(twitter !== undefined && { twitter }),
          ...(youtube !== undefined && { youtube }),
        },
        create: {
          projectId: id,
          instagram: instagram ?? null,
          facebook: facebook ?? null,
          tiktok: tiktok ?? null,
          twitter: twitter ?? null,
          youtube: youtube ?? null,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Social media links updated successfully",
        data: socialMediaLinks,
      });
    } catch (error) {
      console.error("Error updating social media links:", error);
      return res.status(500).json({
        error: "Failed to update social media links",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * GET /api/project/:id/social-media-links
 * Public route – fetch social media links for a project.
 */
socialMediaLinksRouter.get(
  "/api/project/:id/social-media-links",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      const socialMediaLinks = await prisma.socialMediaLinks.findUnique({
        where: { projectId: id },
        select: {
          instagram: true,
          facebook: true,
          tiktok: true,
          twitter: true,
          youtube: true,
        },
      });

      if (!socialMediaLinks) {
        return res.status(404).json({
          error: "Social media links not found for this project",
        });
      }

      return res.status(200).json({
        success: true,
        data: socialMediaLinks,
      });
    } catch (error) {
      console.error("Error fetching social media links:", error);
      return res.status(500).json({
        error: "Failed to fetch social media links",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);
