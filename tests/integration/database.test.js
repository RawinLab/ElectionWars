/**
 * Integration Tests: Database Tables (Module 2.1)
 * Tests for parties, provinces, players, and game_state tables
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test client - uses service role for full access
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Database Tables - Module 2.1', () => {

  describe('US-004: Parties Table', () => {
    const testParty = {
      name_thai: 'พรรคทดสอบ',
      name_english: 'Test Party',
      ballot_number: 999,
      official_color: '#FF0000',
      pattern_type: 'solid',
      leader_name: 'Test Leader',
      mp_count: 10
    };

    let insertedPartyId;

    afterAll(async () => {
      // Cleanup test data
      if (insertedPartyId) {
        await supabase.from('parties').delete().eq('id', insertedPartyId);
      }
    });

    it('T025: should INSERT party records correctly', async () => {
      const { data, error } = await supabase
        .from('parties')
        .insert(testParty)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.name_thai).toBe(testParty.name_thai);
      expect(data.name_english).toBe(testParty.name_english);
      expect(data.ballot_number).toBe(testParty.ballot_number);
      expect(data.official_color).toBe(testParty.official_color);
      expect(data.pattern_type).toBe(testParty.pattern_type);
      expect(data.leader_name).toBe(testParty.leader_name);
      expect(data.mp_count).toBe(testParty.mp_count);
      expect(data.created_at).toBeDefined();
      expect(data.updated_at).toBeDefined();

      insertedPartyId = data.id;
    });

    it('should enforce unique ballot_number constraint', async () => {
      const duplicateParty = {
        ...testParty,
        name_thai: 'พรรคซ้ำ',
        name_english: 'Duplicate Party'
      };

      const { error } = await supabase
        .from('parties')
        .insert(duplicateParty);

      expect(error).not.toBeNull();
      expect(error.code).toBe('23505'); // Unique violation
    });

    it('should allow NULL ballot_number', async () => {
      const partyWithoutBallot = {
        name_thai: 'พรรคไม่มีหมายเลข',
        name_english: 'No Ballot Party',
        official_color: '#00FF00'
      };

      const { data, error } = await supabase
        .from('parties')
        .insert(partyWithoutBallot)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.ballot_number).toBeNull();

      // Cleanup
      await supabase.from('parties').delete().eq('id', data.id);
    });
  });

  describe('US-005: Provinces Table', () => {
    const testProvince = {
      id: 99, // Test province ID outside normal range
      name_thai: 'จังหวัดทดสอบ',
      name_english: 'Test Province',
      region: 'Central',
      population: 1000000
    };

    afterAll(async () => {
      // Cleanup
      await supabase.from('province_state').delete().eq('province_id', testProvince.id);
      await supabase.from('provinces').delete().eq('id', testProvince.id);
    });

    it('T028: should INSERT province records correctly', async () => {
      const { data, error } = await supabase
        .from('provinces')
        .insert(testProvince)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBe(testProvince.id);
      expect(data.name_thai).toBe(testProvince.name_thai);
      expect(data.name_english).toBe(testProvince.name_english);
      expect(data.region).toBe(testProvince.region);
      expect(data.population).toBe(testProvince.population);
      expect(data.created_at).toBeDefined();
    });

    it('should enforce unique name_thai constraint', async () => {
      const duplicateProvince = {
        id: 100,
        name_thai: testProvince.name_thai,
        name_english: 'Duplicate Province',
        region: 'Northern',
        population: 500000
      };

      const { error } = await supabase
        .from('provinces')
        .insert(duplicateProvince);

      expect(error).not.toBeNull();
      expect(error.code).toBe('23505'); // Unique violation
    });

    it('should require population field', async () => {
      const provinceWithoutPop = {
        id: 101,
        name_thai: 'จังหวัดไม่มีประชากร',
        name_english: 'No Population Province',
        region: 'Southern'
        // population is missing
      };

      const { error } = await supabase
        .from('provinces')
        .insert(provinceWithoutPop);

      expect(error).not.toBeNull();
    });
  });

  describe('US-007: Players Table', () => {
    let testPartyId;
    let testPlayerId;

    beforeAll(async () => {
      // Create a test party first
      const { data } = await supabase
        .from('parties')
        .insert({
          name_thai: 'พรรคสำหรับทดสอบผู้เล่น',
          name_english: 'Player Test Party',
          official_color: '#0000FF'
        })
        .select()
        .single();

      testPartyId = data?.id;
    });

    afterAll(async () => {
      // Cleanup
      if (testPlayerId) {
        await supabase.from('players').delete().eq('id', testPlayerId);
      }
      if (testPartyId) {
        await supabase.from('parties').delete().eq('id', testPartyId);
      }
    });

    it('T038: should INSERT player and enforce foreign key constraints', async () => {
      const testPlayer = {
        party_id: testPartyId,
        nickname: 'TestPlayer',
        total_clicks: 0
      };

      const { data, error } = await supabase
        .from('players')
        .insert(testPlayer)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.party_id).toBe(testPartyId);
      expect(data.nickname).toBe(testPlayer.nickname);
      expect(data.total_clicks).toBe(0);
      expect(data.id).toBeDefined(); // UUID generated
      expect(data.created_at).toBeDefined();
      expect(data.last_active).toBeDefined();

      testPlayerId = data.id;
    });

    it('should reject player with invalid party_id', async () => {
      const invalidPlayer = {
        party_id: 999999, // Non-existent party
        nickname: 'InvalidPlayer'
      };

      const { error } = await supabase
        .from('players')
        .insert(invalidPlayer);

      expect(error).not.toBeNull();
      expect(error.code).toBe('23503'); // Foreign key violation
    });

    it('should allow unique auth_id', async () => {
      const playerWithAuth = {
        party_id: testPartyId,
        nickname: 'AuthPlayer',
        auth_id: '00000000-0000-0000-0000-000000000001'
      };

      const { data, error } = await supabase
        .from('players')
        .insert(playerWithAuth)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.auth_id).toBe(playerWithAuth.auth_id);

      // Cleanup
      await supabase.from('players').delete().eq('id', data.id);
    });

    it('should enforce unique auth_id constraint', async () => {
      const authId = '00000000-0000-0000-0000-000000000002';

      // Insert first player
      const { data: player1 } = await supabase
        .from('players')
        .insert({
          party_id: testPartyId,
          nickname: 'Player1',
          auth_id: authId
        })
        .select()
        .single();

      // Try to insert second player with same auth_id
      const { error } = await supabase
        .from('players')
        .insert({
          party_id: testPartyId,
          nickname: 'Player2',
          auth_id: authId
        });

      expect(error).not.toBeNull();
      expect(error.code).toBe('23505'); // Unique violation

      // Cleanup
      if (player1) {
        await supabase.from('players').delete().eq('id', player1.id);
      }
    });
  });

  describe('US-008: Game State Table (Singleton)', () => {
    it('T042: should have exactly one row (singleton)', async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('*');

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(1);
    });

    it('should reject INSERT of second row (singleton constraint)', async () => {
      const { error } = await supabase
        .from('game_state')
        .insert({ id: 2 });

      expect(error).not.toBeNull();
      // Should fail due to CHECK constraint (id = 1)
    });

    it('should have correct default values', async () => {
      const { data } = await supabase
        .from('game_state')
        .select('*')
        .single();

      expect(data.total_clicks).toBe(0);
      expect(data.total_players).toBe(0);
      expect(data.status).toBe('active');
      expect(data.game_end_time).toBeDefined();
    });

    it('should allow UPDATE of singleton row', async () => {
      const { data, error } = await supabase
        .from('game_state')
        .update({ total_clicks: 100 })
        .eq('id', 1)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.total_clicks).toBe(100);

      // Reset for other tests
      await supabase
        .from('game_state')
        .update({ total_clicks: 0 })
        .eq('id', 1);
    });
  });
});
