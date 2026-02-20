# Tennis Match-Making App - Database Schema Design

## Overview
This schema is designed for a Next.js + TypeScript + Supabase (Postgres + Auth) tennis match-making application. The design supports social tennis events with multiple sets, court management, player tracking, and match generation.

---

## Tables

### 1. `users` (Supabase Auth)
Managed by Supabase Auth - references via `auth.users`

**Purpose**: Authentication and basic user identity

---

### 2. `profiles`
**Purpose**: Extended user profile information linked to Supabase Auth

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY` | References `auth.users.id` |
| `email` | `text` | `UNIQUE NOT NULL` | User email |
| `full_name` | `text` | | User's full name |
| `role` | `text` | `DEFAULT 'member'` | Role: 'admin', 'organizer', 'member' |
| `created_at` | `timestamptz` | `DEFAULT now()` | Account creation timestamp |
| `updated_at` | `timestamptz` | `DEFAULT now()` | Last update timestamp |

**Indexes**:
- `idx_profiles_email` on `email`

**RLS Policies**:
- Users can read their own profile
- Admins can read all profiles
- Users can update their own profile

---

### 3. `players`
**Purpose**: Tennis player master list with skill ratings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique player ID |
| `user_id` | `uuid` | `REFERENCES profiles(id)` | Optional link to user account |
| `name` | `text` | `NOT NULL` | Player full name |
| `grade` | `smallint` | `NOT NULL CHECK (grade BETWEEN 1 AND 5)` | Skill grade: 1=3A, 2=3, 3=2B, 4=2A, 5=2 |
| `gender` | `char(1)` | `NOT NULL CHECK (gender IN ('M', 'F'))` | Gender: M or F |
| `nhc` | `boolean` | `DEFAULT false` | No Hard Court preference |
| `plus_minus` | `char(1)` | `CHECK (plus_minus IN ('+', '-', NULL))` | Grade modifier |
| `is_active` | `boolean` | `DEFAULT true` | Active player status |
| `created_at` | `timestamptz` | `DEFAULT now()` | Record creation |
| `updated_at` | `timestamptz` | `DEFAULT now()` | Last update |

**Indexes**:
- `idx_players_name` on `name`
- `idx_players_grade_gender` on `(grade, gender)`
- `idx_players_user_id` on `user_id`

**Notes**:
- Grade mapping: 5=Grade 2, 4=Grade 2A, 3=Grade 2B, 2=Grade 3, 1=Grade 3A
- Players can exist without user accounts (for guest players)

---

### 4. `events`
**Purpose**: Tennis social events/sessions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique event ID |
| `name` | `text` | `NOT NULL` | Event name |
| `event_date` | `date` | `NOT NULL` | Date of event |
| `start_time` | `time` | | Start time |
| `end_time` | `time` | | End time |
| `location` | `text` | | Venue/location |
| `organizer_id` | `uuid` | `REFERENCES profiles(id)` | Event organizer |
| `status` | `text` | `DEFAULT 'draft'` | Status: 'draft', 'active', 'completed', 'cancelled' |
| `total_sets` | `smallint` | `DEFAULT 6` | Total number of sets planned |
| `created_at` | `timestamptz` | `DEFAULT now()` | Record creation |
| `updated_at` | `timestamptz` | `DEFAULT now()` | Last update |

**Indexes**:
- `idx_events_date` on `event_date DESC`
- `idx_events_organizer` on `organizer_id`
- `idx_events_status` on `status`

---

### 5. `courts`
**Purpose**: Tennis court definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique court ID |
| `name` | `text` | `NOT NULL` | Court identifier (e.g., "1", "2", "H1", "H2") |
| `surface_type` | `text` | `NOT NULL CHECK (surface_type IN ('grass', 'hard'))` | Court surface |
| `is_active` | `boolean` | `DEFAULT true` | Court availability |
| `display_order` | `smallint` | | Display/selection order |
| `created_at` | `timestamptz` | `DEFAULT now()` | Record creation |

**Indexes**:
- `idx_courts_name` on `name`
- `idx_courts_display_order` on `display_order`

**Notes**:
- Courts prefixed with "H" are hard courts, others are grass

---

### 6. `event_courts`
**Purpose**: Courts available for a specific event

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique record ID |
| `event_id` | `uuid` | `NOT NULL REFERENCES events(id) ON DELETE CASCADE` | Event reference |
| `court_id` | `uuid` | `NOT NULL REFERENCES courts(id)` | Court reference |
| `selection_order` | `smallint` | `NOT NULL` | Order courts were selected |
| `is_available` | `boolean` | `DEFAULT true` | Court availability for event |

**Indexes**:
- `idx_event_courts_event` on `event_id`
- `idx_event_courts_order` on `(event_id, selection_order)`

**Constraints**:
- `UNIQUE (event_id, court_id)` - Each court once per event

---

### 7. `event_players`
**Purpose**: Players registered for an event with their status

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique record ID |
| `event_id` | `uuid` | `NOT NULL REFERENCES events(id) ON DELETE CASCADE` | Event reference |
| `player_id` | `uuid` | `NOT NULL REFERENCES players(id)` | Player reference |
| `arrival_order` | `smallint` | | Order player registered/arrived |
| `is_resting` | `boolean` | `DEFAULT false` | Player taking a break |
| `unavailable_sets` | `jsonb` | `DEFAULT '{}'` | Sets player is unavailable: {"set1": true, "set2": false, ...} |
| `created_at` | `timestamptz` | `DEFAULT now()` | Registration time |

**Indexes**:
- `idx_event_players_event` on `event_id`
- `idx_event_players_player` on `player_id`
- `idx_event_players_arrival` on `(event_id, arrival_order)`

**Constraints**:
- `UNIQUE (event_id, player_id)` - Each player once per event

---

### 8. `matches`
**Purpose**: Generated tennis matches

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique match ID |
| `event_id` | `uuid` | `NOT NULL REFERENCES events(id) ON DELETE CASCADE` | Event reference |
| `court_id` | `uuid` | `NOT NULL REFERENCES courts(id)` | Court assignment |
| `set_number` | `smallint` | `NOT NULL CHECK (set_number BETWEEN 1 AND 6)` | Set number (1-6) |
| `format` | `text` | `NOT NULL` | Match format: 'Same-Sex', 'Mixed' |
| `is_manual` | `boolean` | `DEFAULT false` | Manually created match |
| `match_order` | `smallint` | | Display order within set |
| `notes` | `text` | | Additional notes (e.g., "Perfect 16 Set 3") |
| `created_at` | `timestamptz` | `DEFAULT now()` | Match creation time |

**Indexes**:
- `idx_matches_event` on `event_id`
- `idx_matches_event_set` on `(event_id, set_number)`
- `idx_matches_court` on `court_id`

---

### 9. `match_players`
**Purpose**: Players assigned to matches with team information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique record ID |
| `match_id` | `uuid` | `NOT NULL REFERENCES matches(id) ON DELETE CASCADE` | Match reference |
| `player_id` | `uuid` | `NOT NULL REFERENCES players(id)` | Player reference |
| `team` | `smallint` | `NOT NULL CHECK (team IN (1, 2))` | Team number: 1 or 2 |
| `position` | `smallint` | `CHECK (position IN (1, 2))` | Position within team |

**Indexes**:
- `idx_match_players_match` on `match_id`
- `idx_match_players_player` on `player_id`

**Constraints**:
- `UNIQUE (match_id, player_id)` - Each player once per match
- `UNIQUE (match_id, team, position)` - Each position filled once

---

### 10. `player_history`
**Purpose**: Track player partnerships and opponents across events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique record ID |
| `event_id` | `uuid` | `NOT NULL REFERENCES events(id) ON DELETE CASCADE` | Event reference |
| `player_id` | `uuid` | `NOT NULL REFERENCES players(id)` | Primary player |
| `other_player_id` | `uuid` | `NOT NULL REFERENCES players(id)` | Partner or opponent |
| `relationship_type` | `text` | `NOT NULL CHECK (relationship_type IN ('partner', 'opponent'))` | Relationship type |
| `set_number` | `smallint` | `NOT NULL` | Set number |
| `match_id` | `uuid` | `REFERENCES matches(id) ON DELETE CASCADE` | Match reference |

**Indexes**:
- `idx_player_history_player` on `player_id`
- `idx_player_history_event` on `(event_id, player_id)`
- `idx_player_history_relationship` on `(player_id, other_player_id, relationship_type)`

**Notes**:
- Used to detect repeat partners/opponents for better match generation
- Helps identify "Previously Sat Out" (PSO) status

---

### 11. `sit_outs`
**Purpose**: Track when players sit out during sets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique record ID |
| `event_id` | `uuid` | `NOT NULL REFERENCES events(id) ON DELETE CASCADE` | Event reference |
| `player_id` | `uuid` | `NOT NULL REFERENCES players(id)` | Player who sat out |
| `set_number` | `smallint` | `NOT NULL` | Set number |
| `is_previous` | `boolean` | `DEFAULT false` | Previously sat out (PSO) |

**Indexes**:
- `idx_sit_outs_event_player` on `(event_id, player_id)`
- `idx_sit_outs_event_set` on `(event_id, set_number)`

**Constraints**:
- `UNIQUE (event_id, player_id, set_number)` - One sit-out record per player per set

---

## Relationships Summary

```
profiles (1) ──< players (user_id)
profiles (1) ──< events (organizer_id)

