/**
 * Auth Module Tests
 */

import { describe, it, expect } from 'vitest'
import { validateNickname, NICKNAME_RULES } from '../../src/lib/auth.js'

describe('validateNickname', () => {
  describe('length validation', () => {
    it('rejects empty nickname', () => {
      const result = validateNickname('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('3 characters')
    })

    it('rejects nickname shorter than minimum', () => {
      const result = validateNickname('ab')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('3 characters')
    })

    it('accepts nickname at minimum length', () => {
      const result = validateNickname('abc')
      expect(result.valid).toBe(true)
    })

    it('rejects nickname longer than maximum', () => {
      const result = validateNickname('a'.repeat(21))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('20 characters')
    })

    it('accepts nickname at maximum length', () => {
      const result = validateNickname('a'.repeat(20))
      expect(result.valid).toBe(true)
    })
  })

  describe('character validation', () => {
    it('accepts Thai characters', () => {
      const result = validateNickname('ทดสอบ')
      expect(result.valid).toBe(true)
    })

    it('accepts English characters', () => {
      const result = validateNickname('TestUser')
      expect(result.valid).toBe(true)
    })

    it('accepts numbers', () => {
      const result = validateNickname('User123')
      expect(result.valid).toBe(true)
    })

    it('accepts underscore', () => {
      const result = validateNickname('Test_User')
      expect(result.valid).toBe(true)
    })

    it('accepts spaces', () => {
      const result = validateNickname('Test User')
      expect(result.valid).toBe(true)
    })

    it('accepts mixed Thai and English', () => {
      const result = validateNickname('Test ทดสอบ 123')
      expect(result.valid).toBe(true)
    })

    it('rejects special characters', () => {
      const result = validateNickname('User@#$')
      expect(result.valid).toBe(false)
    })

    it('rejects emoji', () => {
      const result = validateNickname('User 🎮')
      expect(result.valid).toBe(false)
    })
  })

  describe('whitespace handling', () => {
    it('trims leading/trailing whitespace', () => {
      const result = validateNickname('  TestUser  ')
      expect(result.valid).toBe(true)
    })

    it('rejects whitespace-only input', () => {
      const result = validateNickname('   ')
      expect(result.valid).toBe(false)
    })
  })
})

describe('NICKNAME_RULES', () => {
  it('has correct minLength', () => {
    expect(NICKNAME_RULES.minLength).toBe(3)
  })

  it('has correct maxLength', () => {
    expect(NICKNAME_RULES.maxLength).toBe(20)
  })

  it('has valid pattern regex', () => {
    expect(NICKNAME_RULES.pattern).toBeInstanceOf(RegExp)
    expect(NICKNAME_RULES.pattern.test('TestUser123')).toBe(true)
    expect(NICKNAME_RULES.pattern.test('ทดสอบ')).toBe(true)
  })
})
