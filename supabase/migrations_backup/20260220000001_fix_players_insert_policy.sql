-- Fix players table RLS policy to allow inserts

DROP POLICY IF EXISTS "Authenticated users can create players" ON players;

CREATE POLICY "Anyone can create players"
  ON players FOR INSERT
  WITH CHECK (true);
