# Setup Guide

## Step-by-Step Setup

### 1. Install Node.js Dependencies

```bash
npm install
```

This will install:
- Next.js 15
- React 19
- Supabase client
- TypeScript
- Tailwind CSS

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and project name
4. Set a strong database password
5. Select region closest to you
6. Wait for project to be created (~2 minutes)

### 3. Get Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys" - keep this secret!)

### 4. Configure Environment Variables

Create `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **Important**: Never commit `.env.local` to git!

### 5. Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Open `supabase-migration.sql` from this project
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click "Run" or press Cmd/Ctrl + Enter

You should see: "Success. No rows returned"

This creates:
- ✅ 10 tables (profiles, players, events, courts, matches, etc.)
- ✅ All indexes for performance
- ✅ Row Level Security policies
- ✅ Sample court data (Courts 1-6, H1-H4)
- ✅ Helper views and functions

### 6. Verify Database Setup

In Supabase dashboard:

1. Go to **Table Editor**
2. You should see these tables:
   - profiles
   - players
   - events
   - courts
   - event_courts
   - event_players
   - matches
   - match_players
   - player_history
   - sit_outs

3. Click on **courts** table
4. You should see 10 courts pre-populated:
   - Courts 1-6 (grass)
   - Courts H1-H4 (hard)

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the Tennis Match Maker home page!

## Troubleshooting

### "Missing Supabase environment variables"

- Check that `.env.local` exists
- Verify all three variables are set
- Restart the dev server after adding env vars

### Migration fails

- Make sure you copied the entire SQL file
- Check for any error messages in Supabase
- Try running sections of the migration separately

### TypeScript errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use

```bash
# Use a different port
npm run dev -- -p 3001
```

## Next Steps

Once setup is complete:

1. ✅ Test the home page loads
2. ✅ Check Supabase connection (we'll add a test page)
3. 🚧 Build court selection UI
4. 🚧 Build player registration UI
5. 🚧 Implement match generation

## Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Type checking
npx tsc --noEmit     # Check TypeScript types

# Database
# (Run these in Supabase SQL Editor)
SELECT * FROM courts;                    # View all courts
SELECT * FROM players;                   # View all players
SELECT * FROM events ORDER BY event_date DESC;  # View events
```

## Project Status

- ✅ Database schema designed
- ✅ Core logic refactored and modularized
- ✅ Next.js project structure created
- ✅ Supabase client configured
- ✅ TypeScript types defined
- 🚧 UI components (next phase)
- 🚧 API routes (next phase)
- 🚧 Authentication (next phase)

## Getting Help

If you run into issues:

1. Check this guide first
2. Review error messages carefully
3. Check Supabase logs (Dashboard → Logs)
4. Verify environment variables
5. Try restarting the dev server

Contact: Paul Oen 0438 374 643
