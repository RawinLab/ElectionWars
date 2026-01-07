/**
 * Integration Tests: Seed Data (Module 2.3)
 * Tests for parties, provinces, province_state, and game_state seed data
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Seed Data Tests - Module 2.3', () => {
  describe('T089: Verify 57 parties exist with correct data', () => {
    it('should have exactly 57 parties', async () => {
      const { count, error } = await supabase
        .from('parties')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBe(57);
    });

    it('should have major parties with correct colors', async () => {
      const majorParties = [
        { name_english: 'Pheu Thai Party', official_color: '#E31838' },
        { name_english: 'People\'s Party', official_color: '#FF7A00' },
        { name_english: 'Bhumjaithai Party', official_color: '#004E89' },
        { name_english: 'Democrat Party', official_color: '#87CEEB' },
        { name_english: 'Palang Pracharath Party', official_color: '#1B4D3E' },
        { name_english: 'United Thai Nation Party', official_color: '#663399' }
      ];

      for (const party of majorParties) {
        const { data, error } = await supabase
          .from('parties')
          .select('*')
          .eq('name_english', party.name_english)
          .single();

        expect(error).toBeNull();
        expect(data.official_color).toBe(party.official_color);
        expect(data.pattern_type).toBe('solid');
      }
    });

    it('should have valid ballot numbers from 1-57', async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('ballot_number')
        .order('ballot_number');

      expect(error).toBeNull();

      // Check we have ballot numbers 1-57
      const ballotNumbers = data.map(p => p.ballot_number);
      expect(Math.min(...ballotNumbers)).toBe(1);
      expect(Math.max(...ballotNumbers)).toBe(57);
      expect(new Set(ballotNumbers).size).toBe(57);  // All unique
    });

    it('should have pattern types: solid, striped, dotted, diagonal', async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('pattern_type');

      expect(error).toBeNull();

      const patterns = [...new Set(data.map(p => p.pattern_type))];
      expect(patterns).toContain('solid');
      expect(patterns).toContain('striped');
      expect(patterns).toContain('dotted');
      expect(patterns).toContain('diagonal');
    });
  });

  describe('T091: Verify 77 provinces exist with population', () => {
    it('should have exactly 77 provinces', async () => {
      const { count, error } = await supabase
        .from('provinces')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBe(77);
    });

    it('should have Bangkok with correct data', async () => {
      const { data, error } = await supabase
        .from('provinces')
        .select('*')
        .eq('id', 1)
        .single();

      expect(error).toBeNull();
      expect(data.name_thai).toBe('กรุงเทพมหานคร');
      expect(data.name_english).toBe('Bangkok');
      expect(data.region).toBe('Central');
      expect(data.population).toBe(5456000);
    });

    it('should have all 6 regions represented', async () => {
      const { data, error } = await supabase
        .from('provinces')
        .select('region');

      expect(error).toBeNull();

      const regions = [...new Set(data.map(p => p.region))];
      expect(regions).toContain('Central');
      expect(regions).toContain('Northern');
      expect(regions).toContain('Northeastern');
      expect(regions).toContain('Southern');
      expect(regions).toContain('Eastern');
      expect(regions).toContain('Western');
    });

    it('should have correct region counts', async () => {
      const regionCounts = {
        'Central': 22,
        'Northern': 9,
        'Northeastern': 20,
        'Southern': 14,
        'Eastern': 7,
        'Western': 5
      };

      for (const [region, expectedCount] of Object.entries(regionCounts)) {
        const { count, error } = await supabase
          .from('provinces')
          .select('*', { count: 'exact', head: true })
          .eq('region', region);

        expect(error).toBeNull();
        expect(count).toBe(expectedCount);
      }
    });

    it('should have population data for all provinces', async () => {
      const { data, error } = await supabase
        .from('provinces')
        .select('population')
        .is('population', null);

      expect(error).toBeNull();
      expect(data.length).toBe(0);  // No null populations
    });
  });

  describe('T096: Verify all 77 provinces have correct shield values', () => {
    it('should have province_state for all 77 provinces', async () => {
      const { count, error } = await supabase
        .from('province_state')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBe(77);
    });

    it('should have all provinces starting as neutral (no controlling party)', async () => {
      const { data, error } = await supabase
        .from('province_state')
        .select('controlling_party_id')
        .not('controlling_party_id', 'is', null);

      expect(error).toBeNull();
      expect(data.length).toBe(0);  // All should be null (neutral)
    });

    it('should have empty attack_counts for all provinces', async () => {
      const { data, error } = await supabase
        .from('province_state')
        .select('attack_counts');

      expect(error).toBeNull();
      for (const ps of data) {
        expect(ps.attack_counts).toEqual({});
      }
    });
  });

  describe('T097: Verify shield_max = population / 10', () => {
    it('should calculate shield_max correctly for Bangkok', async () => {
      const { data: province } = await supabase
        .from('provinces')
        .select('id, population')
        .eq('name_english', 'Bangkok')
        .single();

      const { data: state } = await supabase
        .from('province_state')
        .select('shield_max')
        .eq('province_id', province.id)
        .single();

      expect(state.shield_max).toBe(Math.floor(province.population / 10));
    });

    it('should calculate shield_max correctly for all provinces', async () => {
      const { data: provinces } = await supabase
        .from('provinces')
        .select('id, population');

      const { data: states } = await supabase
        .from('province_state')
        .select('province_id, shield_max');

      const stateMap = new Map(states.map(s => [s.province_id, s.shield_max]));

      for (const province of provinces) {
        const expectedMax = Math.floor(province.population / 10);
        expect(stateMap.get(province.id)).toBe(expectedMax);
      }
    });
  });

  describe('T098: Verify all provinces start with 50% shield', () => {
    it('should have shield_current = 50% of shield_max for Bangkok', async () => {
      const { data } = await supabase
        .from('province_state')
        .select('shield_max, shield_current')
        .eq('province_id', 1)  // Bangkok
        .single();

      expect(data.shield_current).toBe(Math.floor(data.shield_max * 0.5));
    });

    it('should have shield_current = 50% of shield_max for all provinces', async () => {
      const { data: states } = await supabase
        .from('province_state')
        .select('province_id, shield_max, shield_current');

      for (const state of states) {
        const expected50Percent = Math.floor(state.shield_max * 0.5);
        expect(state.shield_current).toBe(expected50Percent);
      }
    });

    it('should have shield_current between 0 and shield_max', async () => {
      const { data: states } = await supabase
        .from('province_state')
        .select('shield_max, shield_current');

      for (const state of states) {
        expect(state.shield_current).toBeGreaterThanOrEqual(0);
        expect(state.shield_current).toBeLessThanOrEqual(state.shield_max);
      }
    });
  });

  describe('T099: Verify game_state has correct end date', () => {
    it('should have exactly 1 game_state row (singleton)', async () => {
      const { count, error } = await supabase
        .from('game_state')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBe(1);
    });

    it('should have game_end_at set to Feb 8, 2026 23:59:59 Bangkok time', async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('game_end_at')
        .single();

      expect(error).toBeNull();

      const endDate = new Date(data.game_end_at);
      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(1);  // February (0-indexed)
      expect(endDate.getDate()).toBe(8);
    });

    it('should have is_active set to true', async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('is_active')
        .single();

      expect(error).toBeNull();
      expect(data.is_active).toBe(true);
    });

    it('should start with 0 total_players and 0 total_clicks', async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('total_players, total_clicks')
        .single();

      expect(error).toBeNull();
      expect(data.total_players).toBe(0);
      expect(data.total_clicks).toBe(0);
    });
  });
});
