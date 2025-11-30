// Authentication Controller

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import  {RefreshToken}  from "../models/refreshTokenModel.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { redisClient } from '../config/redisClient.js';
import { transporter, sendEMail } from "../services/emailService.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/jwt.js";
import { v4 as uuidv4 } from "uuid";


const COOKIE_NAME = process.env.COOKIE_NAME || "refresh_token";
const ACCESS_TOKEN_COOKIE_NAME = process.env.ACCESS_TOKEN_COOKIE_NAME || "access_token";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || ".mywebsite.com";
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";
const REFRESH_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY || "30", 10);
// Access token expiry in minutes (default 15 minutes)
const ACCESS_TOKEN_EXPIRY_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRY?.replace('m', '') || "15", 10);
const ACCESS_TOKEN_MAX_AGE = ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000; // Convert to milliseconds

// Register User
const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  // Checking if all required details are included or not. if not throw error
  if (
    [email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // Checking if user exist or not. If exist throw error.
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  // Not for Production will removed after development.
  try {
    await transporter.verify();
    console.log("Server is ready to take our messages");
  } catch (error) {
    throw new ApiError(400, "SMTP Server Verification failed");
  }
  // Generating, Hashing, Storing, Sending OTP
  //-Generating
  const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  };
  const otp = generateOTP(6); // e.g., "456789"
  //-Hashing
  const hashedOTP = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
  };
  const hashed = hashedOTP(otp);
  //-Storing
  await redisClient.setEx(`otp:${email}`, 600, hashed); // 600 seconds = 10 mins
  //-Sending Mail
  const subject = "Your OTP (Valid for 10 Minutes)";
  const message = `<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Time-sensitive OTP Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f6f8;
      margin: 0;
      padding: 20px;
      color: #333333;
    }
    .email-container {
      max-width: 480px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 30px 25px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 15px;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #2a9d8f;
      letter-spacing: 4px;
      margin: 20px 0;
      text-align: center;
    }
    .expiry {
      background-color: #ffe5e5;
      color: #d00000;
      font-weight: 600;
      padding: 12px 15px;
      border-radius: 6px;
      text-align: center;
      font-size: 16px;
      margin-top: 10px;
    }
    .footer {
      font-size: 13px;
      color: #777777;
      margin-top: 30px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="email-container" role="main">
    <p class="greeting">Hello ${username},</p>
    <p>Your OTP code is:</p>
    <p class="otp-code">${otp}</p>
    <p class="expiry">This code will expire in <strong>10 minutes</strong>.</p>
    <p>If you did not request this code, please ignore this email.</p>
    <div class="footer">
      &copy; 2024 Your Company. All rights reserved.
    </div>
  </div>
</body>
</html>
`
  try {
    await sendEMail(email, subject, message);
  } catch (error) {
    throw new ApiError(500, "Failed to send OTP email");
  }

  // Creating User
  const user = await User.create({
    email,
    password,
    username: username.toLowerCase(),
    globalRoles: ["user"],
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created and OTP sent successfully"));
});
// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  if (user.is_verified === false) {
    throw new ApiError(401, "Please verify your email before logging in");
  }


  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    roles: user.globalRoles
  });

  const tokenId = uuidv4();
  const refreshToken = signRefreshToken({
    tokenId,
    sub: user._id.toString()
  });

  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 86400000);


  const loggedInUser = await User.findById(user._id).select(
    "-password"
  );

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    userAgent: req.get("User-Agent") || "Unknown",
    ip: req.ip,
    expiresAt
  });

  return res
    .status(200)
    .cookie(COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: "none",
      domain: COOKIE_DOMAIN,
      path: "/",
      maxAge: REFRESH_DAYS * 86400000
    })
    .cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: "none",
      domain: COOKIE_DOMAIN,
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE
    })
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
        },
        "User logged In Successfully"
      )
    );
});
// Logout User
const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  // Delete all refresh tokens for the user (optional: you can delete only the cookie token)
  await RefreshToken.deleteMany({ user: userId }).catch((e) => {
    console.warn("Failed to delete refresh tokens:", e?.message || e);
  });

  // Clear refresh token cookie
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "none",
    domain: COOKIE_DOMAIN,
    path: "/"
  });

  // Clear access token cookie
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "none",
    domain: COOKIE_DOMAIN,
    path: "/"
  });

  return res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});
// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const cookie = req.cookies[COOKIE_NAME];
    if (!cookie) {
      throw new ApiError(401, "Refresh token not found in cookies");
    }
    const payload = verifyRefreshToken(cookie);
    const existing = await RefreshToken.findOne({ token: cookie });
    if (!existing) {
      throw new ApiError(401, "Existing refresh token not found");
    }

    // Token rotation
    const newTokenId = uuidv4();
    const newRefreshToken = signRefreshToken({
      tokenId: newTokenId,
      sub: payload.sub
    });

    existing.replacedByToken = newRefreshToken;
    await existing.save();

    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 86400000);
    await RefreshToken.create({
      token: newRefreshToken,
      user: existing.user,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      expiresAt
    });

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(401, "User not found");
    }
    const accessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      roles: user.globalRoles
    });
    return res
      .status(200)
      .cookie(COOKIE_NAME, newRefreshToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: "none",
        domain: COOKIE_DOMAIN,
        path: "/",
        maxAge: REFRESH_DAYS * 86400000
      })
      .cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: "none",
        domain: COOKIE_DOMAIN,
        path: "/",
        maxAge: ACCESS_TOKEN_MAX_AGE
      })
      .json(
        new ApiResponse(
          200,
          {},
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});
// OTP Verification
const otpVerification = asyncHandler(async (req, res) => {
  const { email, inputOtp } = req.body;
  if (
    [email, inputOtp].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const storedHashedOtp = await redisClient.get(`otp:${email}`);
  if (!storedHashedOtp) {
    throw new ApiError(400, "OTP expired or not found");
  }
  const hashOTP = (otp) =>
    crypto.createHash("sha256").update(otp).digest("hex");

  const hashedInputOtp = hashOTP(inputOtp);
  if (hashedInputOtp !== storedHashedOtp) {
    throw new ApiError(400, "Invalid OTP");
  }

  try {
    await redisClient.del(`otp:${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { is_verified: true },
      { new: true }
    ).select("-password -refreshToken").lean();

    // Optional logging
    console.log(`User ${email} verified at ${new Date().toISOString()}`);

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedUser, "User verified successfully")
      );
  } catch (error) {
    // Optionally, you could attempt to restore OTP in Redis or notify admins
    throw new ApiError(500, "Failed to complete verification process");
  }

});
// Get User Profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      is_verified: user.is_verified,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Validate Access Token (for microservices)
const validateAccessToken = asyncHandler(async (req, res) => {
  // requireAuth middleware already validates token and attaches user
  const user = req.user;
  
  return res.status(200).json(
    new ApiResponse(200, {
      id: user._id,
      email: user.email,
      username: user.username,
      roles: user.globalRoles,
      is_verified: user.is_verified
    }, "Token is valid")
  );
});

// Check User (Check if email exists)
const checkUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || email.trim() === "") {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  return res.status(200).json(
    new ApiResponse(200, {
      exists: !!user,
      email: email.toLowerCase()
    }, user ? "User exists" : "User does not exist")
  );
});


export { registerUser, loginUser, logoutUser, refreshAccessToken, otpVerification, getUserProfile, validateAccessToken, checkUser };