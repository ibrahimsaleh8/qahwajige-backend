import "dotenv/config";
import express from "express";
import router from "./routes";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

app.listen(PORT, () => console.log(`Server ready at: ${PORT}`));

export default app;
