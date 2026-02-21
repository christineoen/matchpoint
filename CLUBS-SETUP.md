# Clubs/Organizations Setup

## 1. Run the Migration

```bash
npx supabase db push
```

## 2. Seed Sample Clubs

```bash
npx supabase db execute --file supabase/seed.sql
```

Or manually insert clubs in the Supabase dashboard:
1. Go to **Table Editor** → **clubs**
2. Click **Insert row**
3. Add club name, description, and location

## 3. How It Works

### User Signup
- Users select a club when signing up
- They're automatically added as a "member" of that club
- The club is set as their default club

### Data Filtering
- Users only see players from their clubs
- Users only see events from their clubs
- Events are automatically associated with the user's club

### Roles
- **member**: Can view events and players
- **organizer**: Can create events
- **admin**: Can manage club settings and members

## 4. Update Existing Data

If you have existing players/events without clubs, you can assign them:

```sql
-- Assign all existing players to a club
UPDATE players 
SET club_id = 'YOUR_CLUB_ID' 
WHERE club_id IS NULL;

-- Assign all existing events to a club
UPDATE events 
SET club_id = 'YOUR_CLUB_ID' 
WHERE club_id IS NULL;
```

## 5. Multi-Club Support

Users can be members of multiple clubs:
- The `club_members` table tracks all memberships
- The `default_club_id` in profiles is used for new events
- Future: Add club switcher in UI

## Next Steps

- Add club switcher to header
- Allow users to join multiple clubs
- Add club admin dashboard
- Import players with club assignment
