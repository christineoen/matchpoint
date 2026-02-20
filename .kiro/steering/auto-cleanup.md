---
inclusion: auto
---

# Automatic Code Cleanup

When making changes to this codebase, automatically look for cleanup opportunities:

## After Consolidating Features
- Delete old page files when functionality moves to a consolidated interface
- Remove unused route handlers if endpoints are no longer needed
- Clean up duplicate implementations

## During Refactoring
- Remove unused imports after moving code
- Delete functions that have been replaced
- Remove type casts that are no longer needed after proper typing

## Current Project Structure
- Main event interface: `app/events/[id]/page.tsx` (tabbed interface)
- API routes in `app/api/` are still active and used
- Utility functions in `lib/utils/` and `lib/match-generation/`
- Database migrations in `supabase/migrations/` (NEVER delete these)

## Active API Routes (All Used)
- `/api/events` - GET (list), POST (create)
- `/api/events/[id]` - GET (fetch), PATCH (update - future), DELETE (delete - future)
- `/api/events/[id]/courts` - GET, POST
- `/api/events/[id]/players` - GET, POST
- `/api/events/[id]/matches` - GET
- `/api/events/[id]/generate-matches` - POST
- `/api/courts` - GET
- `/api/players` - GET

## Files That Were Cleaned Up
- ✅ Removed `app/events/[id]/courts/page.tsx` (consolidated into tabs)
- ✅ Removed `app/events/[id]/players/page.tsx` (consolidated into tabs)
- ✅ Removed `app/events/[id]/matches/page.tsx` (consolidated into tabs)
- ⚠️ Empty folders remain: `app/events/[id]/courts/`, `app/events/[id]/matches/`, `app/events/[id]/players/`, `app/events/new/` (can be manually deleted)

## Current Clean Structure
```
app/events/
  ├── [id]/
  │   └── page.tsx (main tabbed interface)
  └── page.tsx (events list)
```

## Future Cleanup Candidates
- `lib/utils/sit-off-utils.ts` - Created but not yet integrated (keep for now)
- TODOs in `lib/match-generation/index.ts` and `app/api/events/[id]/generate-matches/route.ts`

## Always Keep
- All files in `supabase/migrations/` (historical record)
- All API routes in `app/api/` (actively used)
- Configuration files (package.json, tsconfig.json, etc.)
- Documentation files (*.md)
