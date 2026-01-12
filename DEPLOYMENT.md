# Deployment Guide

## Current Status
✅ **Build**: Complete  
✅ **Git**: Repository initialized and committed  
✅ **Testing**: Smoke tests passing (150+ live options)  
✅ **Backend**: Netlify Functions ready  
✅ **Frontend**: React app built and optimized

## Deploy to Netlify (5 minutes)

### Step 1: Create GitHub Repository

```bash
# Initialize git remote (choose one)
git remote add origin https://github.com/YOUR-USERNAME/spy-options-analyzer
# OR use GitHub CLI:
gh repo create spy-options-analyzer --public --source=. --remote=origin --push
```

### Step 2: Push to GitHub

```bash
git branch -M main
git push -u origin main
```

### Step 3: Connect to Netlify

1. Go to https://app.netlify.com
2. Click **"Add new site" → "Import an existing project"**
3. Select **GitHub** as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select the **spy-options-analyzer** repository
6. Configure build settings:
   - **Base directory**: (leave empty)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
7. Click **"Deploy site"**

Netlify will automatically:
- ✅ Run `npm run build` on each push
- ✅ Deploy your frontend to CDN
- ✅ Deploy Netlify Functions from `/netlify/functions/`
- ✅ Enable HTTPS
- ✅ Set up auto-deployments on git push

### Step 4: Test Live Deployment

After deployment completes (~2 minutes):

```bash
# Visit your site at: https://YOUR-SITE-NAME.netlify.app

# Test the API endpoint directly:
# https://YOUR-SITE-NAME.netlify.app/.netlify/functions/fetchData

# Bypass cache and get fresh data:
# https://YOUR-SITE-NAME.netlify.app/.netlify/functions/fetchData?force=1
```

## Verify Deployment

### Frontend
- [ ] Site loads at `https://YOUR-SITE.netlify.app`
- [ ] No build errors in Netlify logs
- [ ] Page displays "Loading..." then table with options
- [ ] Pagination works (click Next/Prev)
- [ ] Sorting works (click column headers)
- [ ] Filters work (adjust delta range, IV %, etc)
- [ ] Chart displays 60-day SPY price

### Backend API
- [ ] API responds: `https://YOUR-SITE.netlify.app/.netlify/functions/fetchData`
- [ ] Response includes 150+ options with greeks
- [ ] Cache working: Check "source": "cache" in response
- [ ] Force refresh: `?force=1` returns "source": "live"

## Environment Variables (Optional)

If you want to customize behavior, add to Netlify:

1. Go to **Site settings → Build & deploy → Environment**
2. Add any of these (optional):

```
LOG_LEVEL=info              # Logging verbosity
CACHE_TTL_HOURS=12          # How long to cache (default: 12)
RISK_FREE_RATE=0.05         # For Black-Scholes (default: 5%)
```

## Monitoring

### Netlify Dashboard
- **Deployments** tab: View all deployments and logs
- **Functions** tab: Monitor function execution and errors
- **Analytics** tab: Traffic and performance metrics

### GitHub Actions (Auto-Deploy)
Netlify automatically deploys on:
- ✅ Push to `main` branch
- ✅ Pull requests (preview deploys)
- ✅ Manual redeploys from Netlify UI

## Rollback

To revert to a previous version:

1. Go to **Deployments** in Netlify dashboard
2. Find the deployment you want to restore
3. Click **"Restore this deploy"**

Or rollback via git:
```bash
git revert <commit-hash>
git push origin main
```

## Custom Domain (Optional)

1. Go to **Site settings → Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `spy-analyzer.com`)
4. Add DNS records as instructed by Netlify
5. Enable HTTPS (automatic via Let's Encrypt)

## Performance Optimization

Your deployment includes:
- 📦 Code splitting & tree-shaking (Vite)
- 🗜️ Gzip compression (enabled by default)
- 🚀 CDN distribution (Netlify edge)
- ⚡ Serverless functions (auto-scaling)
- 💾 12-hour cache (minimizes API calls)

**Metrics:**
- Frontend bundle: 363 KB → 124 KB gzipped
- API response: ~500ms (cached: <50ms)
- Page load: ~1-2 seconds on 4G

## Troubleshooting

### Build Fails on Netlify
- Check build logs: **Deployments → Failed build → View logs**
- Common issues:
  - Missing environment variables
  - Wrong Node version (need 18+)
  - Cached dependencies (clear cache and redeploy)

**Fix:**
```bash
# Clear Netlify cache
# In Netlify UI: Site settings → Build & deploy → Triggers → Clear cache and redeploy
```

### API Returns 500 Error
- Check Netlify Functions logs
- Ensure Yahoo Finance API is accessible from Netlify
- Try `?force=1` to bypass cache
- Check function has enough memory/time

### No Data Shows in Frontend
- Open DevTools (F12) → Network tab
- Check `fetchData` request response
- Check Console for errors
- Verify API returns valid JSON

### Site Returns 404
- Ensure "Publish directory" is set to `dist`
- Check that `npm run build` completes successfully
- Verify `index.html` exists in `dist/`

## Support Resources

- **Netlify Docs**: https://docs.netlify.com
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev
- **Yahoo Finance API**: https://github.com/gadicc/yahoo-finance2

## Summary

```
Your site is now live! 🚀

Frontend: https://YOUR-SITE.netlify.app
API: https://YOUR-SITE.netlify.app/.netlify/functions/fetchData
```

Next steps:
1. ✅ Push to GitHub
2. ✅ Connect to Netlify
3. ✅ Wait for deployment (~2-3 min)
4. ✅ Test at your live URL
5. ✅ Share with others!
