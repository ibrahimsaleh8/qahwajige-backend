import express, { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

export const customSectionRouter = express.Router();

// -------------------------
// Custom Section Routes
// -------------------------

/**
 * POST /api/dashboard/:id/custom-sections
 * Create a new custom section for a project.
 * Body: { title, description, cards?: [{ title, description, icon? }] }
 */
customSectionRouter.post(
  "/api/dashboard/:id/custom-sections",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body || {};

      const { title, description, cards } = body;

      if (!title || !description) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "title and description are required",
        });
      }

      // Ensure the project exists
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const section = await prisma.customSection.create({
        data: {
          projectId: id,
          title,
          description,
          cards:
            Array.isArray(cards) && cards.length > 0
              ? {
                  create: cards.map(
                    (card: {
                      title: string;
                      description: string;
                      icon?: string;
                    }) => ({
                      title: card.title,
                      description: card.description,
                      icon: card.icon ?? null,
                    }),
                  ),
                }
              : undefined,
        },
        include: { cards: true },
      });

      return res.status(201).json({
        success: true,
        message: "Custom section created successfully",
        data: section,
      });
    } catch (error) {
      console.error("Error creating custom section:", error);
      return res.status(500).json({
        error: "Failed to create custom section",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * PUT /api/dashboard/:id/custom-sections/:sectionId
 * Update the title and/or description of a custom section.
 * Body: { title?, description? }
 */
customSectionRouter.put(
  "/api/dashboard/:id/custom-sections/:sectionId",
  async (req: Request, res: Response) => {
    try {
      const { id, sectionId } = req.params as {
        id: string;
        sectionId: string;
      };
      const body = req.body || {};

      const { title, description } = body;

      if (!title && !description) {
        return res.status(400).json({
          error: "No fields to update",
          message: "Provide at least one of: title, description",
        });
      }

      // Ensure the section belongs to the project
      const existing = await prisma.customSection.findFirst({
        where: { id: sectionId, projectId: id },
      });

      if (!existing) {
        return res
          .status(404)
          .json({ error: "Custom section not found for this project" });
      }

      const updated = await prisma.customSection.update({
        where: { id: sectionId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
        },
        include: { cards: true },
      });

      return res.status(200).json({
        success: true,
        message: "Custom section updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating custom section:", error);
      return res.status(500).json({
        error: "Failed to update custom section",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * DELETE /api/dashboard/:id/custom-sections/:sectionId
 * Delete a custom section (and all its cards via cascade).
 */
customSectionRouter.delete(
  "/api/dashboard/:id/custom-sections/:sectionId",
  async (req: Request, res: Response) => {
    try {
      const { id, sectionId } = req.params as {
        id: string;
        sectionId: string;
      };

      // Ensure the section belongs to the project
      const existing = await prisma.customSection.findFirst({
        where: { id: sectionId, projectId: id },
      });

      if (!existing) {
        return res
          .status(404)
          .json({ error: "Custom section not found for this project" });
      }

      await prisma.customSection.delete({ where: { id: sectionId } });

      return res.status(200).json({
        success: true,
        message: "Custom section deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting custom section:", error);
      return res.status(500).json({
        error: "Failed to delete custom section",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * GET /api/project/:id/custom-sections
 * Public route – fetch all custom sections with their cards for a project.
 */
customSectionRouter.get(
  "/api/project/:id/custom-sections",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };

      const sections = await prisma.customSection.findMany({
        where: { projectId: id },
        include: { cards: true },
        orderBy: { createdAt: "asc" },
      });

      return res.status(200).json({
        success: true,
        data: sections,
      });
    } catch (error) {
      console.error("Error fetching custom sections:", error);
      return res.status(500).json({
        error: "Failed to fetch custom sections",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// -------------------------
// Custom Section Card Routes
// -------------------------

/**
 * POST /api/dashboard/:id/custom-sections/:sectionId/cards
 * Create a new card inside a custom section.
 * Body: { title, description, icon? }
 */
customSectionRouter.post(
  "/api/dashboard/:id/custom-sections/:sectionId/cards",
  async (req: Request, res: Response) => {
    try {
      const { id, sectionId } = req.params as {
        id: string;
        sectionId: string;
      };
      const body = req.body || {};

      const { title, description, icon } = body;

      if (!title || !description) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "title and description are required",
        });
      }

      // Ensure the section belongs to the project
      const section = await prisma.customSection.findFirst({
        where: { id: sectionId, projectId: id },
      });

      if (!section) {
        return res
          .status(404)
          .json({ error: "Custom section not found for this project" });
      }

      const card = await prisma.customSectionCard.create({
        data: {
          sectionId,
          title,
          description,
          icon: icon ?? null,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Card created successfully",
        data: card,
      });
    } catch (error) {
      console.error("Error creating card:", error);
      return res.status(500).json({
        error: "Failed to create card",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * PUT /api/dashboard/:id/custom-sections/:sectionId/cards/:cardId
 * Update a card's title, description, and/or icon.
 * Body: { title?, description?, icon? }
 */
customSectionRouter.put(
  "/api/dashboard/:id/custom-sections/:sectionId/cards/:cardId",
  async (req: Request, res: Response) => {
    try {
      const { id, sectionId, cardId } = req.params as {
        id: string;
        sectionId: string;
        cardId: string;
      };
      const body = req.body || {};

      const { title, description, icon } = body;

      if (title === undefined && description === undefined && icon === undefined) {
        return res.status(400).json({
          error: "No fields to update",
          message: "Provide at least one of: title, description, icon",
        });
      }

      // Ensure the card belongs to the section which belongs to the project
      const existing = await prisma.customSectionCard.findFirst({
        where: { id: cardId, sectionId },
        include: { section: true },
      });

      if (!existing || existing.section.projectId !== id) {
        return res.status(404).json({
          error: "Card not found for this section / project",
        });
      }

      const updated = await prisma.customSectionCard.update({
        where: { id: cardId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(icon !== undefined && { icon }),
        },
      });

      return res.status(200).json({
        success: true,
        message: "Card updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating card:", error);
      return res.status(500).json({
        error: "Failed to update card",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * DELETE /api/dashboard/:id/custom-sections/:sectionId/cards/:cardId
 * Delete a single card from a custom section.
 */
customSectionRouter.delete(
  "/api/dashboard/:id/custom-sections/:sectionId/cards/:cardId",
  async (req: Request, res: Response) => {
    try {
      const { id, sectionId, cardId } = req.params as {
        id: string;
        sectionId: string;
        cardId: string;
      };

      // Ensure the card belongs to the section which belongs to the project
      const existing = await prisma.customSectionCard.findFirst({
        where: { id: cardId, sectionId },
        include: { section: true },
      });

      if (!existing || existing.section.projectId !== id) {
        return res.status(404).json({
          error: "Card not found for this section / project",
        });
      }

      await prisma.customSectionCard.delete({ where: { id: cardId } });

      return res.status(200).json({
        success: true,
        message: "Card deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting card:", error);
      return res.status(500).json({
        error: "Failed to delete card",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);
