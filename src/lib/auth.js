/**
 * Authentication Module
 * Handles anonymous auth and player session management
 */

import { supabase } from './supabase.js'

const SESSION_KEY = 'electionwar_session'

/**
 * Nickname validation rules
 */
export const NICKNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[\u0E00-\u0E7Fa-zA-Z0-9_\s]+$/  // Thai, English, numbers, underscore, space
}

/**
 * Initialize authentication
 * @returns {Promise<Object|null>} Session object or null
 */
export async function initAuth() {
  // Check localStorage first
  const stored = localStorage.getItem(SESSION_KEY)
  if (stored) {
    try {
      const session = JSON.parse(stored)

      // Verify Supabase auth is still valid
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (authSession) {
        // Fetch fresh player data to get updated total_clicks
        const { data: freshPlayer, error } = await supabase
          .from('players')
          .select('*')
          .eq('id', session.player.id)
          .single()

        if (!error && freshPlayer) {
          session.player = freshPlayer
          // Update localStorage with fresh data
          localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        }

        return session
      }
    } catch (e) {
      console.warn('Invalid stored session, clearing...')
      localStorage.removeItem(SESSION_KEY)
    }
  }

  return null
}

/**
 * Get current session
 * @returns {Object|null}
 */
export function getSession() {
  const stored = localStorage.getItem(SESSION_KEY)
  return stored ? JSON.parse(stored) : null
}

/**
 * Create anonymous session
 * @returns {Promise<Object>} Auth session
 */
export async function createAnonymousSession() {
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.session
}

/**
 * Join the game
 * @param {number} partyId - Selected party ID
 * @param {string} nickname - Player nickname
 * @returns {Promise<Object>} Session with player and party data
 */
export async function joinGame(partyId, nickname) {
  // Validate nickname
  const validation = validateNickname(nickname)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Create anonymous auth session
  const authSession = await createAnonymousSession()

  // Call join_game RPC
  const { data, error } = await supabase.rpc('join_game', {
    p_auth_id: authSession.user.id,
    p_party_id: partyId,
    p_nickname: nickname.trim()
  })

  if (error) throw error

  if (!data.success) {
    throw new Error('Failed to join game')
  }

  // Get full player data
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .eq('id', data.player_id)
    .single()

  if (playerError) throw playerError

  // Get party data
  const { data: party, error: partyError } = await supabase
    .from('parties')
    .select('*')
    .eq('id', partyId)
    .single()

  if (partyError) throw partyError

  // Create session object
  const session = {
    player,
    party,
    created_at: new Date().toISOString()
  }

  // Store in localStorage
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))

  return session
}

/**
 * Change party (with 24hr cooldown)
 * @param {string} playerId - Player UUID
 * @param {number} newPartyId - New party ID
 * @returns {Promise<Object>} Result
 */
export async function changeParty(playerId, newPartyId) {
  const { data, error } = await supabase.rpc('change_party', {
    p_player_id: playerId,
    p_new_party_id: newPartyId
  })

  if (error) throw error

  if (!data.success) {
    throw new Error(data.error || 'Failed to change party')
  }

  // Update localStorage session
  const session = getSession()
  if (session) {
    const { data: newParty } = await supabase
      .from('parties')
      .select('*')
      .eq('id', newPartyId)
      .single()

    session.party = newParty
    session.player.party_id = newPartyId
    session.player.total_clicks = 0
    session.player.party_changed_at = new Date().toISOString()
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  return data
}

/**
 * Validate nickname
 * @param {string} nickname - Nickname to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateNickname(nickname) {
  const trimmed = nickname?.trim() || ''

  if (trimmed.length < NICKNAME_RULES.minLength) {
    return {
      valid: false,
      error: `Nickname must be at least ${NICKNAME_RULES.minLength} characters`
    }
  }

  if (trimmed.length > NICKNAME_RULES.maxLength) {
    return {
      valid: false,
      error: `Nickname must be at most ${NICKNAME_RULES.maxLength} characters`
    }
  }

  if (!NICKNAME_RULES.pattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Nickname can only contain Thai, English, numbers, underscore, and space'
    }
  }

  return { valid: true }
}

/**
 * Clear session (logout)
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  supabase.auth.signOut()
}

export default {
  initAuth,
  getSession,
  joinGame,
  changeParty,
  validateNickname,
  clearSession
}
