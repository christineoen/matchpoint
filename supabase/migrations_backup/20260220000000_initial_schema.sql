-- Tennis Match-Making App - Supabase Migration
-- Run this in Supabase SQL Editor or as a migration file

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
-- PLAYERS TABLE (Master list)
-- =====================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  grade SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 5),
  gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
  nhc BOOLEAN DEFAULT false,
  plus_minus CHAR(1) CHECK (plus_minus IN ('+', '-')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_grade_gender ON players(grade, gender);
CREATE INDEX idx_players_user_id ON players(user_id);

COMMENT ON COLUMN players.grade IS 'Grade: 1=3A, 2=3, 3=2B, 4=2A, 5=2';
COMMENT ON COLUMN players.nhc IS 'No Hard Court preference';

-- =====================================================
-- EVENTS TABLE
-- =====================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  display_order SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courts_name ON courts(name);
CREATE INDEX idx_courts_display_order ON courts(display_order);

-- =====================================================
-- EVENT_COURTS TABLE (Courts available for event)
-- =====================================================
CREATE TABLE event_courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id),
  selection_order SMALLINT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  UNIQUE(event_id, court_id)
);

CREATE INDEX idx_event_courts_event ON event_courts(event_id);
CREATE INDEX idx_event_courts_order ON event_courts(event_id, selection_order);

-- =====================================================
-- EVENT_PLAYERS TABLE (Players registered for event)
-- =====================================================
CREATE TABLE event_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  arrival_order SMALLINT,
  is_resting BOOLEAN DEFAULT false,
  unavailable_sets JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id)
);

CREATE INDEX idx_event_players_event ON event_players(event_id);
CREATE INDEX idx_event_players_player ON event_players(player_id);
CREATE INDEX idx_event_players_arrival ON event_players(event_id, arrival_order);

COMMENT ON COLUMN event_players.unavailable_sets IS 'JSONB: {"set1": true, "set2": false, ...}';

-- =====================================================
-- MATCHES TABLE
-- =====================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id),
  set_number SMALLINT NOT NULL CHECK (set_number BETWEEN 1 AND 6),
  format TEXT NOT NULL CHECK (format IN ('Same-Sex', 'Mixed')),
  is_manual BOOLEAN DEFAULT false,
  match_order SMALLINT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_event ON matches(event_id);
CREATE INDEX idx_matches_event_set ON matches(event_id, set_number);
CREATE INDEX idx_matches_court ON matches(court_id);

-- =====================================================
-- MATCH_PLAYERS TABLE (Players in each match)
-- =====================================================
CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  team SMALLINT NOT NULL CHECK (team IN (1, 2)),
  position SMALLINT CHECK (position IN (1, 2)),
  UNIQUE(match_id, player_id),
  UNIQUE(match_id, team, position)
);

CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_player ON match_players(player_id);

-- =====================================================
-- PLAYER_HISTORY TABLE (Track partnerships/opponents)
-- =====================================================
CREATE TABLE player_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  other_player_id UUID NOT NULL REFERENCES players(id),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('partner', 'opponent')),
  set_number SMALLINT NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  CHECK (player_id != other_player_id)
);

CREATE INDEX idx_player_history_player ON player_history(player_id);
CREATE INDEX idx_player_history_event ON player_history(event_id, player_id);
CREATE INDEX idx_player_history_relationship ON player_history(player_id, other_player_id, relationship_type);

-- =====================================================
-- SIT_OUTS TABLE (Track when players sit out)
-- =====================================================
CREATE TABLE sit_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  set_number SMALLINT NOT NULL,
  is_previous BOOLEAN DEFAULT false,
  UNIQUE(event_id, player_id, set_number)
);

CREATE INDEX idx_sit_outs_event_player ON sit_outs(event_id, player_id);
CREATE INDEX idx_sit_outs_event_set ON sit_outs(event_id, set_number);

COMMENT ON COLUMN sit_outs.is_previous IS 'Previously Sat Out (PSO) flag';

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sit_outs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Note: Admin policy removed to avoid infinite recursion
-- Will add proper admin access via service role key

-- Players policies (public read, authenticated write)
CREATE POLICY "Anyone can view active players"
  ON players FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create players"
  ON players FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update players"
  ON players FOR UPDATE
  USING (true);

-- Events policies
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create events"
  ON events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Event organizers can update their events"
  ON events FOR UPDATE
  USING (organizer_id = auth.uid() OR organizer_id IS NULL);

-- Courts policies (public read)
CREATE POLICY "Anyone can view active courts"
  ON courts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can manage courts"
  ON courts FOR ALL
  USING (true);

-- Event-related tables inherit event permissions
CREATE POLICY "Users can view event courts for visible events"
  ON event_courts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage event courts"
  ON event_courts FOR ALL
  USING (true);

CREATE POLICY "Users can view event players for visible events"
  ON event_players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage event players"
  ON event_players FOR ALL
  USING (true);

CREATE POLICY "Users can view matches for visible events"
  ON matches FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage matches"
  ON matches FOR ALL
  USING (true);

CREATE POLICY "Users can view match players for visible events"
  ON match_players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage match players"
  ON match_players FOR ALL
  USING (true);

-- Player history and sit-outs (similar patterns)
CREATE POLICY "Users can view player history for visible events"
  ON player_history FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage player history"
  ON player_history FOR ALL
  USING (true);

CREATE POLICY "Users can view sit-outs for visible events"
  ON sit_outs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage sit-outs"
  ON sit_outs FOR ALL
  USING (true);

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample courts
INSERT INTO courts (name, surface_type, display_order) VALUES
  ('1', 'grass', 1),
  ('2', 'grass', 2),
  ('3', 'grass', 3),
  ('4', 'grass', 4),
  ('5', 'grass', 5),
  ('6', 'grass', 6),
  ('H1', 'hard', 7),
  ('H2', 'hard', 8),
  ('H3', 'hard', 9),
  ('H4', 'hard', 10);

-- =====================================================
-- HELPER VIEWS (Optional)
-- =====================================================

-- View: Complete match details with players
CREATE OR REPLACE VIEW match_details AS
SELECT 
  m.id as match_id,
  m.event_id,
  e.name as event_name,
  e.event_date,
  m.set_number,
  c.name as court_name,
  c.surface_type,
  m.format,
  m.is_manual,
  m.match_order,
  m.notes,
  json_agg(
    json_build_object(
      'player_id', p.id,
      'player_name', p.name,
      'grade', p.grade,
      'gender', p.gender,
      'team', mp.team,
      'position', mp.position
    ) ORDER BY mp.team, mp.position
  ) as players
FROM matches m
JOIN events e ON m.event_id = e.id
JOIN courts c ON m.court_id = c.id
JOIN match_players mp ON m.id = mp.match_id
JOIN players p ON mp.player_id = p.id
GROUP BY m.id, e.name, e.event_date, c.name, c.surface_type;

-- View: Event player roster with details
CREATE OR REPLACE VIEW event_roster AS
SELECT 
  ep.event_id,
  e.name as event_name,
  e.event_date,
  p.id as player_id,
  p.name as player_name,
  p.grade,
  p.gender,
  p.nhc,
  p.plus_minus,
  ep.arrival_order,
  ep.is_resting,
  ep.unavailable_sets
FROM event_players ep
JOIN events e ON ep.event_id = e.id
JOIN players p ON ep.player_id = p.id
ORDER BY ep.arrival_order;

COMMENT ON VIEW match_details IS 'Complete match information with all players';
COMMENT ON VIEW event_roster IS 'Event player roster with full details';
