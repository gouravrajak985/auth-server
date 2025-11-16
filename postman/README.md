# Pugly Auth Server - Postman Testing Guide

This directory contains Postman collection and environment files for comprehensive API testing.

## 📁 Files

- `Pugly-Auth-Server.postman_collection.json` - Complete API collection
- `Pugly-Auth-Environment.postman_environment.json` - Environment variables

## 🚀 Quick Setup

### 1. Import Collection & Environment

1. Open Postman
2. Click **Import** button
3. Import both files:
   - `Pugly-Auth-Server.postman_collection.json`
   - `Pugly-Auth-Environment.postman_environment.json`
4. Select the **Pugly Auth Environment** in the top-right dropdown

### 2. Start Your Server

```bash
npm run server
```

Make sure your server is running on `http://localhost:4000`

### 3. Create Admin User (First Time Only)

```bash
node src/scripts/seedAdmin.js
```

## 🧪 Testing Workflows

### Complete User Registration Flow

1. **Register User** → Creates user and sends OTP
2. **Verify OTP** → Activates the account (use OTP from email/logs)
3. **Login User** → Gets access token and refresh token
4. **Validate Access Token** → Verifies token works
5. **Refresh Access Token** → Tests token rotation
6. **Logout User** → Cleans up tokens

### Admin Testing Flow

1. **Login as Admin** → Use default admin credentials
2. **Validate Admin Token** → Check super_admin role

### Error Testing

1. **Invalid Registration** → Test validation errors
2. **Invalid Login** → Test authentication errors
3. **Access Without Token** → Test authorization errors
4. **Invalid OTP** → Test OTP validation

### Rate Limiting Tests

1. **Multiple Login Attempts** → Run 6+ times to trigger rate limit
2. **Multiple OTP Requests** → Run 4+ times to trigger OTP rate limit

## 🔧 Environment Variables

The collection automatically manages these variables:

- `base_url` - Server URL (default: http://localhost:4000)
- `access_token` - Auto-set from login responses
- `refresh_token` - Auto-extracted from cookies
- `admin_access_token` - Auto-set from admin login
- `user_id` - Auto-set from registration
- `user_email` - Test user email

## 📋 Test Scenarios

### 1. Happy Path Testing

```
Register → Verify OTP → Login → Validate → Refresh → Logout
```

### 2. Security Testing

- Test rate limiting on auth endpoints
- Test invalid tokens
- Test expired tokens
- Test CORS policies

### 3. Validation Testing

- Test weak passwords
- Test invalid email formats
- Test missing required fields
- Test invalid OTP codes

### 4. Admin Testing

- Test admin login
- Test role-based access
- Test admin token validation

## 🔍 Key Test Points

### Registration Endpoint
- ✅ Valid registration creates user
- ✅ Duplicate email/username rejected
- ✅ Weak password rejected
- ✅ OTP sent to email
- ✅ Rate limiting works

### Login Endpoint
- ✅ Valid credentials return tokens
- ✅ Invalid credentials rejected
- ✅ Unverified accounts rejected
- ✅ Refresh token set in cookie
- ✅ Rate limiting works

### Token Validation
- ✅ Valid tokens accepted
- ✅ Invalid tokens rejected
- ✅ Expired tokens rejected
- ✅ Missing tokens rejected

### Token Refresh
- ✅ Valid refresh token rotates
- ✅ Invalid refresh token rejected
- ✅ New access token generated
- ✅ New refresh token set

### Health Checks
- ✅ Basic health returns status
- ✅ Detailed health shows dependencies
- ✅ MongoDB connection status
- ✅ Redis connection status

## 🐛 Troubleshooting

### Common Issues

1. **Server not responding**
   - Check if server is running on port 4000
   - Verify MongoDB and Redis are running

2. **OTP verification fails**
   - Check email logs or console for OTP
   - OTP expires in 10 minutes

3. **Rate limiting triggered**
   - Wait 15 minutes or restart server
   - Check rate limit headers in response

4. **Cookie issues**
   - Ensure COOKIE_SECURE=false in development
   - Check if cookies are being set

### Debug Tips

- Check server logs for detailed error messages
- Use Postman Console to see request/response details
- Verify environment variables are set correctly
- Check network tab for cookie handling

## 📊 Expected Response Codes

- `200` - Success (login, validate, refresh, health)
- `201` - Created (registration)
- `400` - Bad Request (validation errors, invalid OTP)
- `401` - Unauthorized (invalid credentials, expired tokens)
- `403` - Forbidden (insufficient permissions, CORS)
- `404` - Not Found (user not found)
- `409` - Conflict (duplicate user)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error (system errors)

## 🔐 Security Headers to Check

Look for these headers in responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Strict-Transport-Security` (in production)
- `X-RateLimit-*` headers for rate limiting

## 📈 Performance Testing

Use Postman's Collection Runner to:
1. Run multiple iterations
2. Test concurrent requests
3. Monitor response times
4. Check for memory leaks

Happy Testing! 🚀