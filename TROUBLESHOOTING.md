# Troubleshooting Guide

Common issues and their solutions for DGEN Access Control System.

## Table of Contents

- [Setup Issues](#setup-issues)
- [Firebase Issues](#firebase-issues)
- [API Errors](#api-errors)
- [Deployment Issues](#deployment-issues)
- [ESP32 Integration Issues](#esp32-integration-issues)

---

## Setup Issues

### "Command not found: npm"

**Problem:** Node.js is not installed.

**Solution:**
1. Install Node.js 18+ from [nodejs.org](https://nodejs.org/)
2. Verify installation: `node --version` and `npm --version`
3. Restart your terminal

### "Cannot find module" errors

**Problem:** Dependencies are not installed.

**Solution:**
```bash
npm install
```

### Port 3000 is already in use

**Problem:** Another process is using port 3000.

**Solution:**

**Option 1:** Kill the process using port 3000
```bash
# On Linux/Mac
lsof -ti:3000 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

**Option 2:** Use a different port
```bash
PORT=3001 npm run dev
```

---

## Firebase Issues

### "Firebase not configured" Error

**Problem:** `.env.local` file is missing or incomplete.

**Solution:**
1. Check if `.env.local` exists:
   ```bash
   ls -la | grep .env.local
   ```

2. If missing, create it:
   ```bash
   cp .env.example .env.local
   ```

3. Validate configuration:
   ```bash
   npm run validate-config
   ```

4. Ensure all 4 variables are set:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_DATABASE_URL`

5. Restart dev server:
   ```bash
   npm run dev
   ```

### "Invalid service account" Error

**Problem:** Firebase service account credentials are incorrect.

**Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Update `.env.local` with new credentials
6. Ensure private key includes `\n` characters and is wrapped in quotes

### "Permission denied" Error

**Problem:** Firebase security rules are not deployed or too restrictive.

**Solution:**
1. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,database
   ```

2. Wait 30 seconds for rules to propagate

3. Refresh your application

4. If still failing, temporarily test with open rules (NOT for production):

**Firestore (test only):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Realtime Database (test only):**
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### "Firestore index required" Error

**Problem:** Query requires a composite index.

**Solution:**
1. Check console for index creation link
2. Click the link to create index in Firebase Console
3. Wait for index to build (can take a few minutes)
4. Or deploy indexes from code:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### "Quota exceeded" Error

**Problem:** Firebase free tier limits exceeded.

**Solution:**
1. Check usage in [Firebase Console](https://console.firebase.google.com/)
2. Wait for quota to reset (daily)
3. Upgrade to Blaze plan if needed
4. Optimize queries to reduce reads/writes

---

## API Errors

### API Returns 500 Errors

**Problem:** Server-side error, usually Firebase-related.

**Solution:**
1. Check server logs:
   ```bash
   npm run dev
   ```
   Look for error messages in the terminal

2. Common causes:
   - Firebase not initialized (check `.env.local`)
   - Invalid Firebase credentials
   - Database not enabled in Firebase Console
   - Security rules blocking access

3. Validate configuration:
   ```bash
   npm run validate-config
   ```

### API Returns 503 Errors

**Problem:** Firebase is not configured.

**Solution:**
Same as "Firebase not configured" error above.

### API Returns 400 Errors

**Problem:** Invalid request data.

**Solution:**
1. Check request payload format
2. Ensure all required fields are included
3. Check browser console for error details

### "Network Error" or "Failed to fetch"

**Problem:** Cannot reach API endpoints.

**Solution:**
1. Verify dev server is running: `npm run dev`
2. Check if port 3000 is accessible
3. Check browser console for CORS errors
4. Ensure no firewall is blocking requests

---

## Deployment Issues

### Vercel Build Fails

**Problem:** Build fails during Vercel deployment.

**Solution:**
1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing dependencies: `npm install [package]`
   - Node version mismatch: Set Node version in Vercel
   - Build command incorrect: Use `npm run build`

3. Test build locally:
   ```bash
   npm run build
   ```

### Environment Variables Not Working in Vercel

**Problem:** API returns 500 errors in production.

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Ensure all 4 Firebase variables are set:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_DATABASE_URL`
3. Select "Production" environment
4. Redeploy: `vercel --prod`

### Private Key Format Issues in Vercel

**Problem:** Firebase initialization fails with private key errors.

**Solution:**
1. Ensure private key is wrapped in **double quotes** in Vercel
2. Preserve `\n` characters (do not convert to actual newlines)
3. Format: `"-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"`

### Domain Not Working After Deployment

**Problem:** Custom domain doesn't resolve.

**Solution:**
1. Check DNS propagation (can take up to 48 hours)
2. Verify DNS records in Vercel dashboard
3. Ensure SSL certificate is issued
4. Try clearing browser cache

---

## ESP32 Integration Issues

### ESP32 Cannot Connect to Server

**Problem:** ESP32 gets connection timeout or refused.

**Solution:**
1. Verify server URL is correct (include `https://`)
2. Check if server is accessible: `curl [your-url]/api/verify`
3. Ensure ESP32 has internet connection
4. Check if firewall is blocking ESP32

### ESP32 Gets "Access Denied" for Valid IDs

**Problem:** Known user IDs return "NO" (denied).

**Solution:**
1. Check if user exists in Firestore:
   - Go to Firebase Console → Firestore Database
   - Look for user document with matching ID
2. Verify user status is "Active"
3. Check API logs for errors
4. Test endpoint manually:
   ```bash
   curl -X POST https://your-url/api/verify \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "data=DGEN-EX-01"
   ```

### ESP32 Request Format Issues

**Problem:** Server returns 400 or 500 errors.

**Solution:**
1. Ensure Content-Type header is set:
   ```cpp
   http.addHeader("Content-Type", "application/x-www-form-urlencoded");
   ```

2. Use correct format:
   ```cpp
   String payload = "data=" + rfidData;
   ```

3. Don't send JSON (the endpoint expects form data)

### Logs Not Appearing

**Problem:** Access logs are not recorded.

**Solution:**
1. Check Firestore and Realtime Database are enabled
2. Verify security rules allow writes to `logs` collection
3. Check server logs for errors
4. Ensure log creation in `/api/verify` route is working

---

## Browser Issues

### "Mixed Content" Warning

**Problem:** Loading HTTP content on HTTPS page.

**Solution:**
1. Ensure all resources use HTTPS
2. Check Firebase URLs use `https://`
3. Update any hardcoded HTTP URLs

### Blank Page / White Screen

**Problem:** Application doesn't render.

**Solution:**
1. Check browser console for errors (F12)
2. Clear browser cache and cookies
3. Try incognito/private mode
4. Disable browser extensions
5. Check if JavaScript is enabled

### Slow Performance

**Problem:** Application loads slowly.

**Solution:**
1. Check network tab in browser devtools
2. Optimize Firebase queries (use limits, pagination)
3. Enable Firebase persistence for offline support
4. Check Vercel region (deploy closer to users)

---

## Database Issues

### Users Not Appearing

**Problem:** Employee list is empty.

**Solution:**
1. Check Firestore Database in Firebase Console
2. Verify `users` collection exists
3. Default users should be created automatically on first API call
4. Manually trigger initialization by accessing dashboard

### Duplicate User IDs

**Problem:** Cannot add user with existing ID.

**Solution:**
This is expected behavior. User IDs must be unique.
1. Use a different ID
2. Or delete existing user first (if it's a test user)
3. Super admins (DGEN-ADM-00, DGEN-EX-01 to DGEN-MK-04) cannot be deleted

### Cannot Delete Super Admins

**Problem:** Delete button disabled for certain users.

**Solution:**
This is by design. The 5 default super admins are protected:
- DGEN-ADM-00 (System Administrator)
- DGEN-EX-01 (Tirthankar Dasgupta)
- DGEN-FI-02 (Sukomal Debnath)
- DGEN-OP-03 (Arpan Bairagi)
- DGEN-MK-04 (Sagnik Mandal)

To bypass (not recommended):
1. Remove `isSuperAdmin: true` check in API route
2. Or manually delete in Firebase Console

---

## Getting More Help

### Enable Debug Mode

Add to `.env.local`:
```env
NODE_ENV=development
```

### Check Logs

**Development:**
```bash
npm run dev
# Watch terminal output
```

**Production (Vercel):**
```bash
vercel logs [deployment-url]
# Or check Vercel dashboard
```

### Useful Commands

```bash
# Validate Firebase config
npm run validate-config

# Check Firebase rules
firebase deploy --only firestore:rules,database --dry-run

# View Firestore data
firebase firestore:get users --project your-project-id

# Clear Next.js cache
rm -rf .next
npm run build
```

### Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Issues](https://github.com/MrTG1B/DGEN-ACESS/issues)

### Still Stuck?

1. Read [SETUP.md](SETUP.md) carefully
2. Check [QUICKSTART.md](QUICKSTART.md) for basic setup
3. Search existing [GitHub Issues](https://github.com/MrTG1B/DGEN-ACESS/issues)
4. Open a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Error messages (from browser console and terminal)
   - Environment details (OS, Node version, etc.)
   - What you've already tried

---

**Pro Tip:** Run `npm run validate-config` before asking for help - it catches most configuration issues!
