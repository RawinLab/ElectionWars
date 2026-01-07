/**
 * Integration Tests: RLS Policies (Module 2.3)
 * Tests for Row Level Security policies
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Anonymous client (simulates unauthenticated user)
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

// Service role client (bypasses RLS for test setup)
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

describe('RLS Policies - Module 2.3', () => {
  let testPartyId;
  let testProvinceId = 99;
  let testPlayerId;

  beforeAll(async () => {
    // Create test party using service role
    const { data: party } = await serviceClient
      .from('parties')
      .insert({
        name_thai: 'พรรค RLS Test',
        name_english: 'RLS Test Party',
        official_color: '#FF00FF'
      })
      .select()
      .single();
    testPartyId = party?.id;

    // Create test province using service role
    await serviceClient
      .from('provinces')
      .insert({
        id: testProvinceId,
        name_thai: 'จังหวัดทดสอบ RLS',
        name_english: 'RLS Test Province',
        region: 'Central',
        population: 100000
      });

    // Create test province_state
    await serviceClient
      .from('province_state')
      .insert({
        province_id: testProvinceId,
        shield_max: 10000,
        shield_current: 5000,
        attack_counts: {},
        controlling_party_id: testPartyId
      });

    // Create test player
    const { data: player } = await serviceClient
      .from('players')
      .insert({
        party_id: testPartyId,
        nickname: 'RLSTestPlayer',
        auth_id: 'rls-test-1111-1111-111111111111'
      })
      .select()
      .single();
    testPlayerId = player?.id;
  });

  afterAll(async () => {
    // Cleanup using service role
    await serviceClient.from('province_state').delete().eq('province_id', testProvinceId);
    await serviceClient.from('players').delete().eq('id', testPlayerId);
    await serviceClient.from('provinces').delete().eq('id', testProvinceId);
    await serviceClient.from('parties').delete().eq('id', testPartyId);
  });

  describe('T085: Anonymous user can read public tables', () => {
    it('should allow anonymous read access to parties table', async () => {
      const { data, error } = await anonClient
        .from('parties')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should allow anonymous read access to provinces table', async () => {
      const { data, error } = await anonClient
        .from('provinces')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should allow anonymous read access to province_state table', async () => {
      const { data, error } = await anonClient
        .from('province_state')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should allow anonymous read access to game_state table', async () => {
      const { data, error } = await anonClient
        .from('game_state')
        .select('*');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should allow anonymous read access to players table (leaderboard)', async () => {
      const { data, error } = await anonClient
        .from('players')
        .select('id, nickname, party_id, total_clicks')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('T086: Anonymous user cannot write province_state directly', () => {
    it('should block direct INSERT to province_state from anonymous client', async () => {
      const { error } = await anonClient
        .from('province_state')
        .insert({
          province_id: 999,
          shield_max: 1000,
          shield_current: 500,
          attack_counts: {}
        });

      // Should be blocked by RLS - either permission denied or policy violation
      expect(error).not.toBeNull();
    });

    it('should block direct UPDATE to province_state from anonymous client', async () => {
      const { error } = await anonClient
        .from('province_state')
        .update({ shield_current: 9999 })
        .eq('province_id', testProvinceId);

      // Should be blocked by RLS
      expect(error).not.toBeNull();
    });

    it('should block direct DELETE from province_state from anonymous client', async () => {
      const { error } = await anonClient
        .from('province_state')
        .delete()
        .eq('province_id', testProvinceId);

      // Should be blocked by RLS
      expect(error).not.toBeNull();
    });
  });

  describe('T087: click_province function bypasses RLS', () => {
    it('should allow click_province RPC to update province_state', async () => {
      // Reset player last_click_at
      await serviceClient
        .from('players')
        .update({ last_click_at: null })
        .eq('id', testPlayerId);

      // Get initial shield value
      const { data: before } = await anonClient
        .from('province_state')
        .select('shield_current')
        .eq('province_id', testProvinceId)
        .single();

      // Call click_province RPC (SECURITY DEFINER function)
      const { data, error } = await anonClient.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testPartyId
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      expect(data.action).toBe('defend');  // Same party = defend

      // Verify shield was updated
      const { data: after } = await anonClient
        .from('province_state')
        .select('shield_current')
        .eq('province_id', testProvinceId)
        .single();

      expect(after.shield_current).toBe(before.shield_current + 1);
    });

    it('should allow join_game RPC to create player records', async () => {
      const testAuthId = 'rls-join-test-' + Date.now();

      const { data, error } = await anonClient.rpc('join_game', {
        p_auth_id: testAuthId,
        p_party_id: testPartyId,
        p_nickname: 'RLSJoinTest'
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      expect(data.player_id).toBeDefined();

      // Cleanup
      await serviceClient.from('players').delete().eq('auth_id', testAuthId);
    });

    it('should allow change_party RPC to update player records', async () => {
      // Create a second test party
      const { data: party2 } = await serviceClient
        .from('parties')
        .insert({
          name_thai: 'พรรคทดสอบ 2',
          name_english: 'Test Party 2',
          official_color: '#00FFFF'
        })
        .select()
        .single();

      // Create a test player for party change
      const { data: joinResult } = await anonClient.rpc('join_game', {
        p_auth_id: 'rls-change-test-' + Date.now(),
        p_party_id: testPartyId,
        p_nickname: 'ChangeTestPlayer'
      });

      // Attempt to change party (should work via SECURITY DEFINER)
      const { data, error } = await anonClient.rpc('change_party', {
        p_player_id: joinResult.player_id,
        p_new_party_id: party2.id
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      expect(data.new_party).toBe(party2.id);

      // Cleanup
      await serviceClient.from('players').delete().eq('id', joinResult.player_id);
      await serviceClient.from('parties').delete().eq('id', party2.id);
    });
  });
});
