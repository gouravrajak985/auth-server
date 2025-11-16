import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error caught by middleware:", err);

  // If it's an instance of ApiError, use its structure
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
      data: err.data,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Otherwise, fallback to generic 500 error
  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
