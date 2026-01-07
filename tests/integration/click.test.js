/**
 * Integration Tests: click_province() Function (Module 2.2)
 * Tests for shield system mechanics: defend, attack, capture
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

describe('click_province() Function - Module 2.2', () => {
  let testParty1Id;
  let testParty2Id;
  let testProvinceId = 97;
  let testPlayerId;
  let testPlayer2Id;

  beforeAll(async () => {
    // Create test parties
    const { data: party1 } = await supabase
      .from('parties')
      .insert({
        name_thai: 'พรรคทดสอบ 1',
        name_english: 'Test Party 1',
        official_color: '#FF0000'
      })
      .select()
      .single();
    testParty1Id = party1?.id;

    const { data: party2 } = await supabase
      .from('parties')
      .insert({
        name_thai: 'พรรคทดสอบ 2',
        name_english: 'Test Party 2',
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
        name_thai: 'จังหวัดทดสอบ Click',
        name_english: 'Click Test Province',
        region: 'Central',
        population: 1000  // shield_max = 100
      });

    // Create test players
    const { data: player1 } = await supabase
      .from('players')
      .insert({
        party_id: testParty1Id,
        nickname: 'ClickTestPlayer1',
        auth_id: '11111111-1111-1111-1111-111111111111'
      })
      .select()
      .single();
    testPlayerId = player1?.id;

    const { data: player2 } = await supabase
      .from('players')
      .insert({
        party_id: testParty2Id,
        nickname: 'ClickTestPlayer2',
        auth_id: '22222222-2222-2222-2222-222222222222'
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

  describe('T049: Defend action', () => {
    it('should add +1 shield when own party clicks', async () => {
      const { data, error } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      expect(data.action).toBe('defend');
      expect(data.shield).toBe(51);  // 50 + 1
      expect(data.controlling_party).toBe(testParty1Id);
    });

    it('should not exceed shield_max', async () => {
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
  });

  describe('T050: Attack action', () => {
    it('should reduce -1 shield when enemy party clicks', async () => {
      const { data, error } = await supabase.rpc('click_province', {
        p_player_id: testPlayer2Id,
        p_province_id: testProvinceId,
        p_party_id: testParty2Id
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      expect(data.action).toBe('attack');
      expect(data.shield).toBe(49);  // 50 - 1
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

      // Reset last_click_at
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
  });

  describe('T051: Capture action', () => {
    it('should capture when shield reaches 0', async () => {
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
  });

  describe('T052: Rate limiting', () => {
    it('should return rate limited error within 100ms', async () => {
      // First click
      await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      // Immediate second click (no delay)
      const { data } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      expect(data.success).toBe(false);
      expect(data.error).toBe('Rate limited');
    });

    it('should allow click after 100ms', async () => {
      // First click
      await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      // Wait 150ms
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second click should work
      const { data } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id
      });

      expect(data.success).toBe(true);
    });
  });

  describe('T053: Highest attacker wins', () => {
    it('should give province to party with most attacks', async () => {
      // Set up attack counts: Party 2 has more attacks than any other
      await supabase
        .from('province_state')
        .update({
          shield_current: 1,
          attack_counts: {
            [testParty1Id]: 5,
            [testParty2Id]: 20  // Party 2 has more
          }
        })
        .eq('province_id', testProvinceId);

      // Final attack by Party 1 (but Party 2 should win)
      const { data } = await supabase.rpc('click_province', {
        p_player_id: testPlayerId,
        p_province_id: testProvinceId,
        p_party_id: testParty1Id  // Party 1 attacks but Party 2 should capture
      });

      expect(data.success).toBe(true);
      expect(data.action).toBe('capture');
      // The party with most attacks wins, which is Party 2
      expect(data.controlling_party).toBe(testParty2Id);
    });
  });
});
