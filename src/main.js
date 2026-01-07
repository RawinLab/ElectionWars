/**
 * Election War - Main Entry Point
 * Real-time political clicker game for Thailand's 2026 election
 */

import { supabase } from './lib/supabase.js'
import { initAuth, getSession } from './lib/auth.js'
// import { ThailandMap } from './components/Map.js'
// import { Leaderboard } from './components/Leaderboard.js'
// import { GameTimer } from './components/Timer.js'
// import { ToastManager } from './components/Toast.js'
// import { RealtimeManager } from './lib/realtime.js'
// import { i18n } from './lib/i18n.js'

// Global state
let session = null

/**
 * Initialize the application
 */
async function init() {
  console.log('🗳️ Election War - Initializing...')

  try {
    // Check for existing session
    session = await initAuth()

    if (session) {
      // Player already joined - show game screen
      showGameScreen()
    } else {
      // New player - show party selector
      showPartySelector()
    }
  } catch (error) {
    console.error('Initialization error:', error)
    showError('Failed to initialize game. Please refresh.')
  }
}

/**
 * Show party selector screen
 */
async function showPartySelector() {
  document.getElementById('party-selector').classList.remove('hidden')
  document.getElementById('game-screen').classList.add('hidden')

  // Load parties
  await loadParties()
}

/**
 * Load parties from Supabase
 */
async function loadParties() {
  const grid = document.getElementById('party-grid')

  try {
    const { data: parties, error } = await supabase
      .from('parties')
      .select('*')
      .order('ballot_number', { ascending: true })

    if (error) throw error

    grid.innerHTML = parties.map(party => `
      <div class="party-card" data-party-id="${party.id}" style="--party-color: ${party.official_color}">
        <div class="party-color" style="background: ${party.official_color}"></div>
        <div class="party-info">
          <h3>${party.name_thai}</h3>
          <p>${party.name_english}</p>
          ${party.ballot_number ? `<span class="ballot-number">#${party.ballot_number}</span>` : ''}
        </div>
      </div>
    `).join('')

    // Add click handlers
    grid.querySelectorAll('.party-card').forEach(card => {
      card.addEventListener('click', () => selectParty(card.dataset.partyId, parties))
    })
  } catch (error) {
    console.error('Failed to load parties:', error)
    grid.innerHTML = '<div class="error">Failed to load parties. Please refresh.</div>'
  }
}

/**
 * Handle party selection
 */
function selectParty(partyId, parties) {
  const party = parties.find(p => p.id === parseInt(partyId))
  if (!party) return

  // Show selected party preview
  const preview = document.getElementById('party-preview')
  preview.innerHTML = `
    <div class="selected-party-badge" style="background: ${party.official_color}"></div>
    <div class="selected-party-name">
      <h3>${party.name_thai}</h3>
      <p>${party.name_english}</p>
    </div>
  `

  // Show nickname input
  document.getElementById('selected-party').classList.remove('hidden')
  document.getElementById('nickname-input').focus()

  // Store selected party
  window.selectedParty = party

  // Highlight selected card
  document.querySelectorAll('.party-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.partyId === partyId)
  })
}

/**
 * Show game screen
 */
function showGameScreen() {
  document.getElementById('party-selector').classList.add('hidden')
  document.getElementById('game-screen').classList.remove('hidden')

  // TODO: Initialize game components
  console.log('Game screen loaded. Session:', session)
}

/**
 * Show error message
 */
function showError(message) {
  // TODO: Use toast notification
  alert(message)
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// Export for testing
export { init, showPartySelector, showGameScreen }
