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

// Config imports
import connectDB from "./config/db.js";
import logger from "./config/logger.js";

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(hpp());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// CSRF Protection
// Note: CSURF is being used, ensure your frontend sends the XSRF-TOKEN header
app.use(csurf({ cookie: true }));

// HTTP Request Logging
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: false,
  })
);

app.use(morgan("combined"));

// Swagger Documentation
try {
  const swaggerDocument = yaml.load("./swagger.yaml");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  logger.error("Failed to load swagger.yaml", error);
}

// Routes Placeholder
app.get("/", (req, res) => {
  res.send("AI Learning Platform API is running...");
});

// Error Logging
app.use(
  expressWinston.errorLogger({
    winstonInstance: logger,
  })
);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Server running on port ${port} in ${process.env.NODE_ENV || "development"} mode`);
});