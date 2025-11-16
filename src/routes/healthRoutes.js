import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { redisClient } from "../config/redisClient.js";
import mongoose from "mongoose";

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Basic health check
 *     description: Check if the service is running and healthy
 *     tags: [Health & Monitoring]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Service is healthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     uptime:
 *                       type: number
 *                       example: 3600.5
 *                       description: "Server uptime in seconds"
 *                     environment:
 *                       type: string
 *                       example: "development"
 */
// Basic health check
router.get("/", asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    }, "Service is healthy")
  );
}));

/**
 * @swagger
 * /api/v1/health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Comprehensive health check including database and Redis connectivity
 *     tags: [Health & Monitoring]
 *     responses:
 *       200:
 *         description: Service is healthy with all dependencies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Service is healthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       description: "Server uptime in seconds"
 *                     environment:
 *                       type: string
 *                     dependencies:
 *                       type: object
 *                       properties:
 *                         mongodb:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [connected, disconnected, error]
 *                             state:
 *                               type: number
 *                         redis:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [connected, error]
 *                     memory:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: string
 *                           example: "50 MB"
 *                         heapTotal:
 *                           type: string
 *                           example: "30 MB"
 *                         heapUsed:
 *                           type: string
 *                           example: "20 MB"
 *                         external:
 *                           type: string
 *                           example: "5 MB"
 *       503:
 *         description: Service is unhealthy - one or more dependencies failed
 */
// Detailed health check with dependencies
router.get("/detailed", asyncHandler(async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    dependencies: {}
  };

  // Check MongoDB connection
  try {
    const mongoState = mongoose.connection.readyState;
    health.dependencies.mongodb = {
      status: mongoState === 1 ? "connected" : "disconnected",
      state: mongoState
    };
  } catch (error) {
    health.dependencies.mongodb = {
      status: "error",
      error: error.message
    };
    health.status = "unhealthy";
  }

  // Check Redis connection
  try {
    await redisClient.ping();
    health.dependencies.redis = {
      status: "connected"
    };
  } catch (error) {
    health.dependencies.redis = {
      status: "error",
      error: error.message
    };
    health.status = "unhealthy";
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.memory = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
  };

  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(
    new ApiResponse(statusCode, health, `Service is ${health.status}`)
  );
}));

export default router;