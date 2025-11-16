import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  console.error(`🔥 Error (${req.method} ${req.originalUrl}):`, err);

  // --- If headers already sent (rare but possible)
  if (res.headersSent) {
    return next(err);
  }

  // --- Custom API Error
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      data: err.data || null,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // --- Mongoose Duplicate Key Error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate key error",
      errors: [{ field: Object.keys(err.keyPattern)[0], message: "Already exists" }],
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // --- Mongoose Validation Error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
      })),
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // --- JWT Errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      errors: [],
      timestamp: new Date().toISOString(),
    });
  }

  // --- JWT Expired
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      errors: [],
      timestamp: new Date().toISOString(),
    });
  }

  // --- Default Express Error
  return res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
    errors: [],
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
