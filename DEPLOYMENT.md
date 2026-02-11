# Deployment Guide

Complete guide for deploying DGEN Access Control System to production.

## Vercel Deployment (Recommended)

Vercel is the recommended platform as Next.js is built by Vercel and provides the best performance.

### Prerequisites

- Completed local setup (see [QUICKSTART.md](QUICKSTART.md))
- Firebase project configured with rules deployed
- Vercel account ([vercel.com](https://vercel.com))

### Method 1: Vercel CLI (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy

```bash
# First deployment
vercel

# Follow the prompts:
# ? Set up and deploy "DGEN-ACESS"? [Y/n] y
# ? Which scope do you want to deploy to? [Select your account]
# ? Link to existing project? [N/y] n
# ? What's your project's name? dgen-access
# ? In which directory is your code located? ./
```

#### 4. Configure Environment Variables

You can add environment variables during deployment or via the Vercel dashboard:

**Via CLI:**
```bash
vercel env add FIREBASE_PROJECT_ID
# Enter value: your-project-id

vercel env add FIREBASE_CLIENT_EMAIL
# Enter value: firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

vercel env add FIREBASE_PRIVATE_KEY
# Enter value: "-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"

vercel env add FIREBASE_DATABASE_URL
# Enter value: https://your-project-default-rtdb.firebaseio.com
```

**Via Dashboard:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (paste the entire key with quotes)
   - `FIREBASE_DATABASE_URL`
5. Select all environments (Production, Preview, Development)

#### 5. Deploy to Production

```bash
vercel --prod
```

Your app will be live at: `https://your-project.vercel.app`

### Method 2: GitHub Integration

#### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### 3. Add Environment Variables

In the import flow, add all environment variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_DATABASE_URL`

#### 4. Deploy

Click "Deploy" and wait for the build to complete.

### Method 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MrTG1B/DGEN-ACESS)

After clicking the button:
1. Fork/clone the repository to your account
2. Add environment variables when prompted
3. Deploy!

## Post-Deployment

### 1. Verify Deployment

Visit your deployed URL and check:
- ✓ Dashboard loads without errors
- ✓ API endpoints respond correctly
- ✓ Firebase connection is active
- ✓ 4 default super admin users are created

### 2. Configure ESP32

Update your ESP32 code with the production URL:

```cpp
const char* serverUrl = "https://your-project.vercel.app/api/verify";
```

### 3. Set Up Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate to be issued

## Alternative: Firebase Hosting

If you prefer Firebase Hosting, you can deploy there too.

### 1. Build for Static Export

Edit `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

### 2. Build

```bash
npm run build
```

### 3. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

**Note:** Firebase Hosting requires static export, which means:
- API routes won't work (need to move to Cloud Functions)
- Server-side rendering is disabled
- Not recommended for this project

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | `dgen-access` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | `firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Service account private key | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |
| `FIREBASE_DATABASE_URL` | Realtime Database URL | `https://project-default-rtdb.firebaseio.com` |

## Security Checklist

Before going to production:

- [ ] Environment variables are set in Vercel (not in code)
- [ ] `.env.local` is in `.gitignore` and not committed
- [ ] Firebase security rules are deployed
- [ ] Firebase service account key is secure
- [ ] Firebase App Check is enabled (optional but recommended)
- [ ] Custom domain has HTTPS enabled
- [ ] CORS is configured properly if needed
- [ ] Rate limiting is considered for API routes

## Monitoring & Maintenance

### Vercel Analytics

Enable analytics in Vercel dashboard to monitor:
- Page views
- API response times
- Error rates

### Firebase Console

Monitor in Firebase Console:
- Database usage
- API calls
- Security rule violations
- User activity

### Logs

View logs in Vercel:
```bash
vercel logs [deployment-url]
```

Or in Vercel Dashboard → Your Project → Deployments → [Select deployment] → Logs

## Troubleshooting

### Build Fails

**Check:**
1. All dependencies are in `package.json`
2. Node version is compatible (18+)
3. Environment variables are set correctly

### API Returns 500 Errors in Production

**Check:**
1. Environment variables are set in Vercel
2. Firebase project ID matches
3. Private key includes `\n` characters
4. Database URL is correct

### Firebase Connection Fails

**Check:**
1. Service account has proper permissions
2. Firestore and Realtime Database are enabled
3. Security rules are deployed
4. Project ID matches between `.env` and Firebase Console

## Rolling Back

If something goes wrong:

```bash
# List deployments
vercel ls

# Roll back to previous deployment
vercel rollback [deployment-url]
```

Or use the Vercel dashboard to promote a previous deployment.

## Cost Optimization

### Vercel (Hobby Plan - Free)

- 100 GB bandwidth/month
- Unlimited API requests
- 100 GB-hours serverless function execution
- Usually sufficient for small to medium projects

### Vercel (Pro Plan - $20/month)

- 1 TB bandwidth/month
- Unlimited API requests
- 1000 GB-hours serverless function execution
- Custom domains with SSL
- Priority support

### Firebase (Spark Plan - Free)

- 1 GB storage
- 10 GB/month bandwidth
- 20K/day document reads
- 20K/day document writes
- Usually sufficient for testing and small projects

### Firebase (Blaze Plan - Pay as you go)

- Free tier included
- Pay only for what you use beyond free tier
- Set budget alerts to avoid surprises

## Support

- **Vercel Support:** [vercel.com/support](https://vercel.com/support)
- **Firebase Support:** [firebase.google.com/support](https://firebase.google.com/support)
- **GitHub Issues:** [github.com/MrTG1B/DGEN-ACESS/issues](https://github.com/MrTG1B/DGEN-ACESS/issues)

---

**Next Steps:**
1. Deploy to Vercel: `vercel --prod`
2. Configure ESP32 with production URL
3. Monitor deployment in Vercel dashboard
