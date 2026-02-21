-- Fix RLS policies to avoid infinite recursion
-- The key is to make club_members policies NOT reference club_members

-- =====================================================
-- CLUB_MEMBERS: Simple policies without recursion
-- =====================================================

DROP POLICY IF EXISTS "Users can view own memberships" ON club_members;
DROP POLICY IF EXISTS "Club members can view club memberships" ON club_members;
DROP POLICY IF EXISTS "Club admins can manage members" ON club_members;
DROP POLICY IF EXISTS "Service role can insert members" ON club_members;

-- Users can always view their own memberships (no recursion)
CREATE POLICY "Users can view own memberships"
  ON club_members FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert themselves as members (for signup)
CREATE POLICY "Users can insert own memberships"
  ON club_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can update/delete members (only for UPDATE/DELETE, not SELECT)
CREATE POLICY "Admins can update members"
  ON club_members FOR UPDATE
  USING (
    -- This is safe because SELECT uses the policy above
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

-- =====================================================
-- EVENTS: Fix policies to work with new club_members
-- =====================================================

DROP POLICY IF EXISTS "Users can view events in their clubs" ON events;
DROP POLICY IF EXISTS "Club members can create events" ON events;

-- Users can view events in clubs they're members of
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

-- Club members can create events
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

-- Club organizers can update events
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

-- Club admins can delete events
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

-- =====================================================
-- PLAYERS: Fix policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view players in their clubs" ON players;

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

CREATE POLICY "Club members can manage players"
  ON players FOR ALL
  USING (
    club_id IS NULL OR
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = players.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'organizer')
    )
  );
