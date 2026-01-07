/**
 * Integration Tests: RealtimeManager (Module 2.1)
 * Tests for RealtimeManager class handling province_state and game_state realtime subscriptions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RealtimeManager } from '../../src/lib/realtime.js';

describe('RealtimeManager - Integration Tests', () => {
  let realtimeManager;
  let mockSupabase;
  let mockChannel;
  let mockSubscribeCallback;
  let provinceChangeHandler;
  let gameStateChangeHandler;

  beforeEach(() => {
    // Reset handlers
    provinceChangeHandler = null;
    gameStateChangeHandler = null;
    mockSubscribeCallback = null;

    // Create mock channel with chainable methods
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockImplementation((callback) => {
        mockSubscribeCallback = callback;
        return mockChannel;
      }),
      unsubscribe: vi.fn()
    };

    // Create mock Supabase client
    mockSupabase = {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn()
    };

    // Mock the supabase module
    vi.mock('../../src/lib/supabase.js', () => ({
      supabase: mockSupabase
    }));

    // Create fresh instance
    realtimeManager = new RealtimeManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty channels and callbacks', () => {
      expect(realtimeManager.channels).toEqual([]);
      expect(realtimeManager.callbacks.province).toEqual([]);
      expect(realtimeManager.callbacks.gameState).toEqual([]);
      expect(realtimeManager.callbacks.connection).toEqual([]);
    });

    it('should initialize with disconnected status', () => {
      expect(realtimeManager.status).toBe('disconnected');
      expect(realtimeManager.getConnectionStatus()).toBe('disconnected');
    });

    it('should initialize reconnect properties', () => {
      expect(realtimeManager.reconnectAttempts).toBe(0);
      expect(realtimeManager.maxReconnectAttempts).toBe(10);
      expect(realtimeManager.baseReconnectDelay).toBe(1000);
      expect(realtimeManager.reconnectTimeout).toBeNull();
    });
  });

  describe('Province State Subscriptions', () => {
    it('should create province channel with correct configuration', () => {
      realtimeManager.subscribeToProvinces();

      expect(mockSupabase.channel).toHaveBeenCalledWith('province-changes');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'province_state'
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should add channel to channels array', () => {
      realtimeManager.subscribeToProvinces();

      expect(realtimeManager.channels).toHaveLength(1);
      expect(realtimeManager.channels[0]).toBe(mockChannel);
    });

    it('should trigger callback on province state change', () => {
      const callback = vi.fn();
      realtimeManager.subscribeToProvinces(callback);

      // Get the postgres_changes handler
      const onCall = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'province_state'
      );
      const provinceHandler = onCall[2];

      const mockPayload = {
        eventType: 'UPDATE',
        new: { province_id: 1, shield_current: 5000 },
        old: { province_id: 1, shield_current: 3000 }
      };

      provinceHandler(mockPayload);

      expect(callback).toHaveBeenCalledWith(mockPayload);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support multiple province change callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      realtimeManager.subscribeToProvinces(callback1);
      realtimeManager.onProvinceChange(callback2);

      const onCall = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'province_state'
      );
      const provinceHandler = onCall[2];

      const mockPayload = {
        eventType: 'UPDATE',
        new: { province_id: 1, shield_current: 5000 }
      };

      provinceHandler(mockPayload);

      expect(callback1).toHaveBeenCalledWith(mockPayload);
      expect(callback2).toHaveBeenCalledWith(mockPayload);
    });

    it('should receive payload with old and new data', () => {
      const callback = vi.fn();
      realtimeManager.onProvinceChange(callback);
      realtimeManager.subscribeToProvinces();

      const onCall = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'province_state'
      );
      const provinceHandler = onCall[2];

      const mockPayload = {
        eventType: 'UPDATE',
        new: {
          province_id: 1,
          shield_current: 8000,
          controlling_party_id: 2
        },
        old: {
          province_id: 1,
          shield_current: 5000,
          controlling_party_id: 1
        }
      };

      provinceHandler(mockPayload);

      expect(callback).toHaveBeenCalledWith(mockPayload);
      expect(callback.mock.calls[0][0].new).toEqual(mockPayload.new);
      expect(callback.mock.calls[0][0].old).toEqual(mockPayload.old);
    });
  });

  describe('Game State Subscriptions', () => {
    it('should create game_state channel with correct configuration', () => {
      realtimeManager.subscribeToGameState();

      expect(mockSupabase.channel).toHaveBeenCalledWith('game-state-changes');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state'
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should trigger callback on game state change', () => {
      const callback = vi.fn();
      realtimeManager.subscribeToGameState(callback);

      const onCall = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'game_state'
      );
      const gameStateHandler = onCall[2];

      const mockPayload = {
        eventType: 'UPDATE',
        new: {
          id: 1,
          total_clicks: 10000,
          total_players: 500
        }
      };

      gameStateHandler(mockPayload);

      expect(callback).toHaveBeenCalledWith(mockPayload);
    });

    it('should receive payload with updated stats', () => {
      const callback = vi.fn();
      realtimeManager.onGameStateChange(callback);
      realtimeManager.subscribeToGameState();

      const onCall = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'game_state'
      );
      const gameStateHandler = onCall[2];

      const mockPayload = {
        eventType: 'UPDATE',
        new: {
          id: 1,
          total_clicks: 15000,
          total_players: 750,
          status: 'active'
        },
        old: {
          id: 1,
          total_clicks: 10000,
          total_players: 500,
          status: 'active'
        }
      };

      gameStateHandler(mockPayload);

      expect(callback).toHaveBeenCalledWith(mockPayload);
      expect(callback.mock.calls[0][0].new.total_clicks).toBe(15000);
      expect(callback.mock.calls[0][0].new.total_players).toBe(750);
    });

    it('should support multiple game state change callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      realtimeManager.subscribeToGameState(callback1);
      realtimeManager.onGameStateChange(callback2);

      const onCall = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'game_state'
      );
      const gameStateHandler = onCall[2];

      const mockPayload = {
        eventType: 'UPDATE',
        new: { id: 1, total_clicks: 5000 }
      };

      gameStateHandler(mockPayload);

      expect(callback1).toHaveBeenCalledWith(mockPayload);
      expect(callback2).toHaveBeenCalledWith(mockPayload);
    });
  });

  describe('Subscribe All Channels', () => {
    it('should subscribe to both province and game state channels', () => {
      realtimeManager.subscribe();

      expect(mockSupabase.channel).toHaveBeenCalledWith('province-changes');
      expect(mockSupabase.channel).toHaveBeenCalledWith('game-state-changes');
      expect(realtimeManager.channels).toHaveLength(2);
    });
  });

  describe('Connection Status Tracking', () => {
    it('should set status to connected on SUBSCRIBED', () => {
      const statusCallback = vi.fn();
      realtimeManager.onConnectionChange(statusCallback);
      realtimeManager.subscribeToProvinces();

      // Simulate SUBSCRIBED status
      mockSubscribeCallback('SUBSCRIBED');

      expect(realtimeManager.getConnectionStatus()).toBe('connected');
      expect(statusCallback).toHaveBeenCalledWith('connected');
    });

    it('should set status to disconnected on CLOSED', () => {
      const statusCallback = vi.fn();
      realtimeManager.onConnectionChange(statusCallback);
      realtimeManager.subscribeToProvinces();

      // First subscribe
      mockSubscribeCallback('SUBSCRIBED');
      vi.clearAllMocks();

      // Then close
      mockSubscribeCallback('CLOSED');

      expect(realtimeManager.getConnectionStatus()).toBe('disconnected');
      expect(statusCallback).toHaveBeenCalledWith('disconnected');
    });

    it('should set status to reconnecting on TIMED_OUT', () => {
      vi.useFakeTimers();

      const statusCallback = vi.fn();
      realtimeManager.onConnectionChange(statusCallback);
      realtimeManager.subscribeToProvinces();

      mockSubscribeCallback('TIMED_OUT');

      expect(realtimeManager.getConnectionStatus()).toBe('reconnecting');
      expect(statusCallback).toHaveBeenCalledWith('reconnecting');

      vi.useRealTimers();
    });

    it('should set status to disconnected on CHANNEL_ERROR', () => {
      const statusCallback = vi.fn();
      realtimeManager.onConnectionChange(statusCallback);
      realtimeManager.subscribeToProvinces();

      mockSubscribeCallback('CHANNEL_ERROR');

      expect(realtimeManager.getConnectionStatus()).toBe('disconnected');
      expect(statusCallback).toHaveBeenCalledWith('disconnected');
    });

    it('should reset reconnect attempts on successful connection', () => {
      realtimeManager.reconnectAttempts = 5;
      realtimeManager.subscribeToProvinces();

      mockSubscribeCallback('SUBSCRIBED');

      expect(realtimeManager.reconnectAttempts).toBe(0);
    });

    it('should not trigger callback if status unchanged', () => {
      const statusCallback = vi.fn();
      realtimeManager.onConnectionChange(statusCallback);
      realtimeManager.subscribeToProvinces();

      mockSubscribeCallback('SUBSCRIBED');
      statusCallback.mockClear();

      // Try to set same status
      realtimeManager._setStatus('connected');

      expect(statusCallback).not.toHaveBeenCalled();
    });
  });

  describe('Auto-Reconnect', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should attempt reconnect on connection loss', () => {
      realtimeManager.subscribeToProvinces();
      mockSubscribeCallback('SUBSCRIBED');

      // Simulate connection loss
      mockSubscribeCallback('CLOSED');

      expect(realtimeManager.reconnectTimeout).not.toBeNull();
      expect(realtimeManager.reconnectAttempts).toBe(1);
    });

    it('should use exponential backoff for reconnect delays', () => {
      realtimeManager.subscribeToProvinces();

      // First reconnect attempt
      mockSubscribeCallback('CLOSED');
      const delay1 = realtimeManager._calculateBackoff();

      // Second reconnect attempt
      realtimeManager.reconnectAttempts = 2;
      const delay2 = realtimeManager._calculateBackoff();

      // Second delay should be longer (exponential)
      expect(delay2).toBeGreaterThan(delay1);
    });

    it('should cap reconnect delay at 30 seconds', () => {
      realtimeManager.reconnectAttempts = 100;
      const delay = realtimeManager._calculateBackoff();

      // Max delay is 30000ms + jitter (up to 1000ms)
      expect(delay).toBeLessThanOrEqual(31000);
    });

    it('should add jitter to reconnect delay', () => {
      const delays = [];
      for (let i = 0; i < 10; i++) {
        realtimeManager.reconnectAttempts = 3;
        delays.push(realtimeManager._calculateBackoff());
      }

      // With jitter, delays should vary
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it('should stop reconnecting after max attempts', () => {
      const statusCallback = vi.fn();
      realtimeManager.onConnectionChange(statusCallback);
      realtimeManager.reconnectAttempts = 10;
      realtimeManager.subscribeToProvinces();

      mockSubscribeCallback('CLOSED');

      expect(realtimeManager.reconnectTimeout).toBeNull();
      expect(realtimeManager.getConnectionStatus()).toBe('disconnected');
    });

    it('should clear previous reconnect timeout before new attempt', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      realtimeManager.subscribeToProvinces();
      mockSubscribeCallback('CLOSED');

      const firstTimeout = realtimeManager.reconnectTimeout;

      // Trigger another reconnect
      mockSubscribeCallback('TIMED_OUT');

      expect(clearTimeoutSpy).toHaveBeenCalledWith(firstTimeout);
    });

    it('should unsubscribe and resubscribe on reconnect', () => {
      realtimeManager.subscribe();
      mockSubscribeCallback('SUBSCRIBED');

      // Simulate connection loss
      mockSubscribeCallback('CLOSED');

      // Fast-forward time to trigger reconnect
      vi.advanceTimersByTime(3000);

      // Should have unsubscribed from old channels and created new ones
      expect(mockSupabase.removeChannel).toHaveBeenCalled();
      expect(mockSupabase.channel).toHaveBeenCalledTimes(4); // 2 initial + 2 reconnect
    });
  });

  describe('Unsubscribe and Cleanup', () => {
    it('should remove all channels on unsubscribe', () => {
      realtimeManager.subscribe();

      expect(realtimeManager.channels).toHaveLength(2);

      realtimeManager.unsubscribe();

      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(2);
      expect(realtimeManager.channels).toHaveLength(0);
    });

    it('should clear reconnect timeout on unsubscribe', () => {
      vi.useFakeTimers();

      realtimeManager.subscribeToProvinces();
      mockSubscribeCallback('CLOSED');

      expect(realtimeManager.reconnectTimeout).not.toBeNull();

      realtimeManager.unsubscribe();

      expect(realtimeManager.reconnectTimeout).toBeNull();

      vi.useRealTimers();
    });

    it('should set status to disconnected on unsubscribe', () => {
      const statusCallback = vi.fn();
      realtimeManager.onConnectionChange(statusCallback);
      realtimeManager.subscribeToProvinces();
      mockSubscribeCallback('SUBSCRIBED');

      statusCallback.mockClear();

      realtimeManager.unsubscribe();

      expect(realtimeManager.getConnectionStatus()).toBe('disconnected');
      expect(statusCallback).toHaveBeenCalledWith('disconnected');
    });

    it('should handle unsubscribe when no channels exist', () => {
      expect(() => realtimeManager.unsubscribe()).not.toThrow();
      expect(realtimeManager.channels).toHaveLength(0);
    });
  });

  describe('Event Emitter Pattern', () => {
    describe('onProvinceChange', () => {
      it('should add callback to province listeners', () => {
        const callback = vi.fn();
        realtimeManager.onProvinceChange(callback);

        expect(realtimeManager.callbacks.province).toContain(callback);
      });

      it('should return unsubscribe function', () => {
        const callback = vi.fn();
        const unsubscribe = realtimeManager.onProvinceChange(callback);

        expect(typeof unsubscribe).toBe('function');
        expect(realtimeManager.callbacks.province).toContain(callback);

        unsubscribe();

        expect(realtimeManager.callbacks.province).not.toContain(callback);
      });

      it('should throw error if callback is not a function', () => {
        expect(() => realtimeManager.onProvinceChange('not a function')).toThrow(
          'Callback must be a function'
        );
      });
    });

    describe('onGameStateChange', () => {
      it('should add callback to game state listeners', () => {
        const callback = vi.fn();
        realtimeManager.onGameStateChange(callback);

        expect(realtimeManager.callbacks.gameState).toContain(callback);
      });

      it('should return unsubscribe function', () => {
        const callback = vi.fn();
        const unsubscribe = realtimeManager.onGameStateChange(callback);

        expect(typeof unsubscribe).toBe('function');
        expect(realtimeManager.callbacks.gameState).toContain(callback);

        unsubscribe();

        expect(realtimeManager.callbacks.gameState).not.toContain(callback);
      });

      it('should throw error if callback is not a function', () => {
        expect(() => realtimeManager.onGameStateChange(null)).toThrow(
          'Callback must be a function'
        );
      });
    });

    describe('onConnectionChange', () => {
      it('should add callback to connection listeners', () => {
        const callback = vi.fn();
        realtimeManager.onConnectionChange(callback);

        expect(realtimeManager.callbacks.connection).toContain(callback);
      });

      it('should return unsubscribe function', () => {
        const callback = vi.fn();
        const unsubscribe = realtimeManager.onConnectionChange(callback);

        expect(typeof unsubscribe).toBe('function');
        expect(realtimeManager.callbacks.connection).toContain(callback);

        unsubscribe();

        expect(realtimeManager.callbacks.connection).not.toContain(callback);
      });

      it('should throw error if callback is not a function', () => {
        expect(() => realtimeManager.onConnectionChange(123)).toThrow(
          'Callback must be a function'
        );
      });
    });

    it('should support multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      realtimeManager.onProvinceChange(callback1);
      realtimeManager.onProvinceChange(callback2);
      realtimeManager.onProvinceChange(callback3);

      expect(realtimeManager.callbacks.province).toHaveLength(3);
    });

    it('should only remove specific callback on unsubscribe', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      realtimeManager.onProvinceChange(callback1);
      const unsubscribe2 = realtimeManager.onProvinceChange(callback2);
      realtimeManager.onProvinceChange(callback3);

      unsubscribe2();

      expect(realtimeManager.callbacks.province).toContain(callback1);
      expect(realtimeManager.callbacks.province).not.toContain(callback2);
      expect(realtimeManager.callbacks.province).toContain(callback3);
      expect(realtimeManager.callbacks.province).toHaveLength(2);
    });

    it('should handle unsubscribe called multiple times', () => {
      const callback = vi.fn();
      const unsubscribe = realtimeManager.onProvinceChange(callback);

      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
      expect(realtimeManager.callbacks.province).not.toContain(callback);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full lifecycle: subscribe, receive updates, unsubscribe', () => {
      const provinceCallback = vi.fn();
      const gameStateCallback = vi.fn();
      const statusCallback = vi.fn();

      realtimeManager.onProvinceChange(provinceCallback);
      realtimeManager.onGameStateChange(gameStateCallback);
      realtimeManager.onConnectionChange(statusCallback);

      // Subscribe
      realtimeManager.subscribe();
      mockSubscribeCallback('SUBSCRIBED');

      expect(statusCallback).toHaveBeenCalledWith('connected');

      // Receive province update
      const provinceOnCall = mockChannel.on.mock.calls.find(
        call => call[1].table === 'province_state'
      );
      provinceOnCall[2]({ eventType: 'UPDATE', new: { province_id: 1 } });

      expect(provinceCallback).toHaveBeenCalled();

      // Receive game state update
      const gameStateOnCall = mockChannel.on.mock.calls.find(
        call => call[1].table === 'game_state'
      );
      gameStateOnCall[2]({ eventType: 'UPDATE', new: { total_clicks: 1000 } });

      expect(gameStateCallback).toHaveBeenCalled();

      // Unsubscribe
      realtimeManager.unsubscribe();

      expect(realtimeManager.getConnectionStatus()).toBe('disconnected');
      expect(realtimeManager.channels).toHaveLength(0);
    });

    it('should handle reconnect after temporary disconnection', () => {
      vi.useFakeTimers();

      const statusCallback = vi.fn();
      realtimeManager.onConnectionChange(statusCallback);
      realtimeManager.subscribe();

      // Initial connection
      mockSubscribeCallback('SUBSCRIBED');
      expect(statusCallback).toHaveBeenCalledWith('connected');

      // Temporary disconnection
      mockSubscribeCallback('TIMED_OUT');
      expect(statusCallback).toHaveBeenCalledWith('reconnecting');
      expect(realtimeManager.reconnectAttempts).toBe(1);

      // Trigger reconnect
      vi.advanceTimersByTime(3000);

      // Reconnection successful
      mockSubscribeCallback('SUBSCRIBED');
      expect(realtimeManager.reconnectAttempts).toBe(0);
      expect(realtimeManager.getConnectionStatus()).toBe('connected');

      vi.useRealTimers();
    });

    it('should handle multiple simultaneous subscriptions', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      const unsub1 = realtimeManager.onProvinceChange(callback1);
      const unsub2 = realtimeManager.onGameStateChange(callback2);
      const unsub3 = realtimeManager.onConnectionChange(callback3);

      realtimeManager.subscribe();
      mockSubscribeCallback('SUBSCRIBED');

      // All callbacks should work
      expect(callback3).toHaveBeenCalledWith('connected');

      // Selective unsubscribe
      unsub1();
      unsub2();

      // Connection callback should still work
      realtimeManager._setStatus('reconnecting');
      expect(callback3).toHaveBeenCalledWith('reconnecting');

      unsub3();
      realtimeManager._setStatus('connected');
      expect(callback3).toHaveBeenCalledTimes(1); // Not called after unsubscribe
    });
  });
});
