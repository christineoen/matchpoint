-- Complete Tennis Match Maker Schema with Clubs
-- This migration creates the entire database schema from scratch

-- =====================================================
-- PROFILES TABLE (extends Supabase Auth)
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'organizer', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);

-- =====================================================
-- CLUBS TABLE
-- =====================================================
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CLUB MEMBERS (link users to clubs)
-- =====================================================
CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'organizer', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_club_members_club_id ON club_members(club_id);
CREATE INDEX idx_club_members_user_id ON club_members(user_id);

-- =====================================================
-- PLAYERS TABLE (Master list per club)
-- =====================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  grade SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 5),
  nhc BOOLEAN DEFAULT false,
  plus_minus TEXT CHECK (plus_minus IN ('+', '-', NULL)),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_club_id ON players(club_id);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_grade ON players(grade);
CREATE INDEX idx_players_gender ON players(gender);

-- =====================================================
-- EVENTS TABLE
-- =====================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  organizer_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  total_sets SMALLINT DEFAULT 6 CHECK (total_sets BETWEEN 1 AND 6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_events_date ON events(event_date DESC);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);

-- =====================================================
-- COURTS TABLE
-- =====================================================
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  surface_type TEXT NOT NULL CHECK (surface_type IN ('grass', 'hard')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courts_surface ON courts(surface_type);

-- =====================================================
-- EVENT_COURTS (courts selected for an event)
-- =====================================================
CREATE TABLE event_courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  selection_order SMALLINT NOT NULL,
  UNIQUE(event_id, court_id)
);

CREATE INDEX idx_event_courts_event ON event_courts(event_id);

-- =====================================================
-- EVENT_PLAYERS (players registered for an event)
-- =====================================================
CREATE TABLE event_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  arrival_order SMALLINT NOT NULL,
  checked_in BOOLEAN DEFAULT false,
  UNIQUE(event_id, player_id)
);

CREATE INDEX idx_event_players_event ON event_players(event_id);
CREATE INDEX idx_event_players_player ON event_players(player_id);

-- =====================================================
-- MATCHES TABLE
-- =====================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  set_number SMALLINT NOT NULL CHECK (set_number BETWEEN 1 AND 6),
  court_id UUID NOT NULL REFERENCES courts(id),
  format TEXT NOT NULL CHECK (format IN ('Same-Sex', 'Mixed')),
  is_manual BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_event ON matches(event_id);
CREATE INDEX idx_matches_set ON matches(set_number);

-- =====================================================
-- MATCH_PLAYERS (players in a match)
-- =====================================================
CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  team SMALLINT NOT NULL CHECK (team IN (1, 2)),
  position SMALLINT NOT NULL CHECK (position IN (1, 2))
);

CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_player ON match_players(player_id);

-- =====================================================
-- MATCH_HISTORY (track who played with/against whom)
-- =====================================================
CREATE TABLE match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('partner', 'opponent')),
  set_number SMALLINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_match_history_event ON match_history(event_id);
CREATE INDEX idx_match_history_player1 ON match_history(player1_id);
CREATE INDEX idx_match_history_player2 ON match_history(player2_id);

-- =====================================================
-- AUTH TRIGGER: Auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'member',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- CLUBS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clubs"
  ON clubs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create clubs"
  ON clubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Club admins can update their club"
  ON clubs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = clubs.id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'admin'
    )
  );

-- CLUB_MEMBERS
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships"
  ON club_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own memberships"
  ON club_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update members"
  ON club_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete members"
  ON club_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- PLAYERS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view players in their clubs"
  ON players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = players.club_id
        AND club_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Club organizers can manage players"
  ON players FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = players.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'organizer')
    )
  );

-- EVENTS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their clubs"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = events.club_id
        AND club_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Club organizers can create events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = events.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'organizer')
    )
  );

CREATE POLICY "Club organizers can update events"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = events.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'organizer')
    )
  );

CREATE POLICY "Club admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = events.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'admin'
    )
  );

-- COURTS (global, visible to all)
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courts"
  ON courts FOR SELECT
  USING (true);

-- EVENT_COURTS
ALTER TABLE event_courts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view event courts"
  ON event_courts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN club_members cm ON cm.club_id = e.club_id
      WHERE e.id = event_courts.event_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can manage event courts"
  ON event_courts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN club_members cm ON cm.club_id = e.club_id
      WHERE e.id = event_courts.event_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'organizer')
    )
  );

-- EVENT_PLAYERS
ALTER TABLE event_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view event players"
  ON event_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN club_members cm ON cm.club_id = e.club_id
      WHERE e.id = event_players.event_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can manage event players"
  ON event_players FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN club_members cm ON cm.club_id = e.club_id
      WHERE e.id = event_players.event_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'organizer')
    )
  );

-- MATCHES
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view matches"
  ON matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN club_members cm ON cm.club_id = e.club_id
      WHERE e.id = matches.event_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can manage matches"
  ON matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN club_members cm ON cm.club_id = e.club_id
      WHERE e.id = matches.event_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'organizer')
    )
  );

CREATE POLICY "Organizers can manage events"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = events.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'organizer')
    )
  );

-- MATCH_PLAYERS
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view match players"
  ON match_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN events e ON e.id = m.event_id
      JOIN club_members cm ON cm.club_id = e.club_id
      WHERE m.id = match_players.match_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can manage match players"
  ON match_players FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN events e ON e.id = m.event_id
      JOIN club_members cm ON cm.club_id = e.club_id
      WHERE m.id = match_players.match_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'organizer')
    )
  );

-- MATCH_HISTORY
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view match history"
  ON match_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN club_members cm ON cm.club_id = e.club_id
      WHERE e.id = match_history.event_id
        AND cm.user_id = auth.uid()
    )
  );
