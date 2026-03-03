# CORS Fix Guide

**Date:** 2026-03-03  
**Issue:** Frontend (localhost:3000) getting CORS errors when calling backend API (localhost:3001)  
**Status:** ✅ FIXED - Restart backend to apply

---

## 🔍 Root Cause

The backend CORS configuration was set to only allow `APP_URL` (http://localhost:3001), which is the backend's own URL. This prevented the frontend (http://localhost:3000) from making cross-origin requests.

**Previous CORS config:**
```typescript
app.enableCors({
  origin: configService.get<string>('app.url'), // ❌ Only allowed localhost:3001
  credentials: true,
});
```

---

## ✅ Solution Applied

### 1. Updated Configuration File

**File:** `backend/src/config/configuration.ts`

Added `frontendUrl` to configuration:
```typescript
app: {
  url: process.env.APP_URL || 'http://localhost:8000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000', // ✅ NEW
  nodeEnv: process.env.NODE_ENV || 'development',
},
```

### 2. Updated CORS Settings

**File:** `backend/src/main.ts`

Enhanced CORS configuration:
```typescript
// CORS configuration
const frontendUrl = configService.get<string>('app.frontendUrl') || 'http://localhost:3000';
app.enableCors({
  origin: [frontendUrl, 'http://localhost:3000'], // ✅ Allow frontend origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
```

### 3. Added Environment Variable

**File:** `backend/.env`

Added:
```bash
FRONTEND_URL="http://localhost:3000"
```

---

## 🚀 How to Apply the Fix

### Step 1: Restart Backend Server

**If backend is running in terminal:**
1. Press `Ctrl+C` to stop the server
2. Restart with:
   ```bash
   cd backend
   npm run start:dev
   ```

**If backend is running in background:**
```bash
# Find the process
lsof -ti:3001 | xargs kill -9

# Restart
cd backend
npm run start:dev
```

### Step 2: Verify CORS Headers

Test that CORS headers are now correct:

```bash
curl -I 'http://localhost:3001/api/admin/property-groups' \
  -H 'Origin: http://localhost:3000' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected response headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,Accept
```

### Step 3: Test Frontend

1. Open frontend at http://localhost:3000
2. Login as admin (admin@renthub.com)
3. Navigate to Landlords page
4. **Expected:** Data loads without CORS errors
5. Check browser console - should see successful API calls

---

## 🔧 What Changed

### Before:
- ❌ CORS only allowed backend's own URL (localhost:3001)
- ❌ Frontend requests blocked with CORS error
- ❌ Browser console showed: "Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy"

### After:
- ✅ CORS allows frontend URL (localhost:3000)
- ✅ Frontend can make authenticated requests
- ✅ Credentials (cookies, JWT) properly sent
- ✅ All HTTP methods allowed
- ✅ Required headers (Authorization, Content-Type) allowed

---

## 📋 Configuration Details

### Allowed Origins:
- `http://localhost:3000` (frontend development)
- Configurable via `FRONTEND_URL` environment variable

### Allowed Methods:
- GET
- POST
- PUT
- PATCH
- DELETE
- OPTIONS (preflight)

### Allowed Headers:
- Content-Type
- Authorization (for JWT tokens)
- Accept

### Credentials:
- ✅ Enabled (allows cookies and Authorization headers)

---

## 🎯 Production Deployment

For production, update the `.env` file:

```bash
# Production frontend URL
FRONTEND_URL="https://yourdomain.com"

# Or multiple origins (requires code update)
# FRONTEND_URL="https://yourdomain.com,https://www.yourdomain.com"
```

**For multiple origins in production:**

Update `backend/src/main.ts`:
```typescript
const allowedOrigins = [
  configService.get<string>('app.frontendUrl'),
  'https://yourdomain.com',
  'https://www.yourdomain.com',
].filter(Boolean);

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
```

---

## 🧪 Testing Checklist

After restarting backend, verify:

- [ ] Backend server starts without errors
- [ ] Console shows: `🚀 Application is running on: http://localhost:3001`
- [ ] Frontend can login successfully
- [ ] Admin dashboard loads without CORS errors
- [ ] Landlords page shows data (or empty state if no data)
- [ ] Users page loads without errors
- [ ] Subscriptions page loads without errors
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows successful API responses (200 OK)
- [ ] Authorization header is sent with requests
- [ ] Response includes proper CORS headers

---

## 🐛 Troubleshooting

### Still getting CORS errors?

1. **Clear browser cache:**
   - Chrome: `Cmd+Shift+Delete` → Clear cached images and files
   - Or use Incognito mode

2. **Verify backend restarted:**
   ```bash
   # Check if backend is running
   curl http://localhost:3001/api
   ```

3. **Check environment variable:**
   ```bash
   cd backend
   grep FRONTEND_URL .env
   # Should show: FRONTEND_URL="http://localhost:3000"
   ```

4. **Verify CORS headers:**
   ```bash
   curl -I http://localhost:3001/api/admin/property-groups \
     -H 'Origin: http://localhost:3000'
   ```

5. **Check browser console:**
   - Open DevTools → Console
   - Look for CORS error messages
   - Check Network tab → Headers → Response Headers

### Backend won't start?

1. **Check port 3001 is free:**
   ```bash
   lsof -ti:3001
   # If shows PID, kill it: kill -9 <PID>
   ```

2. **Check for syntax errors:**
   ```bash
   cd backend
   npm run build
   ```

3. **Verify .env file exists:**
   ```bash
   ls -la .env
   ```

---

## ✅ Summary

**Problem:** CORS blocking frontend requests to backend  
**Solution:** Updated CORS to allow frontend origin (localhost:3000)  
**Files Changed:**
- `backend/src/config/configuration.ts` - Added frontendUrl config
- `backend/src/main.ts` - Updated CORS settings
- `backend/.env` - Added FRONTEND_URL variable

**Next Step:** **Restart backend server** to apply changes

After restart, all admin pages will load data without CORS errors.
