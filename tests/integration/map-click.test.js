/**
 * Integration Tests: Map Click RPC (Module 2.2)
 * Tests for map click interactions calling click_province RPC
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Map Click RPC Integration - Module 2.2', () => {
  let testParty1Id;
  let testParty2Id;
  let testProvinceId = 98;
  let testPlayerId;
  let testPlayer2Id;

  beforeAll(async () => {
    // Create test parties
    const { data: party1 } = await supabase
      .from('parties')
      .insert({
        name_thai: 'พรรคแผนที่ 1',
        name_english: 'Map Test Party 1',
        official_color: '#FF0000'
      })
      .select()
      .single();
    testParty1Id = party1?.id;

    const { data: party2 } = await supabase
      .from('parties')
      .insert({
        name_thai: 'พรรคแผนที่ 2',
        name_english: 'Map Test Party 2',
        official_color: '#0000FF'
      })
      .select()
      .single();
    testParty2Id = party2?.id;

    // Create test province
    await supabase
      .from('provinces')
      .insert({
        id: testProvinceId,
        name_thai: 'จังหวัดทดสอบแผนที่',
        name_english: 'Map Click Test Province',
        region: 'Central',
        population: 1000  // shield_max = 100
      });

    // Create test players
    const { data: player1 } = await supabase
      .from('players')
      .insert({
        party_id: testParty1Id,
        nickname: 'MapClickPlayer1',
        auth_id: '33333333-3333-3333-3333-333333333333'
      })
      .select()
      .single();
    testPlayerId = player1?.id;

    const { data: player2 } = await supabase
      .from('players')
      .insert({
        party_id: testParty2Id,
        nickname: 'MapClickPlayer2',
        auth_id: '44444444-4444-4444-4444-444444444444'
      })
      .select()
      .single();
    testPlayer2Id = player2?.id;
  });

  beforeEach(async () => {
    // Reset province state before each test
    await supabase
      .from('province_state')
      .upsert({
        province_id: testProvinceId,
        shield_max: 100,
        shield_current: 50,  // 50% shield
        attack_counts: {},
        controlling_party_id: testParty1Id,  // Party 1 controls
        total_clicks: 0
      });

    // Reset player last_click_at to allow clicks
    await supabase
      .from('players')
      .update({ last_click_at: null })
      .in('id', [testPlayerId, testPlayer2Id]);
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('province_state').delete().eq('province_id', testProvinceId);
    await supabase.from('players').delete().in('id', [testPlayerId, testPlayer2Id]);
    await supabase.from('provinces').delete().eq('id', testProvinceId);
    await supabase.from('parties').delete().in('id', [testParty1Id, testParty2Id]);
  });

  describe('T148: Map click calls click_province RPC', () => {
    it('should successfully call click_province RPC when clicking a province', async () => {
      const { data, error } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.success).toBe(true);
      expect(data.province_id).toBe(testProvinceId);
      expect(data.party_id).toBe(testParty1Id);
    });

    it('should return success false for invalid province', async () => {
      const { data, error } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: 99999,  // Non-existent province
        p_party_id: testParty1Id
      });

      expect(error).toBeNull();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Province not found');
    });
  });

  describe('T148: Defend action increases shield', () => {
    it('should increase shield by 1 when clicking own party province', async () => {
      const { data } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      expect(data.success).toBe(true);
      expect(data.action).toBe('defend');
      expect(data.shield).toBe(51);  // 50 + 1
      expect(data.controlling_party).toBe(testParty1Id);
    });

    it('should not exceed shield_max when defending', async () => {
      // Set shield to max
      await supabase
        .from('province_state')
        .update({ shield_current: 100 })
        .eq('province_id', testProvinceId);

      const { data } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      expect(data.success).toBe(true);
      expect(data.action).toBe('defend');
      expect(data.shield).toBe(100);  // Capped at max
    });

    it('should update player total_clicks on defend', async () => {
      const { data: beforePlayer } = await supabase
        .from('players')
        .select('total_clicks')
        .eq('id', testPlayerId)
        .single();

      await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      const { data: afterPlayer } = await supabase
        .from('players')
        .select('total_clicks')
        .eq('id', testPlayerId)
        .single();

      expect(afterPlayer.total_clicks).toBe(beforePlayer.total_clicks + 1);
    });
  });

  describe('T148: Attack action decreases shield', () => {
    it('should decrease shield by 1 when clicking enemy province', async () => {
      const { data } = await supabase.rpc('click_province', {
        p_player_id: testPlayer2Id,
        p_province_id: testProvinceId,
        p_party_id: testParty2Id
      });

      expect(data.success).toBe(true);
      expect(data.action).toBe('attack');
      expect(data.shield).toBe(49);  // 50 - 1
      expect(data.controlling_party).toBe(testParty1Id);  // Still controlled by Party 1
      expect(data.your_attacks).toBe(1);
    });

    it('should track attack counts by party', async () => {
      // First attack
      await supabase.rpc('click_province', {
        p_player_id: testPlayer2Id,
        p_province_id: testProvinceId,
        p_party_id: testParty2Id
      });

      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));

      // Reset last_click_at for second attack
      await supabase
        .from('players')
        .update({ last_click_at: null })
        .eq('id', testPlayer2Id);

      // Second attack
      const { data } = await supabase.rpc('click_province', {
        p_player_id: testPlayer2Id,
        p_province_id: testProvinceId,
        p_party_id: testParty2Id
      });

      expect(data.your_attacks).toBe(2);
    });

    it('should update province total_clicks on attack', async () => {
      const { data: beforeState } = await supabase
        .from('province_state')
        .select('total_clicks')
        .eq('province_id', testProvinceId)
        .single();

      await supabase.rpc('click_province', {
        p_player_id: testPlayer2Id,
        p_province_id: testProvinceId,
        p_party_id: testParty2Id
      });

      const { data: afterState } = await supabase
        .from('province_state')
        .select('total_clicks')
        .eq('province_id', testProvinceId)
        .single();

      expect(afterState.total_clicks).toBe(beforeState.total_clicks + 1);
    });
  });

  describe('T148: Capture action when shield reaches 0', () => {
    it('should capture province when shield reaches 0', async () => {
      // Set shield to 1 (will become 0 on next attack)
      await supabase
        .from('province_state')
        .update({
          shield_current: 1,
          attack_counts: { [testParty2Id]: 10 }  // Party 2 has attacks
        })
        .eq('province_id', testProvinceId);

      const { data } = await supabase.rpc('click_province', {
        p_player_id: testPlayer2Id,
        p_province_id: testProvinceId,
        p_party_id: testParty2Id
      });

      expect(data.success).toBe(true);
      expect(data.action).toBe('capture');
      expect(data.controlling_party).toBe(testParty2Id);
      expect(data.shield).toBe(5);  // 5% of 100 shield_max
      expect(data.your_attacks).toBe(0);  // Reset after capture
    });

    it('should reset attack counts after capture', async () => {
      // Set shield to 1 with multiple attackers
      await supabase
        .from('province_state')
        .update({
          shield_current: 1,
          attack_counts: {
            [testParty1Id]: 5,
            [testParty2Id]: 20
          }
        })
        .eq('province_id', testProvinceId);

      await supabase.rpc('click_province', {
        p_player_id: testPlayer2Id,
        p_province_id: testProvinceId,
        p_party_id: testParty2Id
      });

      // Verify attack counts reset
      const { data: state } = await supabase
        .from('province_state')
        .select('attack_counts')
        .eq('province_id', testProvinceId)
        .single();

      expect(state.attack_counts).toEqual({});
    });

    it('should award province to highest attacker', async () => {
      // Set up: Party 2 has more attacks than Party 1
      await supabase
        .from('province_state')
        .update({
          shield_current: 1,
          attack_counts: {
            [testParty1Id]: 5,
            [testParty2Id]: 15
          }
        })
        .eq('province_id', testProvinceId);

      // Party 1 delivers final blow, but Party 2 should win
      const { data } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      expect(data.action).toBe('capture');
      expect(data.controlling_party).toBe(testParty2Id);  // Party 2 wins
    });
  });

  describe('T148: Rate limiting (100ms cooldown)', () => {
    it('should return rate limited error for clicks within 100ms', async () => {
      // First click
      const { data: firstClick } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      expect(firstClick.success).toBe(true);

      // Immediate second click (no delay)
      const { data: secondClick } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      expect(secondClick.success).toBe(false);
      expect(secondClick.error).toBe('Rate limited');
    });

    it('should allow click after 100ms cooldown', async () => {
      // First click
      await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      // Wait 150ms (more than 100ms cooldown)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second click should succeed
      const { data } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      expect(data.success).toBe(true);
      expect(data.action).toBe('defend');
    });

    it('should update last_click_at timestamp', async () => {
      const { data: beforePlayer } = await supabase
        .from('players')
        .select('last_click_at')
        .eq('id', testPlayerId)
        .single();

      await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      const { data: afterPlayer } = await supabase
        .from('players')
        .select('last_click_at')
        .eq('id', testPlayerId)
        .single();

      expect(afterPlayer.last_click_at).not.toBe(beforePlayer.last_click_at);
      expect(new Date(afterPlayer.last_click_at).getTime()).toBeGreaterThan(
        beforePlayer.last_click_at ? new Date(beforePlayer.last_click_at).getTime() : 0
      );
    });

    it('should enforce rate limit per player independently', async () => {
      // Player 1 clicks
      await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      // Player 2 clicks immediately (should work)
      const { data } = await supabase.rpc('click_province', {
        p_player_id: testPlayer2Id,
        p_province_id: testProvinceId,
        p_party_id: testParty2Id
      });

      expect(data.success).toBe(true);
      expect(data.action).toBe('attack');
    });
  });
});
