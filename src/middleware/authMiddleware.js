import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const requireAuth = asyncHandler(async (req, _, next) => {
  // Try to get access token from cookie first
  const ACCESS_TOKEN_COOKIE_NAME = process.env.ACCESS_TOKEN_COOKIE_NAME || "access_token";
  let token = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];

  // Fallback to Authorization header for backward compatibility (optional)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    throw new ApiError(401, "No access token provided");
  }

  let payload;
  try {
    payload = verifyAccessToken(token); // Verify token signature + expiry
  } catch (err) {
    throw new ApiError(401, "Invalid or expired access token");
  }
  
  const user = await User.findById(payload.sub).select(
    "-password"
  );

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  req.user = user;
  next();
});

export const requireRole = (requiredRoles) => {
  const allowedRoles = Array.isArray(requiredRoles)
    ? requiredRoles
    : [requiredRoles];

  return (req, res, next) => {
    // requireAuth must run before this middleware
    if (!req.user) {
      throw new ApiError(401, "Unauthorized: No user found in request");
    }

    const userRoles = req.user.globalRoles || [];

    // Check if user has ANY of the required roles
    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res
        .status(403)
        .json(
          new ApiResponse(
            403,
            null,
            "Forbidden: You do not have permission to access this resource"
          )
        );
    }
    next();
  };
};

