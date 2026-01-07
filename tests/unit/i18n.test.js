/**
 * Unit tests for I18n class
 * Tests translation functionality, language detection, and localStorage persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import i18nInstance from '../../src/lib/i18n.js';

describe('I18n', () => {
  let i18n;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Use the singleton instance
    i18n = i18nInstance;
    // Reset language to default
    i18n.currentLanguage = 'th';
    // Clear all listeners
    i18n.listeners = [];
  });

  describe('Language Detection', () => {
    it('should default to Thai language when no preferences set', () => {
      const lang = i18n.getLanguage();
      expect(lang).toBe('th');
    });

    it('should detect language from localStorage if available', () => {
      localStorage.setItem('electionwars_language', 'en');
      const detectedLang = i18n.detectLanguage();
      expect(detectedLang).toBe('en');
    });

    it('should ignore invalid language in localStorage', () => {
      localStorage.setItem('electionwars_language', 'fr');
      const detectedLang = i18n.detectLanguage();
      expect(detectedLang).toBe('th');
    });
  });

  describe('setLanguage()', () => {
    it('should change current language to English', () => {
      i18n.setLanguage('en');
      expect(i18n.getLanguage()).toBe('en');
    });

    it('should change current language to Thai', () => {
      i18n.setLanguage('th');
      expect(i18n.getLanguage()).toBe('th');
    });

    it('should persist language to localStorage', () => {
      i18n.setLanguage('en');
      expect(localStorage.getItem('electionwars_language')).toBe('en');
    });

    it('should not change language for invalid language code', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const originalLang = i18n.getLanguage();

      i18n.setLanguage('fr');

      expect(i18n.getLanguage()).toBe(originalLang);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid language: fr')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('t() - Translation', () => {
    it('should return correct translation for valid key in Thai', () => {
      i18n.setLanguage('th');
      const translation = i18n.t('menu.joinGame');
      expect(translation).toBe('เข้าร่วมเกม');
    });

    it('should return correct translation for valid key in English', () => {
      i18n.setLanguage('en');
      const translation = i18n.t('menu.joinGame');
      expect(translation).toBe('Join Game');
    });

    it('should return nested translation keys', () => {
      i18n.setLanguage('en');
      const translation = i18n.t('game.leaderboard.title');
      expect(translation).toBe('Party Rankings');
    });

    it('should return key if translation not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = i18n.t('non.existent.key');

      expect(result).toBe('non.existent.key');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Translation key not found')
      );

      consoleSpy.mockRestore();
    });

    it('should replace placeholders with parameters', () => {
      i18n.setLanguage('en');
      const translation = i18n.t('toast.provinceFlip', {
        province: 'Bangkok',
        party: 'Blue Party'
      });

      // Check that placeholders are replaced
      expect(translation).toContain('Bangkok');
      expect(translation).toContain('Blue Party');
    });

    it('should keep placeholder if parameter not provided', () => {
      i18n.setLanguage('en');
      const translation = i18n.t('toast.provinceFlip', {
        province: 'Bangkok'
        // party parameter missing
      });

      expect(translation).toContain('Bangkok');
      expect(translation).toContain('{party}');
    });

    it('should return key if translation value is not a string', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // 'game' is an object, not a string
      const result = i18n.t('game');

      expect(result).toBe('game');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Translation key is not a string')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('onLanguageChange()', () => {
    it('should call callback when language changes', () => {
      const callback = vi.fn();
      i18n.onLanguageChange(callback);

      i18n.setLanguage('en');

      expect(callback).toHaveBeenCalledWith('en');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call multiple callbacks when registered', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      i18n.onLanguageChange(callback1);
      i18n.onLanguageChange(callback2);

      i18n.setLanguage('en');

      expect(callback1).toHaveBeenCalledWith('en');
      expect(callback2).toHaveBeenCalledWith('en');
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = i18n.onLanguageChange(callback);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      i18n.setLanguage('en');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      i18n.onLanguageChange(errorCallback);
      i18n.onLanguageChange(normalCallback);

      i18n.setLanguage('en');

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in language change listener'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not add non-function callbacks', () => {
      const initialListeners = i18n.listeners.length;

      i18n.onLanguageChange('not a function');
      i18n.onLanguageChange(null);
      i18n.onLanguageChange(undefined);

      expect(i18n.listeners.length).toBe(initialListeners);
    });
  });

  describe('localStorage Persistence', () => {
    it('should save language preference to localStorage', () => {
      i18n.setLanguage('en');
      expect(localStorage.getItem('electionwars_language')).toBe('en');

      i18n.setLanguage('th');
      expect(localStorage.getItem('electionwars_language')).toBe('th');
    });

    it('should load saved language on initialization', () => {
      localStorage.setItem('electionwars_language', 'en');
      const detectedLang = i18n.detectLanguage();

      expect(detectedLang).toBe('en');
    });

    it('should persist language across multiple uses', () => {
      i18n.setLanguage('en');
      expect(localStorage.getItem('electionwars_language')).toBe('en');

      // Simulate reload by detecting language again
      const detectedLang = i18n.detectLanguage();
      expect(detectedLang).toBe('en');
    });
  });
});
