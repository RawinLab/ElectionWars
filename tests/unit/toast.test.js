/**
 * Unit tests for ToastManager class
 * Tests toast creation, styling, auto-dismiss, and convenience methods
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToastManager } from '../../src/components/Toast.js';

describe('ToastManager', () => {
  let toastManager;
  let container;

  beforeEach(() => {
    // Clean up any existing toast containers
    const existingContainer = document.getElementById('toast-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create fresh instance
    toastManager = new ToastManager();
    container = toastManager.container;

    // Use fake timers for auto-dismiss tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up toasts
    toastManager.dismissAll();

    // Restore real timers
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Container Creation', () => {
    it('should create toast container on initialization', () => {
      const container = document.getElementById('toast-container');
      expect(container).toBeTruthy();
      expect(container.style.position).toBe('fixed');
      expect(container.style.zIndex).toBe('9999');
    });

    it('should reuse existing container if present', () => {
      const existingContainer = toastManager.container;
      const newToastManager = new ToastManager();

      expect(newToastManager.container).toBe(existingContainer);
    });
  });

  describe('show() - Basic Toast Creation', () => {
    it('should create a toast element', () => {
      const toast = toastManager.show('Test message');

      expect(toast).toBeTruthy();
      expect(toast.className).toContain('toast');
      expect(container.contains(toast)).toBe(true);
    });

    it('should display the correct message', () => {
      const message = 'Hello, World!';
      const toast = toastManager.show(message);

      const messageElement = toast.querySelector('.toast-message');
      expect(messageElement.textContent).toBe(message);
    });

    it('should add toast to internal tracking array', () => {
      const initialCount = toastManager.toasts.length;
      toastManager.show('Test');

      expect(toastManager.toasts.length).toBe(initialCount + 1);
    });

    it('should inject animation styles into document', () => {
      toastManager.show('Test');

      const styleElement = document.getElementById('toast-animation-styles');
      expect(styleElement).toBeTruthy();
      expect(styleElement.textContent).toContain('toastSlideIn');
      expect(styleElement.textContent).toContain('toastSlideOut');
    });

    it('should only inject animation styles once', () => {
      toastManager.show('Test 1');
      toastManager.show('Test 2');

      const styleElements = document.querySelectorAll('#toast-animation-styles');
      expect(styleElements.length).toBe(1);
    });
  });

  describe('Toast Types and CSS Classes', () => {
    it('should have correct class for success type', () => {
      const toast = toastManager.show('Success!', 'success');
      expect(toast.className).toContain('toast-success');
    });

    it('should have correct class for error type', () => {
      const toast = toastManager.show('Error!', 'error');
      expect(toast.className).toContain('toast-error');
    });

    it('should have correct class for warning type', () => {
      const toast = toastManager.show('Warning!', 'warning');
      expect(toast.className).toContain('toast-warning');
    });

    it('should have correct class for info type', () => {
      const toast = toastManager.show('Info', 'info');
      expect(toast.className).toContain('toast-info');
    });

    it('should default to info type if not specified', () => {
      const toast = toastManager.show('Default');
      expect(toast.className).toContain('toast-info');
    });

    it('should apply correct background color for success', () => {
      const toast = toastManager.show('Success', 'success');
      expect(toast.style.backgroundColor).toBe('rgb(16, 185, 129)'); // #10b981
    });

    it('should apply correct background color for error', () => {
      const toast = toastManager.show('Error', 'error');
      expect(toast.style.backgroundColor).toBe('rgb(239, 68, 68)'); // #ef4444
    });

    it('should apply correct background color for warning', () => {
      const toast = toastManager.show('Warning', 'warning');
      expect(toast.style.backgroundColor).toBe('rgb(245, 158, 11)'); // #f59e0b
    });

    it('should apply correct background color for info', () => {
      const toast = toastManager.show('Info', 'info');
      expect(toast.style.backgroundColor).toBe('rgb(59, 130, 246)'); // #3b82f6
    });
  });

  describe('Close Button', () => {
    it('should include a close button', () => {
      const toast = toastManager.show('Test');
      const closeButton = toast.querySelector('.toast-close');

      expect(closeButton).toBeTruthy();
      expect(closeButton.innerHTML).toBe('×');
    });

    it('should remove toast when close button is clicked', () => {
      const toast = toastManager.show('Test', 'info', 0); // No auto-dismiss
      const closeButton = toast.querySelector('.toast-close');

      closeButton.click();

      // Fast-forward through animation
      vi.advanceTimersByTime(300);

      expect(container.contains(toast)).toBe(false);
      expect(toastManager.toasts).not.toContain(toast);
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after default timeout', () => {
      const toast = toastManager.show('Test');

      expect(container.contains(toast)).toBe(true);

      // Fast-forward 3000ms (default duration)
      vi.advanceTimersByTime(3000);

      // Fast-forward through animation
      vi.advanceTimersByTime(300);

      expect(container.contains(toast)).toBe(false);
    });

    it('should auto-dismiss after custom timeout', () => {
      const toast = toastManager.show('Test', 'info', 5000);

      // Should still be visible after 3000ms
      vi.advanceTimersByTime(3000);
      expect(container.contains(toast)).toBe(true);

      // Should be dismissed after 5000ms + animation
      vi.advanceTimersByTime(2000);
      vi.advanceTimersByTime(300);
      expect(container.contains(toast)).toBe(false);
    });

    it('should not auto-dismiss when duration is 0', () => {
      const toast = toastManager.show('Test', 'info', 0);

      vi.advanceTimersByTime(10000);

      expect(container.contains(toast)).toBe(true);
    });
  });

  describe('Multiple Toasts', () => {
    it('should stack multiple toasts', () => {
      const toast1 = toastManager.show('First');
      const toast2 = toastManager.show('Second');
      const toast3 = toastManager.show('Third');

      expect(container.contains(toast1)).toBe(true);
      expect(container.contains(toast2)).toBe(true);
      expect(container.contains(toast3)).toBe(true);
      expect(toastManager.toasts.length).toBe(3);
    });

    it('should maintain correct order of toasts', () => {
      const toast1 = toastManager.show('First');
      const toast2 = toastManager.show('Second');

      const toasts = Array.from(container.children);
      expect(toasts[0]).toBe(toast1);
      expect(toasts[1]).toBe(toast2);
    });
  });

  describe('dismiss()', () => {
    it('should remove toast from DOM', () => {
      const toast = toastManager.show('Test', 'info', 0);

      toastManager.dismiss(toast);
      vi.advanceTimersByTime(300);

      expect(container.contains(toast)).toBe(false);
    });

    it('should remove toast from tracking array', () => {
      const toast = toastManager.show('Test', 'info', 0);

      toastManager.dismiss(toast);
      vi.advanceTimersByTime(300);

      expect(toastManager.toasts).not.toContain(toast);
    });

    it('should handle dismissing already removed toast', () => {
      const toast = toastManager.show('Test', 'info', 0);
      toast.remove();

      expect(() => toastManager.dismiss(toast)).not.toThrow();
    });

    it('should handle dismissing null toast', () => {
      expect(() => toastManager.dismiss(null)).not.toThrow();
    });
  });

  describe('dismissAll()', () => {
    it('should dismiss all active toasts', () => {
      toastManager.show('First');
      toastManager.show('Second');
      toastManager.show('Third');

      expect(toastManager.toasts.length).toBe(3);

      toastManager.dismissAll();
      vi.advanceTimersByTime(300);

      expect(toastManager.toasts.length).toBe(0);
      expect(container.children.length).toBe(0);
    });
  });

  describe('Convenience Methods', () => {
    describe('provinceFlip()', () => {
      it('should show warning toast with province flip message', () => {
        toastManager.provinceFlip('Blue Party', 'Bangkok');

        const toasts = container.querySelectorAll('.toast');
        const lastToast = toasts[toasts.length - 1];

        expect(lastToast.className).toContain('toast-warning');

        const message = lastToast.querySelector('.toast-message').textContent;
        expect(message).toContain('Bangkok');
        expect(message).toContain('Blue Party');
        expect(message).toContain('flipped');
      });
    });

    describe('partyWin()', () => {
      it('should show success toast with victory message', () => {
        toastManager.partyWin('Red Party', 'Chiang Mai');

        const toasts = container.querySelectorAll('.toast');
        const lastToast = toasts[toasts.length - 1];

        expect(lastToast.className).toContain('toast-success');

        const message = lastToast.querySelector('.toast-message').textContent;
        expect(message).toContain('Victory');
        expect(message).toContain('Red Party');
        expect(message).toContain('Chiang Mai');
      });
    });

    describe('shieldWarning()', () => {
      it('should show error toast with shield warning', () => {
        toastManager.shieldWarning('Phuket', 25);

        const toasts = container.querySelectorAll('.toast');
        const lastToast = toasts[toasts.length - 1];

        expect(lastToast.className).toContain('toast-error');

        const message = lastToast.querySelector('.toast-message').textContent;
        expect(message).toContain('Warning');
        expect(message).toContain('Phuket');
        expect(message).toContain('25');
        expect(message).toContain('shield');
        expect(message).toContain('low');
      });
    });
  });
});
