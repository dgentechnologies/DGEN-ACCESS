# Security Policy

## Security Considerations for DGEN Access Control System

This document outlines security considerations and best practices for deploying and maintaining the DGEN Access Control System.

## Current Security Model

### Firebase Rules

The Firebase security rules (`firestore.rules` and `database.rules.json`) are intentionally permissive to support:
- **ESP32 Integration**: IoT devices need to access the API without traditional user authentication
- **Admin Dashboard**: Web interface needs to read/write data
- **Simplicity**: Easier setup for initial deployment

**⚠️ Important**: The current rules allow **unauthenticated access** to read and write data.

## Production Security Recommendations

For production environments, implement the following security measures:

### 1. Firebase App Check (Recommended)

Firebase App Check helps protect your backend resources from abuse by blocking traffic from unauthorized clients.

**Setup:**
```javascript
// In src/lib/firebase.js
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

**Benefits:**
- Verifies requests come from your registered app
- Protects against abuse and bot traffic
- Works with ESP32 (requires custom token generation)

### 2. API Key Validation

Add API key validation to your API routes:

```javascript
// Example: src/app/api/users/route.js
export async function GET(request) {
  const apiKey = request.headers.get('x-api-key');
  
  if (apiKey !== process.env.API_SECRET_KEY) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // ... rest of your code
}
```

**ESP32 Configuration:**
```cpp
http.addHeader("x-api-key", "your-secret-key");
```

### 3. IP Allowlisting

Configure Firebase security rules or Vercel firewall to allow requests only from:
- Your ESP32 devices (if they have static IPs)
- Admin dashboard (trusted networks)

**Vercel Firewall:**
- Available on Pro plan and above
- Configure in Vercel Dashboard → Project Settings → Firewall

### 4. Firebase Authentication

Implement Firebase Authentication for the admin dashboard:

```javascript
// src/lib/firebase.js
import { signInWithEmailAndPassword } from 'firebase/auth';

// Login function
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
```

**Update Firebase Rules:**
```javascript
// firestore.rules
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
               get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
}
```

### 5. Rate Limiting

Implement rate limiting to prevent abuse:

**Option 1: Vercel Edge Config (Pro plan)**
```javascript
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request) {
  const identifier = request.ip ?? '127.0.0.1';
  const { success } = await rateLimit(identifier);
  
  if (!success) {
    return NextResponse.json(
      { success: false, message: 'Too many requests' },
      { status: 429 }
    );
  }
  // ... rest of your code
}
```

**Option 2: Upstash Redis**
```bash
npm install @upstash/ratelimit @upstash/redis
```

### 6. Environment Variables

**Critical**: Never commit sensitive credentials to Git.

- ✅ Use `.env.local` for local development
- ✅ Use Vercel environment variables for production
- ✅ Rotate Firebase service account keys regularly
- ✅ Use different Firebase projects for dev/staging/prod

### 7. HTTPS Only

**Vercel**: Automatically enforces HTTPS
**ESP32**: Always use `https://` URLs

```cpp
// Correct
const char* serverUrl = "https://dgen-access-control.vercel.app/verify";

// Wrong - insecure!
const char* serverUrl = "http://dgen-access-control.vercel.app/verify";
```

### 8. Content Security Policy

Add CSP headers in `next.config.js`:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ];
  }
};
```

### 9. Audit Logging

Log all security-relevant events:

```javascript
// Log to separate audit collection
await db.collection('audit_logs').add({
  action: 'user_deleted',
  userId: deletedUserId,
  performedBy: adminId,
  ip: request.ip,
  timestamp: new Date().toISOString()
});
```

### 10. Regular Security Reviews

- Review Firebase security rules monthly
- Monitor Firebase Console for unusual activity
- Check Vercel logs for suspicious patterns
- Update dependencies regularly: `npm audit`
- Review API access patterns

## Security Checklist for Production

Before deploying to production:

- [ ] Firebase App Check is enabled
- [ ] API key validation is implemented
- [ ] Firebase Authentication is configured for admin dashboard
- [ ] Rate limiting is in place
- [ ] Environment variables are stored securely (not in code)
- [ ] HTTPS is enforced everywhere
- [ ] Content Security Policy headers are set
- [ ] Firebase security rules are reviewed and tightened
- [ ] Audit logging is enabled
- [ ] Different Firebase projects for dev/prod
- [ ] Service account keys are rotated
- [ ] Budget alerts are configured in Firebase
- [ ] Monitoring and alerting are set up

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email the maintainers directly
3. Provide detailed information about the vulnerability
4. Allow time for a fix before public disclosure

## Known Limitations

1. **No built-in authentication**: Users must implement their own auth layer
2. **Permissive Firebase rules by default**: Intentional for ESP32 integration
3. **No rate limiting by default**: Must be implemented separately
4. **No IP restrictions by default**: Must be configured in Firebase/Vercel

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Security Updates

This project follows semantic versioning. Security updates will be released as:
- **Patch versions** (e.g., 3.0.1) for minor security fixes
- **Minor versions** (e.g., 3.1.0) for security features
- **Major versions** (e.g., 4.0.0) for breaking security changes

Subscribe to GitHub releases to stay updated.

---

**Remember**: Security is a process, not a product. Regularly review and update your security measures as your application grows and threat landscape evolves.
