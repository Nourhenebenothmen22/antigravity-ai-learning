/**
 * AI Learning Platform - Backend Entry Point
 * 
 * This file initializes the Express application, connects to the database,
 * and sets up all necessary middlewares (security, logging, parsing, etc.)
 * and routes.
 */

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import rateLimit from "express-rate-limit";
import expressWinston from "express-winston";
import morgan from "morgan";
import yaml from "yamljs";
import swaggerUi from "swagger-ui-express";
import hpp from "hpp";
import path from "path";
import { fileURLToPath } from "url";

// Config & Database
import connectDB from "./config/db.js";
import logger from "./config/logger.js";

// Route Imports (ESM style)
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import documentsRoutes from "./routes/documentsRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import flashcardsRoutes from "./routes/flashcardsRoutes.js";

// Middleware Imports
import errorHandler from "./middlewares/errorHandler.js";

// Utility for ESM paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment setup
dotenv.config();

// Initialize DB Connection
connectDB();

const app = express();

/**
 * 1. BASIC MIDDLEWARES
 */
// Security headers
app.use(helmet());

// CORS configuration - Allow frontend interactions
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  exposedHeaders: ["set-cookie"]
}));

// Prevention of parameter pollution
app.use(hpp());

// Body parsing with size limits for document processing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Cookie parsing for session/auth
app.use(cookieParser());

// Response compression
app.use(compression());

/**
 * 2. SECURITY & LIMITING
 */
// Rate limiting to prevent brute force/abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 mins
});
app.use("/api/", limiter);


/**
 * 3. LOGGING
 */
// Winston HTTP request logging
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: false,
  })
);

// Standard Morgan logging for dev visibility
app.use(morgan("dev"));

/**
 * 4. API DOCUMENTATION
 */
try {
  const swaggerPath = path.join(__dirname, "swagger.yaml");
  const swaggerDocument = yaml.load(swaggerPath);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  logger.error("Failed to load swagger.yaml. Documentation will be unavailable.", error);
}

/**
 * 5. ROUTES
 */
// Health check
app.get("/", (req, res) => {
  res.status(200).json({ status: "success", message: "AI Learning Platform API is running" });
});

// Domain-specific routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/flashcards", flashcardsRoutes);

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/**
 * 6. ERROR HANDLING
 */
// Winston error logging
app.use(
  expressWinston.errorLogger({
    winstonInstance: logger,
  })
);

// Final fallback for 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

/**
 * SERVER START
 */
const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`🚀 Server running on port ${port} in ${process.env.NODE_ENV || "development"} mode`);
});