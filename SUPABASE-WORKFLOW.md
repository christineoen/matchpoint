# Supabase CLI Workflow

## Setup (Already Done ✅)
```bash
npx supabase init          # Creates supabase/ folder
npx supabase link          # Links to remote project
```

## Current Status
- Project ID: `zaakruuzerscmnkmttsv`
- Linked: ✅
- Migration folder: `supabase/migrations/`

## Workflow for Database Changes

### 1. Reset Remote Database (Do this now to fix RLS)
```bash
# This will drop everything and reapply migrations
npx supabase db reset --linked
```

### 2. Create New Migration
```bash
npx supabase migration new <description>
# Example: npx supabase migration new add_player_stats
```

This creates: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`

### 3. Edit Migration File
Edit the generated SQL file in `supabase/migrations/`

### 4. Apply Migration to Remote
```bash
npx supabase db push
```

### 5. Pull Remote Changes (if someone else made changes)
```bash
npx supabase db pull
```

## Common Commands

```bash
# View migration status
npx supabase migration list

# Generate TypeScript types from database
npx supabase gen types typescript --linked > database-types.ts

# View database diff
npx supabase db diff

# Start local Supabase (optional - for local dev)
npx supabase start

# Stop local Supabase
npx supabase stop
```

## Current Migrations

1. `20260220000000_initial_schema.sql` - Initial database schema with fixed RLS policies

## Next Steps

1. Run `npx supabase db reset --linked` to apply the fixed migration
2. Test "Start New Session" button
3. Going forward, use `npx supabase migration new` for all changes
4. Commit migration files to git

## Troubleshooting

### "Migration history doesn't match"
```bash
npx supabase db reset --linked
```

### "Permission denied"
Check your `.env.local` has correct keys

### "Can't connect to remote"
```bash
npx supabase link --project-ref zaakruuzerscmnkmttsv
```
