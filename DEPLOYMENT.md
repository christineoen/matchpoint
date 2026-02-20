# Deployment Guide

## Deploy to Vercel (Recommended)

Vercel is the best choice for Next.js apps - it's made by the Next.js team and has zero-config deployment.

### Prerequisites
- GitHub account
- Vercel account (free tier is fine)
- Your Supabase project already set up

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Tennis Match Maker"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/matchpoint.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click "Deploy"

That's it! Vercel will:
- Build your app
- Deploy it to a URL like `matchpoint.vercel.app`
- Auto-deploy on every git push
- Provide preview deployments for branches

### Step 3: Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Settings → Domains
3. Add your custom domain
4. Follow DNS instructions

## Alternative: Deploy to Netlify

If you prefer Netlify:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

Add the same environment variables in Netlify dashboard.

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Post-Deployment Checklist

- [ ] Test event creation
- [ ] Test court selection
- [ ] Test player management
- [ ] Test match generation
- [ ] Verify Supabase connection
- [ ] Check all API routes work
- [ ] Test on mobile devices

## Continuous Deployment

Once connected to GitHub:
- Push to `main` branch → Auto-deploys to production
- Push to other branches → Creates preview deployments
- Pull requests → Get unique preview URLs

## Monitoring

Vercel provides:
- Real-time logs
- Analytics
- Performance metrics
- Error tracking

Access these in your Vercel dashboard.

## Troubleshooting

### Build fails
- Check `npm run build` works locally
- Verify all dependencies in package.json
- Check TypeScript errors with `npm run type-check`

### Environment variables not working
- Make sure they start with `NEXT_PUBLIC_`
- Redeploy after adding variables
- Check they're set in Vercel dashboard

### Supabase connection fails
- Verify URLs and keys are correct
- Check Supabase project is not paused
- Ensure RLS policies allow access

## Cost

**Vercel Free Tier includes:**
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- Preview deployments
- Analytics

**Supabase Free Tier includes:**
- 500MB database
- 1GB file storage
- 50,000 monthly active users
- Unlimited API requests

Both free tiers are more than enough for a tennis club app!
