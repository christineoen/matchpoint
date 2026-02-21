# Supabase Migration Workflow

## When making database changes:

1. **Always create a migration file** in `supabase/migrations/` with format:
   - `YYYYMMDD######_description.sql`
   - Example: `20260221000001_fix_club_members_rls.sql`

2. **Apply migrations** using one of these methods:
   - **With Supabase CLI**: `npx supabase db push`
   - **Without CLI**: Copy SQL to Supabase Dashboard → SQL Editor → Run

3. **After applying**, regenerate types:
   ```bash
   npx supabase gen types typescript --linked > database-types.ts
   ```

4. **Commit migration files** to git for version control

## Migration file structure:

```sql
-- Clear description of what this migration does

-- Drop old policies/tables if needed
DROP POLICY IF EXISTS "policy_name" ON table_name;

-- Create new structures
CREATE TABLE ...
CREATE POLICY ...
ALTER TABLE ...
```

## Common issues:

- **Infinite recursion in RLS**: Policy references the same table it's protecting
  - Fix: Use subqueries or simpler conditions
  
- **Permission denied**: RLS blocking legitimate operations
  - Fix: Add service role policy or adjust WITH CHECK conditions

- **Migration conflicts**: Multiple migrations with same timestamp
  - Fix: Increment the number suffix (000001, 000002, etc.)

## This project's setup:

- Project ID: `zaakruuzerscmnkmttsv`
- Migrations folder: `supabase/migrations/`
- Types file: `database-types.ts`
- Service role key: In `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`
