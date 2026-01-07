/**
 * Integration Test Setup for Supabase
 */

import { createClient } from '@supabase/supabase-js'

// Create test Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://test.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'test-key'

export const supabaseTest = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

/**
 * Create a test user with anonymous authentication
 * @returns {Promise<{user: Object, error: Error|null}>}
 */
export async function createTestUser() {
  const { data, error } = await supabaseTest.auth.signInAnonymously()

  if (error) {
    console.error('Failed to create test user:', error)
    return { user: null, error }
  }

  return { user: data.user, error: null }
}

/**
 * Sign out current test user
 * @returns {Promise<{error: Error|null}>}
 */
export async function signOutTestUser() {
  const { error } = await supabaseTest.auth.signOut()
  return { error }
}

/**
 * Clean up test data from all tables
 * @param {string} userId - Optional user ID to clean up specific user data
 * @returns {Promise<void>}
 */
export async function cleanupTestData(userId = null) {
  const tables = [
    'user_actions',
    'user_voting_history',
    'user_province_votes',
    'user_profiles',
    'province_states'
  ]

  for (const table of tables) {
    if (userId) {
      // Clean up specific user data
      await supabaseTest.from(table).delete().eq('user_id', userId)
    } else {
      // Clean up all test data (use with caution)
      // Only delete records created in test environment
      const { data: session } = await supabaseTest.auth.getSession()
      if (session?.session?.user?.id) {
        await supabaseTest.from(table).delete().eq('user_id', session.session.user.id)
      }
    }
  }
}

/**
 * Reset province states to initial/default values
 * @param {Array<number>} provinceIds - Array of province IDs to reset
 * @returns {Promise<void>}
 */
export async function resetProvinceStates(provinceIds = null) {
  const resetData = {
    blue_votes: 0,
    red_votes: 0,
    control: 'neutral',
    last_updated: new Date().toISOString()
  }

  if (provinceIds && provinceIds.length > 0) {
    // Reset specific provinces
    for (const provinceId of provinceIds) {
      await supabaseTest
        .from('province_states')
        .update(resetData)
        .eq('province_id', provinceId)
    }
  } else {
    // Reset all provinces
    await supabaseTest
      .from('province_states')
      .update(resetData)
  }
}

/**
 * Set up test fixtures for provinces
 * @param {Array<Object>} fixtures - Array of province fixture objects
 * @returns {Promise<void>}
 */
export async function setupProvinceFixtures(fixtures) {
  for (const fixture of fixtures) {
    const { province_id, blue_votes, red_votes, control } = fixture

    await supabaseTest
      .from('province_states')
      .upsert({
        province_id,
        blue_votes: blue_votes || 0,
        red_votes: red_votes || 0,
        control: control || 'neutral',
        last_updated: new Date().toISOString()
      })
  }
}

/**
 * Set up test fixtures for user votes
 * @param {string} userId - User ID
 * @param {Array<Object>} votes - Array of vote fixture objects
 * @returns {Promise<void>}
 */
export async function setupUserVoteFixtures(userId, votes) {
  const userVotes = votes.map(vote => ({
    user_id: userId,
    province_id: vote.province_id,
    team: vote.team,
    vote_count: vote.vote_count || 1,
    last_voted: vote.last_voted || new Date().toISOString()
  }))

  await supabaseTest
    .from('user_province_votes')
    .upsert(userVotes)
}

/**
 * Set up test fixtures for user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<void>}
 */
export async function setupUserProfileFixture(userId, profileData = {}) {
  const defaultProfile = {
    user_id: userId,
    team: profileData.team || 'blue',
    total_votes: profileData.total_votes || 0,
    provinces_controlled: profileData.provinces_controlled || 0,
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString()
  }

  await supabaseTest
    .from('user_profiles')
    .upsert({ ...defaultProfile, ...profileData })
}

/**
 * Get current test session
 * @returns {Promise<{session: Object|null, error: Error|null}>}
 */
export async function getTestSession() {
  const { data, error } = await supabaseTest.auth.getSession()
  return { session: data.session, error }
}

/**
 * Wait for realtime updates to propagate
 * @param {number} ms - Milliseconds to wait (default: 100ms)
 * @returns {Promise<void>}
 */
export async function waitForRealtime(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default supabaseTest
