import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

export interface AuthRequest extends Request {
  admin?: { id: string; email: string };
}

/**
 * Middleware: verify the JWT stored in cookie or Authorization header.
 * Attaches `req.admin` on success.
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Access denied. No token provided." });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      email: string;
    };

    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin) {
      res.status(401).json({ error: "Admin not found or invalid token." });
      return;
    }

    req.admin = { id: admin.id, email: admin.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};
