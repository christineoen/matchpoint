# Quick Deploy to Vercel

## 1. Install Vercel CLI (Optional - can also use web interface)

```bash
npm i -g vercel
```

## 2. Deploy via CLI (Fastest)

```bash
# Login to Vercel
vercel login

# Deploy (will prompt for project settings)
vercel

# Or deploy to production directly
vercel --prod
```

## 3. Or Deploy via Web (Easiest)

1. **Push to GitHub first:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to Vercel:**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repo
   - Vercel auto-detects Next.js
   - Click "Deploy"

3. **Add Environment Variables:**
   - In Vercel dashboard → Settings → Environment Variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Redeploy

## Your Environment Variables

Copy these from your `.env.local` file:

```bash
# Get your values
cat .env.local
```

Then add them to Vercel dashboard.

## That's It!

Your app will be live at: `https://your-project-name.vercel.app`

Every time you push to GitHub, Vercel will automatically redeploy.

## Pro Tips

- **Custom Domain:** Add in Vercel dashboard → Domains
- **Preview Deployments:** Every branch gets its own URL
- **Instant Rollbacks:** Revert to any previous deployment with one click
- **Analytics:** Free analytics included in dashboard

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Supabase + Vercel: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
