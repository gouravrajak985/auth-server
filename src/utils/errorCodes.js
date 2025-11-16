// Comprehensive error codes for the authentication system
export const ERROR_CODES = {
  // Authentication Errors (1000-1999)
  AUTH_INVALID_CREDENTIALS: {
    code: 1001,
    message: 'Invalid username/email or password',
    httpStatus: 401
  },
  AUTH_TOKEN_EXPIRED: {
    code: 1002,
    message: 'Access token has expired',
    httpStatus: 401
  },
  AUTH_TOKEN_INVALID: {
    code: 1003,
    message: 'Invalid or malformed token',
    httpStatus: 401
  },
  AUTH_TOKEN_MISSING: {
    code: 1004,
    message: 'Authorization token is required',
    httpStatus: 401
  },
  AUTH_REFRESH_TOKEN_INVALID: {
    code: 1005,
    message: 'Invalid or expired refresh token',
    httpStatus: 401
  },
  AUTH_ACCOUNT_NOT_VERIFIED: {
    code: 1006,
    message: 'Account email verification required',
    httpStatus: 401
  },
  AUTH_INSUFFICIENT_PERMISSIONS: {
    code: 1007,
    message: 'Insufficient permissions for this action',
    httpStatus: 403
  },

  // User Management Errors (2000-2999)
  USER_NOT_FOUND: {
    code: 2001,
    message: 'User not found',
    httpStatus: 404
  },
  USER_ALREADY_EXISTS: {
    code: 2002,
    message: 'User with this email or username already exists',
    httpStatus: 409
  },
  USER_CREATION_FAILED: {
    code: 2003,
    message: 'Failed to create user account',
    httpStatus: 500
  },

  // Validation Errors (3000-3999)
  VALIDATION_FAILED: {
    code: 3001,
    message: 'Input validation failed',
    httpStatus: 400
  },
  VALIDATION_EMAIL_INVALID: {
    code: 3002,
    message: 'Invalid email format',
    httpStatus: 400
  },
  VALIDATION_PASSWORD_WEAK: {
    code: 3003,
    message: 'Password does not meet security requirements',
    httpStatus: 400
  },
  VALIDATION_USERNAME_INVALID: {
    code: 3004,
    message: 'Username format is invalid',
    httpStatus: 400
  },

  // OTP Errors (4000-4999)
  OTP_EXPIRED: {
    code: 4001,
    message: 'OTP has expired',
    httpStatus: 400
  },
  OTP_INVALID: {
    code: 4002,
    message: 'Invalid OTP provided',
    httpStatus: 400
  },
  OTP_GENERATION_FAILED: {
    code: 4003,
    message: 'Failed to generate OTP',
    httpStatus: 500
  },
  OTP_EMAIL_SEND_FAILED: {
    code: 4004,
    message: 'Failed to send OTP email',
    httpStatus: 500
  },

  // Rate Limiting Errors (5000-5999)
  RATE_LIMIT_EXCEEDED: {
    code: 5001,
    message: 'Too many requests, please try again later',
    httpStatus: 429
  },
  RATE_LIMIT_AUTH_EXCEEDED: {
    code: 5002,
    message: 'Too many authentication attempts',
    httpStatus: 429
  },

  // System Errors (6000-6999)
  DATABASE_CONNECTION_ERROR: {
    code: 6001,
    message: 'Database connection failed',
    httpStatus: 500
  },
  REDIS_CONNECTION_ERROR: {
    code: 6002,
    message: 'Redis connection failed',
    httpStatus: 500
  },
  EMAIL_SERVICE_ERROR: {
    code: 6003,
    message: 'Email service unavailable',
    httpStatus: 500
  },
  INTERNAL_SERVER_ERROR: {
    code: 6999,
    message: 'Internal server error',
    httpStatus: 500
  },

  // CORS Errors (7000-7999)
  CORS_ORIGIN_NOT_ALLOWED: {
    code: 7001,
    message: 'Origin not allowed by CORS policy',
    httpStatus: 403
  }
};

// Helper function to get error by code
export const getErrorByCode = (code) => {
  return Object.values(ERROR_CODES).find(error => error.code === code);
};

// Helper function to create standardized error response
export const createErrorResponse = (errorCode, customMessage = null, additionalData = {}) => {
  const error = getErrorByCode(errorCode) || ERROR_CODES.INTERNAL_SERVER_ERROR;
  
  return {
    success: false,
    statusCode: error.httpStatus,
    code: error.code,
    message: customMessage || error.message,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
};