-- Add match history tracking for repeat detection
-- This enables Phase 6 (repeat partnerships) and Phase 7 (repeat opponents)

-- Add a table to track player history across sets
CREATE TABLE IF NOT EXISTS player_set_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  set_number SMALLINT NOT NULL CHECK (set_number BETWEEN 1 AND 6),
  sat_out BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(event_id, player_id, set_number)
);

-- Add indexes for performance
CREATE INDEX idx_player_set_history_event ON player_set_history(event_id);
CREATE INDEX idx_player_set_history_player ON player_set_history(player_id);
CREATE INDEX idx_player_set_history_set ON player_set_history(set_number);

-- Add RLS policies
ALTER TABLE player_set_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on player_set_history"
  ON player_set_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add a function to get partnership history for a player
CREATE OR REPLACE FUNCTION get_player_partnerships(
  p_event_id UUID,
  p_player_id UUID,
  p_before_set INT
)
RETURNS TABLE(partner_id UUID, partner_name TEXT, set_number INT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    CASE 
      WHEN mp1.player_id = p_player_id THEN mp2.player_id
      ELSE mp1.player_id
    END as partner_id,
    CASE 
      WHEN mp1.player_id = p_player_id THEN p2.name
      ELSE p1.name
    END as partner_name,
    m.set_number::INT
  FROM matches m
  JOIN match_players mp1 ON mp1.match_id = m.id
  JOIN match_players mp2 ON mp2.match_id = m.id AND mp2.team = mp1.team AND mp2.player_id != mp1.player_id
  JOIN players p1 ON p1.id = mp1.player_id
  JOIN players p2 ON p2.id = mp2.player_id
  WHERE m.event_id = p_event_id
    AND m.set_number < p_before_set
    AND (mp1.player_id = p_player_id OR mp2.player_id = p_player_id);
END;
$$;

-- Add a function to get opponent history for a player
CREATE OR REPLACE FUNCTION get_player_opponents(
  p_event_id UUID,
  p_player_id UUID,
  p_before_set INT,
  p_last_n_sets INT DEFAULT 2
)
RETURNS TABLE(opponent_id UUID, opponent_name TEXT, set_number INT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    mp_opp.player_id as opponent_id,
    p_opp.name as opponent_name,
    m.set_number::INT
  FROM matches m
  JOIN match_players mp_player ON mp_player.match_id = m.id AND mp_player.player_id = p_player_id
  JOIN match_players mp_opp ON mp_opp.match_id = m.id AND mp_opp.team != mp_player.team
  JOIN players p_opp ON p_opp.id = mp_opp.player_id
  WHERE m.event_id = p_event_id
    AND m.set_number < p_before_set
    AND m.set_number >= (p_before_set - p_last_n_sets)
  ORDER BY m.set_number DESC;
END;
$$;

COMMENT ON TABLE player_set_history IS 'Tracks which players sat out in which sets';
COMMENT ON FUNCTION get_player_partnerships IS 'Returns all partners a player has had in previous sets';
COMMENT ON FUNCTION get_player_opponents IS 'Returns all opponents a player has faced in the last N sets';
