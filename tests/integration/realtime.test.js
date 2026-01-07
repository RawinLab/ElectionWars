/**
 * Integration Tests: Realtime Subscriptions (Module 2.1)
 * Tests for province_state and game_state realtime updates
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Realtime Subscriptions - Module 2.1', () => {
  let testProvinceId = 98;
  let testPartyId;
  let channel;

  beforeAll(async () => {
    // Create test party
    const { data: party } = await supabase
      .from('parties')
      .insert({
        name_thai: 'พรรคทดสอบ Realtime',
        name_english: 'Realtime Test Party',
        official_color: '#FF00FF'
      })
      .select()
      .single();

    testPartyId = party?.id;

    // Create test province
    await supabase
      .from('provinces')
      .insert({
        id: testProvinceId,
        name_thai: 'จังหวัดทดสอบ Realtime',
        name_english: 'Realtime Test Province',
        region: 'Central',
        population: 500000
      });

    // Create province_state for test province
    await supabase
      .from('province_state')
      .insert({
        province_id: testProvinceId,
        shield_max: 50000,
        shield_current: 25000,
        controlling_party_id: null
      });
  });

  afterAll(async () => {
    // Cleanup
    if (channel) {
      supabase.removeChannel(channel);
    }
    await supabase.from('province_state').delete().eq('province_id', testProvinceId);
    await supabase.from('provinces').delete().eq('id', testProvinceId);
    if (testPartyId) {
      await supabase.from('parties').delete().eq('id', testPartyId);
    }
  });

  describe('US-006: Province State Realtime', () => {
    it('T033: should receive realtime updates on province_state changes', async () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for realtime update'));
        }, 10000);

        let updateReceived = false;

        // Subscribe to province_state changes
        channel = supabase
          .channel('province_state_test')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'province_state',
              filter: `province_id=eq.${testProvinceId}`
            },
            (payload) => {
              if (!updateReceived) {
                updateReceived = true;
                clearTimeout(timeout);

                expect(payload.new).toBeDefined();
                expect(payload.new.province_id).toBe(testProvinceId);
                expect(payload.new.shield_current).toBe(30000);

                resolve();
              }
            }
          )
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // Trigger an update after subscription is active
              await supabase
                .from('province_state')
                .update({ shield_current: 30000 })
                .eq('province_id', testProvinceId);
            }
          });
      });
    }, 15000);

    it('should receive realtime updates when controlling party changes', async () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for party change update'));
        }, 10000);

        let updateReceived = false;

        const partyChannel = supabase
          .channel('party_change_test')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'province_state',
              filter: `province_id=eq.${testProvinceId}`
            },
            (payload) => {
              if (!updateReceived && payload.new.controlling_party_id === testPartyId) {
                updateReceived = true;
                clearTimeout(timeout);

                expect(payload.new.controlling_party_id).toBe(testPartyId);

                supabase.removeChannel(partyChannel);
                resolve();
              }
            }
          )
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // Update controlling party
              await supabase
                .from('province_state')
                .update({ controlling_party_id: testPartyId })
                .eq('province_id', testProvinceId);
            }
          });
      });
    }, 15000);
  });

  describe('US-008: Game State Realtime', () => {
    it('should receive realtime updates on game_state changes', async () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for game_state update'));
        }, 10000);

        let updateReceived = false;
        const newClickCount = Math.floor(Math.random() * 10000);

        const gameChannel = supabase
          .channel('game_state_test')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'game_state'
            },
            (payload) => {
              if (!updateReceived && payload.new.total_clicks === newClickCount) {
                updateReceived = true;
                clearTimeout(timeout);

                expect(payload.new.id).toBe(1);
                expect(payload.new.total_clicks).toBe(newClickCount);

                supabase.removeChannel(gameChannel);

                // Reset game_state
                supabase
                  .from('game_state')
                  .update({ total_clicks: 0 })
                  .eq('id', 1)
                  .then(() => resolve());
              }
            }
          )
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // Update game_state
              await supabase
                .from('game_state')
                .update({ total_clicks: newClickCount })
                .eq('id', 1);
            }
          });
      });
    }, 15000);
  });
});
