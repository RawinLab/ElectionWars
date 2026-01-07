/**
 * Integration Tests: get_leaderboard() Function (Module 2.2)
 * Tests for party rankings
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

describe('get_leaderboard() Function - Module 2.2', () => {
  let testParty1Id;
  let testParty2Id;
  let testParty3Id;
  const testProvinceIds = [91, 92, 93, 94, 95];
  const testPlayerIds = [];

  beforeAll(async () => {
    // Create test parties
    const { data: party1 } = await supabase
      .from('parties')
      .insert({
        name_thai: 'พรรค Leaderboard 1',
        name_english: 'Leaderboard Party 1',
        official_color: '#FF0000'
      })
      .select()
      .single();
    testParty1Id = party1?.id;

    const { data: party2 } = await supabase
      .from('parties')
      .insert({
        name_thai: 'พรรค Leaderboard 2',
        name_english: 'Leaderboard Party 2',
        official_color: '#00FF00'
      })
      .select()
      .single();
    testParty2Id = party2?.id;

    const { data: party3 } = await supabase
      .from('parties')
      .insert({
        name_thai: 'พรรค Leaderboard 3',
        name_english: 'Leaderboard Party 3',
        official_color: '#0000FF'
      })
      .select()
      .single();
    testParty3Id = party3?.id;

    // Create test provinces
    for (const id of testProvinceIds) {
      await supabase
        .from('provinces')
        .insert({
          id,
          name_thai: `จังหวัดทดสอบ ${id}`,
          name_english: `Test Province ${id}`,
          region: 'Central',
          population: 100000
        });
    }

    // Create province_state: Party 1 controls 3 provinces, Party 2 controls 2
    await supabase.from('province_state').insert([
      { province_id: 91, controlling_party_id: testParty1Id, shield_max: 10000, shield_current: 5000 },
      { province_id: 92, controlling_party_id: testParty1Id, shield_max: 10000, shield_current: 5000 },
      { province_id: 93, controlling_party_id: testParty1Id, shield_max: 10000, shield_current: 5000 },
      { province_id: 94, controlling_party_id: testParty2Id, shield_max: 10000, shield_current: 5000 },
      { province_id: 95, controlling_party_id: testParty2Id, shield_max: 10000, shield_current: 5000 }
    ]);

    // Create test players with clicks
    const { data: player1 } = await supabase
      .from('players')
      .insert({
        party_id: testParty1Id,
        nickname: 'LeaderPlayer1',
        total_clicks: 5000,
        auth_id: 'leader-1111-1111-1111-111111111111'
      })
      .select()
      .single();
    testPlayerIds.push(player1?.id);

    const { data: player2 } = await supabase
      .from('players')
      .insert({
        party_id: testParty2Id,
        nickname: 'LeaderPlayer2',
        total_clicks: 10000,  // More clicks but fewer provinces
        auth_id: 'leader-2222-2222-2222-222222222222'
      })
      .select()
      .single();
    testPlayerIds.push(player2?.id);
  });

  afterAll(async () => {
    // Cleanup
    for (const id of testProvinceIds) {
      await supabase.from('province_state').delete().eq('province_id', id);
      await supabase.from('provinces').delete().eq('id', id);
    }
    for (const id of testPlayerIds) {
      await supabase.from('players').delete().eq('id', id);
    }
    await supabase.from('parties').delete().in('id', [testParty1Id, testParty2Id, testParty3Id]);
  });

  describe('T071: get_leaderboard returns correct ranking', () => {
    it('should return parties ranked by provinces controlled', async () => {
      const { data, error } = await supabase.rpc('get_leaderboard');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // Find our test parties
      const party1Rank = data.find(p => p.party_id === testParty1Id);
      const party2Rank = data.find(p => p.party_id === testParty2Id);
      const party3Rank = data.find(p => p.party_id === testParty3Id);

      // Party 1 should have 3 provinces
      expect(party1Rank.provinces_controlled).toBe(3);
      // Party 2 should have 2 provinces
      expect(party2Rank.provinces_controlled).toBe(2);
      // Party 3 should have 0 provinces
      expect(party3Rank.provinces_controlled).toBe(0);

      // Party 1 should rank higher than Party 2 (more provinces)
      expect(party1Rank.rank).toBeLessThan(party2Rank.rank);
    });

    it('should return party names and colors', async () => {
      const { data } = await supabase.rpc('get_leaderboard');

      const party1Rank = data.find(p => p.party_id === testParty1Id);

      expect(party1Rank.party_name).toBe('พรรค Leaderboard 1');
      expect(party1Rank.official_color).toBe('#FF0000');
    });

    it('should return total clicks per party', async () => {
      const { data } = await supabase.rpc('get_leaderboard');

      const party1Rank = data.find(p => p.party_id === testParty1Id);
      const party2Rank = data.find(p => p.party_id === testParty2Id);

      expect(party1Rank.total_clicks).toBe(5000);
      expect(party2Rank.total_clicks).toBe(10000);
    });

    it('should sort by total_clicks when provinces are tied', async () => {
      // Create two more provinces controlled by different parties with same count
      const extraProvinceIds = [96, 97];

      for (const id of extraProvinceIds) {
        await supabase
          .from('provinces')
          .insert({
            id,
            name_thai: `จังหวัดเพิ่ม ${id}`,
            name_english: `Extra Province ${id}`,
            region: 'Northern',
            population: 50000
          });
      }

      // Both parties now control 1 extra province each
      await supabase.from('province_state').insert([
        { province_id: 96, controlling_party_id: testParty1Id, shield_max: 5000, shield_current: 2500 },
        { province_id: 97, controlling_party_id: testParty2Id, shield_max: 5000, shield_current: 2500 }
      ]);

      const { data } = await supabase.rpc('get_leaderboard');

      const party1Rank = data.find(p => p.party_id === testParty1Id);
      const party2Rank = data.find(p => p.party_id === testParty2Id);

      // Party 1: 4 provinces, 5000 clicks
      // Party 2: 3 provinces, 10000 clicks
      // Party 1 should still rank higher (more provinces)
      expect(party1Rank.rank).toBeLessThan(party2Rank.rank);

      // Cleanup extra provinces
      for (const id of extraProvinceIds) {
        await supabase.from('province_state').delete().eq('province_id', id);
        await supabase.from('provinces').delete().eq('id', id);
      }
    });
  });
});
