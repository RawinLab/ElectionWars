-- ElectionWars Database Schema
-- Module 2.1: Core Tables
-- Generated: 2026-01-07

-- ============================================
-- Table: parties
-- Stores 57 Thai political parties with official colors
-- ============================================
CREATE TABLE parties (
  id SERIAL PRIMARY KEY,
  name_thai VARCHAR(255) NOT NULL,
  name_english VARCHAR(255) NOT NULL,
  ballot_number INTEGER UNIQUE,
  official_color VARCHAR(7) NOT NULL,  -- HEX: #RRGGBB
  pattern_type VARCHAR(20) DEFAULT 'solid',  -- solid, striped, dotted, diagonal
  leader_name VARCHAR(255),
  mp_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ballot number lookups
CREATE INDEX idx_parties_ballot_number ON parties(ballot_number);

-- ============================================
-- Table: provinces
-- Stores 77 Thai provinces with population data
-- ============================================
CREATE TABLE provinces (
  id INTEGER PRIMARY KEY,  -- 1-77
  name_thai VARCHAR(255) NOT NULL UNIQUE,
  name_english VARCHAR(255),
  region VARCHAR(50),  -- Northern, Northeastern, Central, Southern, Eastern, Western
  population INTEGER NOT NULL,  -- Population for shield calculation (shield_max = population / 10)
  svg_path TEXT,  -- SVG path for map rendering
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for region-based queries
CREATE INDEX idx_provinces_region ON provinces(region);

-- ============================================
-- Table: province_state (Realtime enabled)
-- Tracks real-time province control with shield system
-- ============================================
CREATE TABLE province_state (
  province_id INTEGER PRIMARY KEY REFERENCES provinces(id),
  controlling_party_id INTEGER REFERENCES parties(id),  -- NULL = neutral

  -- Shield System
  shield_current BIGINT NOT NULL DEFAULT 0,
  shield_max BIGINT NOT NULL,  -- population / 10
  attack_counts JSONB NOT NULL DEFAULT '{}',  -- {"party_id": click_count}

  -- Stats
  total_clicks BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for party leaderboard queries
CREATE INDEX idx_province_state_controlling ON province_state(controlling_party_id);

-- Index for shield-based queries
CREATE INDEX idx_province_state_shield ON province_state(shield_current);

-- ============================================
-- Table: players
-- Player profiles with party affiliation and stats
-- ============================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,  -- Supabase auth.users.id
  party_id INTEGER NOT NULL REFERENCES parties(id),
  nickname VARCHAR(100) NOT NULL,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  party_changed_at TIMESTAMPTZ,  -- For 24hr cooldown
  last_click_at TIMESTAMPTZ,  -- For rate limiting
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for party-based queries (leaderboard)
CREATE INDEX idx_players_party ON players(party_id);

-- Index for top players by clicks
CREATE INDEX idx_players_clicks ON players(total_clicks DESC);

-- Index for auth lookups
CREATE INDEX idx_players_auth ON players(auth_id);

-- ============================================
-- Table: game_state (Singleton)
-- Global game statistics - only one row allowed
-- ============================================
CREATE TABLE game_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Singleton constraint
  total_clicks BIGINT NOT NULL DEFAULT 0,
  total_players INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, ended
  game_end_time TIMESTAMPTZ NOT NULL DEFAULT '2026-02-08 23:59:59+07',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize game_state singleton row
INSERT INTO game_state (id) VALUES (1);

-- ============================================
-- Enable Realtime for live updates
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE province_state;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE parties IS 'Stores 57 Thai political parties for the 2026 election';
COMMENT ON TABLE provinces IS 'Stores 77 Thai provinces with population for shield calculation';
COMMENT ON TABLE province_state IS 'Real-time game state tracking shield values and control';
COMMENT ON TABLE players IS 'Player profiles with party affiliation and click statistics';
COMMENT ON TABLE game_state IS 'Singleton table for global game statistics';

COMMENT ON COLUMN province_state.shield_max IS 'Maximum shield value = province population / 10';
COMMENT ON COLUMN province_state.attack_counts IS 'JSONB tracking attack clicks by party: {"party_id": click_count}';
COMMENT ON COLUMN players.party_changed_at IS 'Timestamp for 24hr party change cooldown';
COMMENT ON COLUMN players.last_click_at IS 'Timestamp for 100ms rate limiting';
