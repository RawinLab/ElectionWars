/**
 * Vitest Test Setup
 */

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null
  },
  setItem(key, value) {
    this.store[key] = value
  },
  removeItem(key) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  }
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})

// Mock import.meta.env
global.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-key',
      VITE_GAME_END_DATE: '2026-02-08T23:59:59+07:00'
    }
  }
}

// Clear localStorage before each test
beforeEach(() => {
  localStorageMock.clear()
})
