# Auth Server

Multi-Platform SaaS Authentication System with JWT-based SSO, refresh token rotation, and role-based access control.

## 🚀 Features

### Authentication & Security
- ✅ JWT-based authentication with access/refresh token pattern
- ✅ Refresh token rotation for enhanced security
- ✅ HttpOnly cookies for secure token storage
- ✅ OTP-based email verification with Redis storage
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting on authentication endpoints
- ✅ CORS protection with origin validation
- ✅ Security headers with Helmet.js

### API & Documentation
- ✅ RESTful API design
- ✅ Comprehensive input validation
- ✅ Swagger/OpenAPI documentation
- ✅ Structured error handling with error codes
- ✅ Health check endpoints
- ✅ Request/response logging

### Infrastructure
- ✅ MongoDB with Mongoose ODM
- ✅ Redis for OTP and session management
- ✅ Winston logging with file rotation
- ✅ Graceful shutdown handling
- ✅ Environment-based configuration

## 🛠️ Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Redis
- SMTP server for email

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Copy `.env.example` to `.env` and configure your values.

3. **Start the server:**
   ```bash
   npm run server
   ```

4. **Create admin user:**
   ```bash
   node src/scripts/seedAdmin.js
   ```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI:** `http://localhost:4000/api-docs`
- **Health Check:** `http://localhost:4000/api/v1/health`

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout
- `POST /api/v1/users/refresh-token` - Refresh access token
- `POST /api/v1/users/otpverification` - Verify OTP
- `GET /api/v1/users/validate` - Validate access token (for microservices)

### Health & Monitoring
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health with dependencies

## 🔐 Security Features

- **Rate Limiting:** 5 auth attempts per 15 minutes
- **Input Validation:** Comprehensive validation with express-validator
- **Security Headers:** Helmet.js for security headers
- **CORS Protection:** Origin-based access control
- **Token Security:** HttpOnly cookies with secure flags
- **Password Policy:** Strong password requirements
- **Audit Logging:** Security event logging

## 🚦 User Roles

- `user` - Default role for regular users
- `super_admin` - Full system access
- `merchant` - Merchant dashboard access
- `partner` - Partner dashboard access

## 📊 Monitoring & Logging

- **Winston Logging:** Structured logging with file rotation
- **Health Checks:** MongoDB and Redis connectivity monitoring
- **Error Tracking:** Comprehensive error codes and tracking
- **Audit Trail:** Security event logging

## 🔧 Production Setup

### RS256 JWT (Recommended)
```bash
mkdir keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```
Set `USE_RS256=true` in .env

### Production Checklist
- ✅ Serve over HTTPS (required for secure cookies)
- ✅ Set `COOKIE_SECURE=true`
- ✅ Use domain `COOKIE_DOMAIN=.mywebsite.com`
- ✅ Rate limiting implemented
- ✅ Security headers configured
- ✅ Logging and monitoring setup

## 📝 License

ISC
