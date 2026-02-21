-- Fix RLS policies for matches and match_players tables
-- The previous migration had the "manage matches" policy on the wrong table

-- Drop the incorrectly placed policy on events table
DROP POLICY IF EXISTS "Organizers can manage matches" ON events;

-- Add the correct policy on matches table
DROP POLICY IF EXISTS "Organizers can manage matches" ON matches;
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

-- Add the correct policy on events table
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

-- Add missing policy for match_players
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
