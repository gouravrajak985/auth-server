import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  otpVerification,
  validateAccessToken
} from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";
import { validateRegistration, validateLogin, validateOTP } from "../middleware/validation.js";

const router = Router();

router.route("/register").post(authLimiter, validateRegistration, registerUser);

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account and send OTP verification email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: '^[a-zA-Z0-9_]+$'
 *                 example: "testuser123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "test@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'
 *                 example: "TestPass123@"
 *                 description: "Must contain uppercase, lowercase, number, and special character"
 *     responses:
 *       201:
 *         description: User created successfully, OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                   example: 201
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User created and OTP sent successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or invalid input
 *       409:
 *         description: User already exists
 *       429:
 *         description: Rate limit exceeded
 */

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email/username and password. Returns access token and sets refresh token cookie.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "test@example.com"
 *               username:
 *                 type: string
 *                 example: "testuser123"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "TestPass123@"
 *             oneOf:
 *               - required: [email, password]
 *               - required: [username, password]
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: Refresh token cookie
 *             schema:
 *               type: string
 *               example: "refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=None"
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
 *                   example: "User logged In Successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 400
 *               success: false
 *               message: "Validation failed: Password is required"
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 401
 *               success: false
 *               message: "Invalid user credentials"
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 429
 *               success: false
 *               message: "Too many authentication attempts, please try again later."
 */
router.route("/login").post(authLimiter, validateLogin, loginUser);

/**
 * @swagger
 * /api/v1/users/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user and invalidate all refresh tokens
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         headers:
 *           Set-Cookie:
 *             description: Clears refresh token cookie
 *             schema:
 *               type: string
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
 *                   example: "Logged out successfully"
 *                 data:
 *                   type: object
 *                   example: {}
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.route("/logout").post(requireAuth, logoutUser);

/**
 * @swagger
 * /api/v1/users/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Generate a new access token using the refresh token cookie. Implements token rotation for security.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: New refresh token cookie
 *             schema:
 *               type: string
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
 *                   example: "Access token refreshed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid or expired refresh token
 */
router.route("/refresh-token").post(refreshAccessToken);

/**
 * @swagger
 * /api/v1/users/otpverification:
 *   post:
 *     summary: Verify OTP
 *     description: Verify the OTP sent to user's email during registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - inputOtp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "test@example.com"
 *               inputOtp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                   example: "User verified successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid or expired OTP
 *       429:
 *         description: Too many OTP attempts
 */
router.route("/otpverification").post(otpLimiter, validateOTP, otpVerification);

/**
 * @swagger
 * /api/v1/users/validate:
 *   get:
 *     summary: Validate access token
 *     description: Validate the current access token and return user details. Used by microservices for SSO.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
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
 *                   example: "Token is valid"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     email:
 *                       type: string
 *                       example: "test@example.com"
 *                     username:
 *                       type: string
 *                       example: "testuser123"
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [user, super_admin, merchant, partner]
 *                       example: ["user"]
 *                     is_verified:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Invalid or expired token
 */
router.route("/validate").get(requireAuth, validateAccessToken);

/**
 * @swagger
 * /api/v1/users/health:
 *   get:
 *     summary: User routes health check
 *     description: Check if user authentication routes are working
 *     tags: [Health & Monitoring]
 *     responses:
 *       200:
 *         description: User routes are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "User route is healthy"
 */
router.route("/health").get((req, res) => {
  res.status(200).json({ status: "User route is healthy" });
});

export default router;
