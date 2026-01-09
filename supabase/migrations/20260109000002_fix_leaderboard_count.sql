-- Fix: Use COUNT(DISTINCT) for provinces_controlled to prevent duplicate counting
-- Issue: JOIN with players table caused province count to multiply by number of players

CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  rank BIGINT,
  party_id INTEGER,
  party_name VARCHAR,
  official_color VARCHAR,
  provinces_controlled BIGINT,
  total_clicks BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH party_stats AS (
    SELECT
      p.id AS party_id,
      p.name_thai AS party_name,
      p.official_color,
      COALESCE(COUNT(DISTINCT ps.province_id), 0)::BIGINT AS provinces_controlled,
      COALESCE(SUM(pl.total_clicks), 0)::BIGINT AS total_clicks
    FROM parties p
    LEFT JOIN province_state ps ON ps.controlling_party_id = p.id
    LEFT JOIN players pl ON pl.party_id = p.id
    GROUP BY p.id, p.name_thai, p.official_color
  )
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY party_stats.provinces_controlled DESC,
               party_stats.total_clicks DESC
    ) AS rank,
    party_stats.party_id,
    party_stats.party_name,
    party_stats.official_color,
    party_stats.provinces_controlled,
    party_stats.total_clicks
  FROM party_stats
  ORDER BY rank;
END;
$$;

COMMENT ON FUNCTION get_leaderboard IS 'Return party rankings sorted by provinces controlled (unique count), then by total clicks';
