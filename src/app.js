// Basic Skeleton for Ad Platform Backend
// No business logic yet – just the foundation.

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import packageJson from "../package.json" with { type: "json" };
import clientsRouter from "./API/clients.route.js";
import tokensRouter from "./API/tokens.route.js";
import accountsRouter from "./API/accounts.route.js";
import campaignsRouter from "./API/campaigns.route.js";
import reportsRouter from "./API/reports.route.js";
import googleAuthRouter from "./API/Auth/google.route.js";
import metaAuthRouter from "./API/Auth/meta.route.js";
import accountsSyncRouter from "./API/accounts/sync.route.js";
import campaignsSyncRouter from "./API/campaigns/sync.route.js";
import adsSyncRouter from "./API/ads/sync.route.js";
import metricsSyncRouter from "./API/metrics/sync.route.js";

// Load environment variables
dotenv.config();

const requiredEnvVars = ["DATABASE_URL"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required env vars: ${missingEnvVars.join(", ")}`);
}

if (!process.env.ENCRYPTION_KEY) {
  console.warn("Warning: ENCRYPTION_KEY is not set. Token encryption is not enabled.");
}

// Create Express app
const app = express();

// Middleware
app.use(express.json());

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3001",
  "http://localhost:3000",
];

const configuredAllowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins =
  configuredAllowedOrigins.length > 0
    ? configuredAllowedOrigins
    : defaultAllowedOrigins;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

// Default route (Main Page Skeleton)
app.get("/", (req, res) => {
  res.send("Ad Platform Backend Skeleton Loaded");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ad-platform",
    message: "health check passed",
  });
});

app.get("/version", (req, res) => {
  res.json({
    status: "ok",
    name: packageJson.name,
    version: packageJson.version,
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/clients", clientsRouter);
app.use("/api/tokens", tokensRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/reports", reportsRouter);
app.use("/auth/google", googleAuthRouter);
app.use("/auth/meta", metaAuthRouter);
app.use("/accounts/sync", accountsSyncRouter);
app.use("/campaigns/sync", campaignsSyncRouter);
app.use("/ads/sync", adsSyncRouter);
app.use("/metrics/sync", metricsSyncRouter);

app.use((error, req, res, next) => {
  if (error && error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      status: "error",
      message: "origin not allowed",
    });
  }

  return res.status(500).json({
    status: "error",
    message: "internal server error",
  });
});

// Start server using PORT from .env
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});