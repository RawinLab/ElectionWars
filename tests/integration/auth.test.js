/**
 * Integration Tests: join_game() and change_party() Functions (Module 2.2)
 * Tests for player registration and party switching
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

describe('join_game() and change_party() Functions - Module 2.2', () => {
  let testParty1Id;
  let testParty2Id;
  const testAuthIds = [];
  const testPlayerIds = [];

  beforeAll(async () => {
    // Create test parties
    const { data: party1 } = await supabase
      .from('parties')
      .insert({
        name_thai: 'พรรค Auth Test 1',
        name_english: 'Auth Test Party 1',
        official_color: '#FF0000'
      })
      .select()
      .single();
    testParty1Id = party1?.id;

    const { data: party2 } = await supabase
      .from('parties')
      .insert({
        name_thai: 'พรรค Auth Test 2',
        name_english: 'Auth Test Party 2',
        official_color: '#0000FF'
      })
      .select()
      .single();
    testParty2Id = party2?.id;
  });

  afterAll(async () => {
    // Cleanup players
    for (const playerId of testPlayerIds) {
      await supabase.from('players').delete().eq('id', playerId);
    }
    // Cleanup by auth_id too
    for (const authId of testAuthIds) {
      await supabase.from('players').delete().eq('auth_id', authId);
    }
    // Cleanup parties
    await supabase.from('parties').delete().in('id', [testParty1Id, testParty2Id]);
  });

  describe('join_game() - US-010', () => {
    describe('T058: Create new player', () => {
      it('should create new player correctly', async () => {
        const authId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        testAuthIds.push(authId);

        const { data, error } = await supabase.rpc('join_game', {
          p_auth_id: authId,
          p_party_id: testParty1Id,
          p_nickname: 'NewPlayer1'
        });

        expect(error).toBeNull();
        expect(data.success).toBe(true);
        expect(data.player_id).toBeDefined();
        expect(data.existing).toBe(false);

        testPlayerIds.push(data.player_id);

        // Verify player in database
        const { data: player } = await supabase
          .from('players')
          .select('*')
          .eq('id', data.player_id)
          .single();

        expect(player.auth_id).toBe(authId);
        expect(player.party_id).toBe(testParty1Id);
        expect(player.nickname).toBe('NewPlayer1');
        expect(player.total_clicks).toBe(0);
      });

      it('should increment total_players in game_state', async () => {
        // Get initial count
        const { data: before } = await supabase
          .from('game_state')
          .select('total_players')
          .single();

        const authId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
        testAuthIds.push(authId);

        const { data } = await supabase.rpc('join_game', {
          p_auth_id: authId,
          p_party_id: testParty1Id,
          p_nickname: 'NewPlayer2'
        });

        testPlayerIds.push(data.player_id);

        // Get after count
        const { data: after } = await supabase
          .from('game_state')
          .select('total_players')
          .single();

        expect(after.total_players).toBe(before.total_players + 1);
      });

      it('should reject invalid party_id', async () => {
        const authId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

        const { data } = await supabase.rpc('join_game', {
          p_auth_id: authId,
          p_party_id: 999999,  // Invalid party
          p_nickname: 'InvalidPartyPlayer'
        });

        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid party');
      });
    });

    describe('T059: Return existing player', () => {
      it('should return existing player if auth_id already exists', async () => {
        const authId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
        testAuthIds.push(authId);

        // First join
        const { data: first } = await supabase.rpc('join_game', {
          p_auth_id: authId,
          p_party_id: testParty1Id,
          p_nickname: 'ExistingPlayer'
        });

        testPlayerIds.push(first.player_id);

        // Second join with same auth_id
        const { data: second } = await supabase.rpc('join_game', {
          p_auth_id: authId,
          p_party_id: testParty2Id,  // Different party
          p_nickname: 'DifferentNickname'  // Different nickname
        });

        expect(second.success).toBe(true);
        expect(second.player_id).toBe(first.player_id);  // Same player
        expect(second.existing).toBe(true);
      });
    });
  });

  describe('change_party() - US-011', () => {
    let changeTestPlayerId;

    beforeEach(async () => {
      // Create fresh player for each test
      const authId = `change-${Date.now()}-${Math.random()}`;
      testAuthIds.push(authId);

      const { data } = await supabase.rpc('join_game', {
        p_auth_id: authId,
        p_party_id: testParty1Id,
        p_nickname: 'ChangeTestPlayer'
      });

      changeTestPlayerId = data.player_id;
      testPlayerIds.push(changeTestPlayerId);

      // Reset party_changed_at to allow changes
      await supabase
        .from('players')
        .update({ party_changed_at: null })
        .eq('id', changeTestPlayerId);
    });

    describe('T064: 24hr cooldown', () => {
      it('should enforce 24hr cooldown', async () => {
        // Set party_changed_at to 12 hours ago
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        await supabase
          .from('players')
          .update({ party_changed_at: twelveHoursAgo })
          .eq('id', changeTestPlayerId);

        const { data } = await supabase.rpc('change_party', {
          p_player_id: changeTestPlayerId,
          p_new_party_id: testParty2Id
        });

        expect(data.success).toBe(false);
        expect(data.error).toBe('Cooldown active');
        expect(data.hours_remaining).toBeGreaterThan(0);
        expect(data.hours_remaining).toBeLessThanOrEqual(12);
      });

      it('should allow change after 24hrs', async () => {
        // Set party_changed_at to 25 hours ago
        const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
        await supabase
          .from('players')
          .update({ party_changed_at: twentyFiveHoursAgo })
          .eq('id', changeTestPlayerId);

        const { data } = await supabase.rpc('change_party', {
          p_player_id: changeTestPlayerId,
          p_new_party_id: testParty2Id
        });

        expect(data.success).toBe(true);
        expect(data.old_party).toBe(testParty1Id);
        expect(data.new_party).toBe(testParty2Id);
      });
    });

    describe('T065: Click reset', () => {
      it('should reset clicks to 0 after party change', async () => {
        // Set some clicks
        await supabase
          .from('players')
          .update({ total_clicks: 100 })
          .eq('id', changeTestPlayerId);

        const { data } = await supabase.rpc('change_party', {
          p_player_id: changeTestPlayerId,
          p_new_party_id: testParty2Id
        });

        expect(data.success).toBe(true);
        expect(data.clicks_reset).toBe(true);

        // Verify in database
        const { data: player } = await supabase
          .from('players')
          .select('total_clicks')
          .eq('id', changeTestPlayerId)
          .single();

        expect(player.total_clicks).toBe(0);
      });
    });

    describe('T066: Same party error', () => {
      it('should return error when changing to same party', async () => {
        const { data } = await supabase.rpc('change_party', {
          p_player_id: changeTestPlayerId,
          p_new_party_id: testParty1Id  // Same as current party
        });

        expect(data.success).toBe(false);
        expect(data.error).toBe('Already in this party');
      });
    });
  });
});