events (1) ──< event_courts (event_id)
events (1) ──< event_players (event_id)
events (1) ──< matches (event_id)
events (1) ──< player_history (event_id)
events (1) ──< sit_outs (event_id)

courts (1) ──< event_courts (court_id)
courts (1) ──< matches (court_id)

players (1) ──< event_players (player_id)
players (1) ──< match_players (player_id)
players (1) ──< player_history (player_id, other_player_id)
players (1) ──< sit_outs (player_id)

matches (1) ──< match_players (match_id)
matches (1) ──< player_history (match_id)
```

---

## Key Features

### 1. Multi-Set Support
- Events can have up to 6 sets
- Players can mark unavailability for specific sets via `event_players.unavailable_sets` JSONB
- Matches are organized by `set_number`

### 2. Court Management
- Courts have surface types (grass/hard)
- Players can have NHC (No Hard Court) preference
- Courts are selected in order for each event

### 3. Player Tracking
- Arrival order tracked for fair rotation
- Rest status per event
- Sit-out tracking with PSO (Previously Sat Out) flag
- Grade-based skill matching

### 4. Match Generation
- Supports Same-Sex and Mixed doubles formats
- Manual match creation capability
- Automatic match generation based on player pool
- "Perfect 16" scenario detection (16 players, same gender/grade)

### 5. History & Analytics
- Partner/opponent history for better future matching
- Avoid repeat pairings when possible
- Track grade gaps and playing down scenarios

---

## Sample Queries

### Get all players for an event with their status
```sql
SELECT 
  p.name,
  p.grade,
  p.gender,
  ep.arrival_order,
  ep.is_resting,
  ep.unavailable_sets
