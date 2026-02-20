# TypeScript Types Strategy

## Current Issue
The `as any` casts are needed because Supabase's TypeScript client has limitations with:
1. Nested `.select()` queries with joins
2. Dynamic insert/update operations
3. Complex query chains

## Better Solutions

### Option 1: Generate Types from Supabase (Recommended)
Run this command to auto-generate types from your live database:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > database-types-generated.ts
```

Or from local Supabase:
```bash
npx supabase gen types typescript --local > database-types-generated.ts
```

This generates accurate types that match your actual schema.

### Option 2: Use Type Helpers for Nested Queries
Instead of `as any`, create type helpers:

```typescript
// lib/supabase/types-helpers.ts
import type { Database } from '@/database-types'

type Tables = Database['public']['Tables']

// Helper for nested selects
export type EventCourtWithCourt = Tables['event_courts']['Row'] & {
  court: Tables['courts']['Row']
}

export type EventPlayerWithPlayer = Tables['event_players']['Row'] & {
  player: Tables['players']['Row']
}

export type MatchWithRelations = Tables['matches']['Row'] & {
  court: Tables['courts']['Row']
  match_players: Array<
    Tables['match_players']['Row'] & {
      player: Tables['players']['Row']
    }
  >
}
```

Then use them:
```typescript
const { data } = await supabase
  .from('event_courts')
  .select('*, court:courts(*)')
  .eq('event_id', eventId)

const typedData = data as EventCourtWithCourt[]
```

### Option 3: Use Supabase's Database Type Parameter
For inserts/updates, use the Database type properly:

```typescript
import type { Database } from '@/database-types'

type EventInsert = Database['public']['Tables']['events']['Insert']
type EventUpdate = Database['public']['Tables']['events']['Update']

// Then use them
const insertData: EventInsert = {
  name,
  event_date,
  // ... TypeScript will validate this
}

const { data } = await supabase
  .from('events')
  .insert(insertData)
```

## Recommended Approach

The `as any` casts are actually a pragmatic solution for Supabase's TypeScript limitations. Here's the better pattern:

### Use `as unknown as Type` instead of `as any`

This provides a middle ground - you acknowledge the type system limitation but still get type safety on the result:

```typescript
// Instead of: as any
const { data } = await supabase
  .from('event_courts')
  .select('*, court:courts(*)')
  .eq('event_id', eventId)

const typedData = data as unknown as EventCourtWithCourt[]
```

This is better than `as any` because:
1. It's a two-step cast (more explicit about the type override)
2. You still get type checking on `typedData` usage
3. It's the pattern recommended by Supabase community

### For Insert/Update Operations

Use `as any` only on the insert/update call, not the whole chain:

```typescript
const insertData: EventCourtInsert[] = [...]

await supabase
  .from('event_courts')
  .insert(insertData as any) // Only cast here
```

## Current Status

The `as any` casts in the codebase are acceptable for now because:
1. Supabase's TypeScript support for nested queries is limited
2. The Database type definitions are manually maintained
3. Runtime validation happens at the database level
4. The app works correctly despite the type casts

## Future Improvement

When you have time, run:
```bash
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

Then gradually replace `as any` with `as unknown as SpecificType` using the helper types in `lib/supabase/query-types.ts`.

## Files to Update

After generating proper types, update these files:
- `app/api/events/[id]/courts/route.ts`
- `app/api/events/[id]/players/route.ts`
- `app/api/events/[id]/matches/route.ts`
- `app/api/events/[id]/generate-matches/route.ts`
- `app/api/events/route.ts`
- `app/api/events/[id]/route.ts`

## Why `as any` Was Used

The `as any` casts were a quick fix for deployment because:
1. Supabase's generated types don't handle nested selects well
2. Dynamic JSON bodies in POST/PATCH requests
3. Time constraint to get the app deployed

For production, follow the recommended approach above for better type safety.
