import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import router from "./routes";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser());

// Basic health check
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

// API routes
app.use(router);

/* ============================
   404 NOT FOUND HANDLER
============================ */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

/* ============================
   GLOBAL ERROR HANDLER
============================ */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

app.listen(PORT, () => console.log(`Server ready at: ${PORT}`));

export default app;