FROM event_players ep
JOIN players p ON ep.player_id = p.id
WHERE ep.event_id = $1
ORDER BY ep.arrival_order;
```

### Get matches for a specific set
```sql
SELECT 
  m.id,
  c.name as court_name,
  m.format,
  m.is_manual,
  json_agg(
    json_build_object(
      'player_name', p.name,
      'team', mp.team,
      'position', mp.position
    ) ORDER BY mp.team, mp.position
  ) as players
FROM matches m
JOIN courts c ON m.court_id = c.id
JOIN match_players mp ON m.match_id = mp.match_id
JOIN players p ON mp.player_id = p.id
WHERE m.event_id = $1 AND m.set_number = $2
GROUP BY m.id, c.name, m.format, m.is_manual, m.match_order
ORDER BY m.match_order;
```

### Check for repeat partners
```sql
SELECT 
  other_player_id,
  COUNT(*) as times_partnered
FROM player_history
WHERE player_id = $1 
  AND relationship_type = 'partner'
  AND event_id = $2
GROUP BY other_player_id
HAVING COUNT(*) > 1;
```

---

## Migration Considerations

### From Current HTML/JS App:
1. **Player Data**: Import from `MEMBERS` array in `Member Master List.js`
2. **Session State**: Current app uses `localStorage` - migrate to database
3. **Court Setup**: Pre-populate `courts` table with venue's courts
4. **Match Algorithm**: Port JavaScript match generation logic to TypeScript/server-side

### Supabase Setup:
1. Enable Row Level Security (RLS) on all tables
2. Set up authentication policies
3. Create database functions for complex match generation
4. Set up real-time subscriptions for live updates during events

---

## Next Steps

1. Review and approve schema design
2. Create Supabase migration files
3. Set up TypeScript types from schema
4. Implement RLS policies
5. Port match generation algorithm
6. Build Next.js UI components
