-- Add clubs/organizations system

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

-- Add club_id to players table
ALTER TABLE players ADD COLUMN club_id UUID REFERENCES clubs(id) ON DELETE SET NULL;

-- Add club_id to events table
ALTER TABLE events ADD COLUMN club_id UUID REFERENCES clubs(id) ON DELETE CASCADE;

-- Add club_id to profiles (default club for user)
ALTER TABLE profiles ADD COLUMN default_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_club_members_club_id ON club_members(club_id);
CREATE INDEX idx_club_members_user_id ON club_members(user_id);
CREATE INDEX idx_players_club_id ON players(club_id);
CREATE INDEX idx_events_club_id ON events(club_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Clubs
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Anyone can view clubs
CREATE POLICY "Anyone can view clubs"
  ON clubs FOR SELECT
  USING (true);

-- Club admins can update their club
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

-- Club Members
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

-- Members can view their club memberships
CREATE POLICY "Users can view club memberships"
  ON club_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
    )
  );

-- Club admins can manage members
CREATE POLICY "Club admins can manage members"
  ON club_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- Update players RLS to filter by club
DROP POLICY IF EXISTS "Anyone can view players" ON players;
CREATE POLICY "Users can view players in their clubs"
  ON players FOR SELECT
  USING (
    club_id IS NULL OR
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = players.club_id
        AND club_members.user_id = auth.uid()
    )
  );

-- Update events RLS to filter by club
DROP POLICY IF EXISTS "Anyone can view events" ON events;
CREATE POLICY "Users can view events in their clubs"
  ON events FOR SELECT
  USING (
    club_id IS NULL OR
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = events.club_id
        AND club_members.user_id = auth.uid()
    )
  );

-- Club organizers can create events
DROP POLICY IF EXISTS "Anyone can create events" ON events;
CREATE POLICY "Club members can create events"
  ON events FOR INSERT
  WITH CHECK (
    club_id IS NULL OR
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = events.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'organizer')
    )
  );

-- =====================================================
-- HELPER FUNCTION
-- =====================================================

-- Function to get user's clubs
CREATE OR REPLACE FUNCTION get_user_clubs(user_uuid UUID)
RETURNS TABLE (
  club_id UUID,
  club_name TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    cm.role
  FROM clubs c
  JOIN club_members cm ON cm.club_id = c.id
  WHERE cm.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
