/**
 * Unit tests for GameTimer class
 * Tests countdown calculation, display updates, and expiration handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameTimer } from '../../src/components/Timer.js';

describe('GameTimer', () => {
  let container;
  let endDate;
  let timer;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    container.id = 'timer-container';
    document.body.appendChild(container);

    // Use fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up timer
    if (timer) {
      timer.stop();
    }

    // Remove container
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // Restore real timers
    vi.useRealTimers();
  });

  describe('Countdown Calculation', () => {
    it('should calculate correct time remaining', () => {
      // Set current date to 2026-01-08 00:00:00
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      // End date is 5 days, 3 hours, 30 minutes, 45 seconds in the future
      endDate = new Date(now.getTime() +
        (5 * 24 * 60 * 60 * 1000) + // 5 days
        (3 * 60 * 60 * 1000) +       // 3 hours
        (30 * 60 * 1000) +           // 30 minutes
        (45 * 1000)                  // 45 seconds
      );

      timer = new GameTimer(container, endDate);
      const timeLeft = timer.calculateTimeLeft();

      expect(timeLeft.days).toBe(5);
      expect(timeLeft.hours).toBe(3);
      expect(timeLeft.minutes).toBe(30);
      expect(timeLeft.seconds).toBe(45);
    });

    it('should return all zeros when end date is in the past', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      // End date is 1 day in the past
      endDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));

      timer = new GameTimer(container, endDate);
      const timeLeft = timer.calculateTimeLeft();

      expect(timeLeft.days).toBe(0);
      expect(timeLeft.hours).toBe(0);
      expect(timeLeft.minutes).toBe(0);
      expect(timeLeft.seconds).toBe(0);
    });

    it('should handle exact expiration time', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime()); // Exact same time

      timer = new GameTimer(container, endDate);
      const timeLeft = timer.calculateTimeLeft();

      expect(timeLeft.days).toBe(0);
      expect(timeLeft.hours).toBe(0);
      expect(timeLeft.minutes).toBe(0);
      expect(timeLeft.seconds).toBe(0);
    });

    it('should calculate time correctly for different durations', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      // Test 1 hour, 23 minutes, 45 seconds
      endDate = new Date(now.getTime() +
        (1 * 60 * 60 * 1000) +  // 1 hour
        (23 * 60 * 1000) +      // 23 minutes
        (45 * 1000)             // 45 seconds
      );

      timer = new GameTimer(container, endDate);
      const timeLeft = timer.calculateTimeLeft();

      expect(timeLeft.days).toBe(0);
      expect(timeLeft.hours).toBe(1);
      expect(timeLeft.minutes).toBe(23);
      expect(timeLeft.seconds).toBe(45);
    });
  });

  describe('Display Updates', () => {
    it('should update display every second', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + (10 * 1000)); // 10 seconds
      timer = new GameTimer(container, endDate);

      timer.start();

      // Initial render shows 00:00:00:10
      expect(container.textContent).toContain('10');

      // Advance 1 second
      vi.advanceTimersByTime(1000);
      expect(container.textContent).toContain('09');

      // Advance another second
      vi.advanceTimersByTime(1000);
      expect(container.textContent).toContain('08');
    });

    it('should display timer segments with labels', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days
      timer = new GameTimer(container, endDate);

      timer.render();

      expect(container.textContent).toContain('Days');
      expect(container.textContent).toContain('Hours');
      expect(container.textContent).toContain('Min');
      expect(container.textContent).toContain('Sec');
    });

    it('should pad numbers with leading zeros', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() +
        (5 * 1000) + // 5 seconds
        (3 * 60 * 1000) // 3 minutes
      );
      timer = new GameTimer(container, endDate);

      timer.render();

      const values = container.querySelectorAll('.timer-value');
      expect(values[0].textContent).toBe('00'); // days
      expect(values[1].textContent).toBe('00'); // hours
      expect(values[2].textContent).toBe('03'); // minutes
      expect(values[3].textContent).toBe('05'); // seconds
    });

    it('should use timer-display class when active', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 10000); // 10 seconds
      timer = new GameTimer(container, endDate);

      timer.render();

      const display = container.querySelector('.timer-display');
      expect(display).toBeTruthy();
    });
  });

  describe('Expiration Handling', () => {
    it('should show "Game Ended!" when countdown reaches 0', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 2000); // 2 seconds
      timer = new GameTimer(container, endDate);

      timer.start();

      // Advance past expiration
      vi.advanceTimersByTime(3000);

      expect(container.textContent).toContain('Game Ended');
    });

    it('should call onExpire callback when countdown reaches 0', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 2000); // 2 seconds
      timer = new GameTimer(container, endDate);

      const onExpireCallback = vi.fn();
      timer.onExpire(onExpireCallback);

      timer.start();

      // Should not be called initially
      expect(onExpireCallback).not.toHaveBeenCalled();

      // Advance past expiration
      vi.advanceTimersByTime(3000);

      expect(onExpireCallback).toHaveBeenCalledTimes(1);
    });

    it('should call onExpire callback only once', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 2000); // 2 seconds
      timer = new GameTimer(container, endDate);

      const onExpireCallback = vi.fn();
      timer.onExpire(onExpireCallback);

      timer.start();

      // Advance well past expiration
      vi.advanceTimersByTime(10000);

      // Should only be called once despite multiple renders
      expect(onExpireCallback).toHaveBeenCalledTimes(1);
    });

    it('should not call onExpire if no callback registered', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 1000); // 1 second
      timer = new GameTimer(container, endDate);

      timer.start();

      // Should not throw error when expiring without callback
      expect(() => {
        vi.advanceTimersByTime(2000);
      }).not.toThrow();
    });

    it('should use timer-expired class when expired', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 1000); // 1 second
      timer = new GameTimer(container, endDate);

      timer.start();
      vi.advanceTimersByTime(2000);

      const expiredElement = container.querySelector('.timer-expired');
      expect(expiredElement).toBeTruthy();
    });
  });

  describe('stop() Method', () => {
    it('should stop the timer interval', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 60000); // 1 minute
      timer = new GameTimer(container, endDate);

      timer.start();

      // Get initial display
      const initialContent = container.textContent;

      // Stop timer
      timer.stop();

      // Advance time
      vi.advanceTimersByTime(5000);

      // Display should not have changed
      expect(container.textContent).toBe(initialContent);
    });

    it('should clear interval ID when stopped', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 60000);
      timer = new GameTimer(container, endDate);

      timer.start();
      expect(timer.intervalId).not.toBeNull();

      timer.stop();
      expect(timer.intervalId).toBeNull();
    });

    it('should handle calling stop multiple times', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 60000);
      timer = new GameTimer(container, endDate);

      timer.start();
      timer.stop();

      expect(() => {
        timer.stop();
        timer.stop();
      }).not.toThrow();
    });

    it('should stop automatically when timer expires', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 1000); // 1 second
      timer = new GameTimer(container, endDate);

      timer.start();
      expect(timer.intervalId).not.toBeNull();

      // Advance past expiration
      vi.advanceTimersByTime(2000);

      // Timer should be stopped
      expect(timer.intervalId).toBeNull();
    });
  });

  describe('padNumber() Method', () => {
    it('should pad single digit numbers', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      endDate = new Date(now.getTime() + 10000);
      timer = new GameTimer(container, endDate);

      expect(timer.padNumber(0)).toBe('00');
      expect(timer.padNumber(5)).toBe('05');
      expect(timer.padNumber(9)).toBe('09');
    });

    it('should not pad double digit numbers', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      endDate = new Date(now.getTime() + 10000);
      timer = new GameTimer(container, endDate);

      expect(timer.padNumber(10)).toBe('10');
      expect(timer.padNumber(23)).toBe('23');
      expect(timer.padNumber(59)).toBe('59');
    });
  });

  describe('start() Method', () => {
    it('should render immediately on start', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 10000);
      timer = new GameTimer(container, endDate);

      expect(container.innerHTML).toBe('');

      timer.start();

      expect(container.innerHTML).not.toBe('');
      expect(container.querySelector('.timer-display')).toBeTruthy();
    });

    it('should create interval for updates', () => {
      const now = new Date('2026-01-08T00:00:00Z');
      vi.setSystemTime(now);

      endDate = new Date(now.getTime() + 10000);
      timer = new GameTimer(container, endDate);

      expect(timer.intervalId).toBeNull();

      timer.start();

      expect(timer.intervalId).not.toBeNull();
    });
  });
});
