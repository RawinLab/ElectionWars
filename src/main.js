/**
 * Election War - Main Entry Point
 * Real-time political clicker game for Thailand's 2026 election
 */

import { supabase } from './lib/supabase.js'
import { initAuth, getSession, joinGame, validateNickname, changeParty } from './lib/auth.js'
import { ThailandMap } from './components/Map.js'
import { Leaderboard } from './components/Leaderboard.js'
import { GameTimer } from './components/Timer.js'
import { GlobalStats } from './components/GlobalStats.js'
import { ConnectionStatus } from './components/ConnectionStatus.js'
import { realtimeManager } from './lib/realtime.js'
import { toastManager } from './components/Toast.js'
import { getSettingsPanel } from './components/SettingsPanel.js'
import i18n from './lib/i18n.js'

// Game end date: February 8, 2026, 23:59:59 Bangkok time (UTC+7)
const GAME_END_DATE = new Date('2026-02-08T23:59:59+07:00')

// Global state
let session = null
let allParties = []
let thailandMap = null
let leaderboard = null
let gameTimer = null
let globalStats = null
let connectionStatus = null
let settingsPanel = null

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

    // Set up event listeners
    setupEventListeners()
  } catch (error) {
    console.error('Initialization error:', error)
    showError('Failed to initialize game. Please refresh.')
  }
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
  // Nickname input validation
  const nicknameInput = document.getElementById('nickname-input')
  if (nicknameInput) {
    nicknameInput.addEventListener('input', handleNicknameInput)
  }

  // Join button
  const joinButton = document.getElementById('join-button')
  if (joinButton) {
    joinButton.addEventListener('click', handleJoinGame)
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

    // Store parties globally
    allParties = parties

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
 * Handle nickname input validation
 */
function handleNicknameInput(e) {
  const nickname = e.target.value
  const errorEl = document.getElementById('nickname-error')
  const joinButton = document.getElementById('join-button')

  const validation = validateNickname(nickname)

  if (nickname.length > 0 && !validation.valid) {
    errorEl.textContent = validation.error
    errorEl.classList.remove('hidden')
    joinButton.disabled = true
  } else {
    errorEl.classList.add('hidden')
    joinButton.disabled = false
  }
}

/**
 * Handle join game button click
 */
async function handleJoinGame() {
  const nicknameInput = document.getElementById('nickname-input')
  const joinButton = document.getElementById('join-button')
  const errorEl = document.getElementById('nickname-error')
  const nickname = nicknameInput.value.trim()

  // Validate
  const validation = validateNickname(nickname)
  if (!validation.valid) {
    errorEl.textContent = validation.error
    errorEl.classList.remove('hidden')
    return
  }

  // Check party selection
  if (!window.selectedParty) {
    showError('Please select a party first')
    return
  }

  // Disable button during join
  joinButton.disabled = true
  joinButton.textContent = 'Joining...'

  try {
    session = await joinGame(window.selectedParty.id, nickname)
    console.log('✅ Joined game:', session)
    showGameScreen()
  } catch (error) {
    console.error('Join game error:', error)
    errorEl.textContent = error.message || 'Failed to join game'
    errorEl.classList.remove('hidden')
    joinButton.disabled = false
    joinButton.textContent = 'เข้าร่วมเกม / Join Game'
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
async function showGameScreen() {
  document.getElementById('party-selector').classList.add('hidden')
  document.getElementById('game-screen').classList.remove('hidden')

  // Update player info in header
  updatePlayerInfo()

  // Initialize all game components in parallel
  await Promise.all([
    initializeMap(),
    initializeLeaderboard(),
    initializeGlobalStats()
  ])

  // Initialize timer and connection status
  initializeTimer()
  initializeConnectionStatus()

  // Start realtime subscriptions
  initializeRealtime()

  // Initialize settings panel
  initializeSettingsPanel()

  console.log('🎮 Game screen loaded. Session:', session)
}

/**
 * Initialize the leaderboard component
 */
async function initializeLeaderboard() {
  const leaderboardContainer = document.getElementById('leaderboard')
  if (!leaderboardContainer) {
    console.warn('Leaderboard container not found')
    return
  }

  try {
    leaderboard = new Leaderboard(leaderboardContainer)
    await leaderboard.fetch()
    console.log('📊 Leaderboard initialized')
  } catch (error) {
    console.error('Failed to initialize leaderboard:', error)
  }
}

/**
 * Initialize the global stats component
 */
async function initializeGlobalStats() {
  const statsContainer = document.getElementById('global-stats')
  if (!statsContainer) {
    console.warn('Global stats container not found')
    return
  }

  try {
    globalStats = new GlobalStats(statsContainer)
    const data = await globalStats.fetch()
    globalStats.render(data)
    console.log('📈 Global stats initialized')
  } catch (error) {
    console.error('Failed to initialize global stats:', error)
  }
}

/**
 * Initialize the game timer component
 */
function initializeTimer() {
  const timerContainer = document.getElementById('game-timer')
  if (!timerContainer) {
    console.warn('Timer container not found')
    return
  }

  gameTimer = new GameTimer(timerContainer, GAME_END_DATE)
  gameTimer.onExpire(() => {
    console.log('⏰ Game ended!')
    handleGameEnd()
  })
  gameTimer.start()
  console.log('⏱️ Game timer started')
}

/**
 * Initialize the connection status indicator
 */
function initializeConnectionStatus() {
  const statusContainer = document.getElementById('connection-status')
  if (!statusContainer) {
    console.warn('Connection status container not found')
    return
  }

  connectionStatus = new ConnectionStatus(statusContainer)
  connectionStatus.setRealtimeManager(realtimeManager)
  console.log('🔌 Connection status initialized')
}

/**
 * Get province name from the SVG map
 */
function getProvinceName(provinceId) {
  const mapContainer = document.getElementById('thailand-map')
  if (!mapContainer) return null

  const provinceElement = mapContainer.querySelector(`[data-id="${provinceId}"]`)
  if (!provinceElement) return null

  return provinceElement.getAttribute('data-name-thai') ||
         provinceElement.getAttribute('data-name-english') ||
         null
}

/**
 * Initialize realtime subscriptions
 */
function initializeRealtime() {
  // Subscribe to province state changes
  realtimeManager.onProvinceChange((payload) => {
    if (thailandMap && payload.new) {
      const oldState = thailandMap.provinceStates.get(payload.new.province_id)
      const oldPartyId = oldState?.controlling_party_id
      const newPartyId = payload.new.controlling_party_id

      // Update the map with new province state
      thailandMap.provinceStates.set(payload.new.province_id, payload.new)
      const party = thailandMap.parties.get(newPartyId)
      if (party) {
        thailandMap.updateProvinceColor(payload.new.province_id, party.official_color)
      }

      // Show toast if province changed hands
      if (oldPartyId !== newPartyId && newPartyId) {
        const provinceName = getProvinceName(payload.new.province_id) || `Province ${payload.new.province_id}`
        const partyName = party?.name_thai || party?.name_english || 'Unknown Party'

        // Check if it's the player's party
        if (session && session.party && newPartyId === session.party.id) {
          toastManager.partyWin(partyName, provinceName)
        } else if (oldPartyId) {
          // Province flipped to another party
          toastManager.provinceFlip(partyName, provinceName)
        }
      }
    }
    // Refresh leaderboard on province changes
    if (leaderboard) {
      leaderboard.fetch()
    }
  })

  // Subscribe to game state changes
  realtimeManager.onGameStateChange((payload) => {
    if (globalStats && payload.new) {
      globalStats.handleGameStateUpdate(payload.new)
    }
  })

  // Start all subscriptions
  realtimeManager.subscribe()
  console.log('📡 Realtime subscriptions started')
}

/**
 * Handle game end event
 */
function handleGameEnd() {
  // Show game end screen
  document.getElementById('game-screen').classList.add('hidden')
  document.getElementById('game-end-screen').classList.remove('hidden')

  // Display final results
  if (leaderboard && leaderboard.currentData.length > 0) {
    const resultsEl = document.getElementById('final-results')
    if (resultsEl) {
      const winner = leaderboard.currentData[0]
      resultsEl.innerHTML = `
        <div class="winner-announcement">
          <h2>🏆 Winner: ${winner.party_name}</h2>
          <p>Provinces Controlled: ${winner.provinces_count}</p>
          <p>Total Clicks: ${leaderboard.formatNumber(winner.total_clicks)}</p>
        </div>
      `
    }
  }

  // Add view map button handler
  const viewMapBtn = document.getElementById('view-map-btn')
  if (viewMapBtn) {
    viewMapBtn.addEventListener('click', () => {
      document.getElementById('game-end-screen').classList.add('hidden')
      document.getElementById('game-screen').classList.remove('hidden')
    })
  }
}

/**
 * Initialize Thailand map
 */
async function initializeMap() {
  const mapContainer = document.getElementById('thailand-map')
  if (!mapContainer) {
    console.warn('Map container not found')
    return
  }

  try {
    // Show loading state
    mapContainer.innerHTML = '<div class="map-loading">Loading map...</div>'

    // Create and initialize map
    thailandMap = new ThailandMap(mapContainer)
    await thailandMap.init(session)

    console.log('🗺️ Thailand map initialized')
  } catch (error) {
    console.error('Failed to initialize map:', error)
    mapContainer.innerHTML = '<div class="error">Failed to load map. Please refresh.</div>'
  }
}

/**
 * Update player info display
 */
function updatePlayerInfo() {
  const playerInfoEl = document.getElementById('player-info')
  if (!session || !playerInfoEl) return

  const { player, party } = session

  playerInfoEl.innerHTML = `
    <div class="player-badge" style="background: ${party.official_color}"></div>
    <div class="player-details">
      <span class="player-name">${player.nickname}</span>
      <span class="player-party">${party.name_thai}</span>
    </div>
    <button id="change-party-btn" class="btn btn-secondary btn-sm" title="Change Party">
      เปลี่ยนพรรค
    </button>
  `

  // Add change party handler
  const changePartyBtn = document.getElementById('change-party-btn')
  if (changePartyBtn) {
    changePartyBtn.addEventListener('click', showChangePartyDialog)
  }
}

/**
 * Show change party dialog
 */
async function showChangePartyDialog() {
  if (!session) return

  // Check cooldown first
  const { player } = session
  if (player.party_changed_at) {
    const changedAt = new Date(player.party_changed_at)
    const cooldownEnd = new Date(changedAt.getTime() + 24 * 60 * 60 * 1000)
    const now = new Date()

    if (now < cooldownEnd) {
      const hoursRemaining = Math.ceil((cooldownEnd - now) / (60 * 60 * 1000))
      showError(`ต้องรอ ${hoursRemaining} ชั่วโมงก่อนเปลี่ยนพรรคได้ / Must wait ${hoursRemaining} hours before changing party`)
      return
    }
  }

  // Show party selector for change
  const confirmed = confirm(
    'คุณต้องการเปลี่ยนพรรคหรือไม่?\n' +
    'การเปลี่ยนพรรคจะรีเซ็ตจำนวนคลิกของคุณเป็น 0\n\n' +
    'Do you want to change party?\n' +
    'Changing party will reset your click count to 0'
  )

  if (!confirmed) return

  // For now, show simple prompt for party selection
  // In full implementation, would show party selector modal
  const newPartyId = prompt('Enter new party ID (1-57):')
  if (!newPartyId) return

  try {
    const result = await changeParty(session.player.id, parseInt(newPartyId))
    console.log('Party changed:', result)

    // Reload session from localStorage
    session = getSession()
    updatePlayerInfo()
    showError('✅ พรรคถูกเปลี่ยนแล้ว / Party changed successfully!')
  } catch (error) {
    console.error('Change party error:', error)
    showError(error.message || 'Failed to change party')
  }
}

/**
 * Show error message
 */
function showError(message) {
  // Determine toast type based on message content
  if (message.includes('success') || message.startsWith('✅')) {
    toastManager.show(message.replace('✅ ', ''), 'success')
  } else {
    toastManager.show(message, 'error')
  }
}

/**
 * Initialize settings panel
 */
function initializeSettingsPanel() {
  settingsPanel = getSettingsPanel()

  // Add click handler for settings button
  const settingsBtn = document.getElementById('settings-btn')
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      settingsPanel.open()
    })
  }

  // Handle language changes
  settingsPanel.onLanguageChange((lang) => {
    console.log('Language changed to:', lang)
    i18n.setLanguage(lang)
  })

  // Handle sound changes
  settingsPanel.onSoundChange((enabled) => {
    console.log('Sound changed to:', enabled)
    // Update Map sound toggle if available
    if (thailandMap && thailandMap.soundToggle) {
      thailandMap.soundToggle.setEnabled(enabled)
    }
  })

  console.log('⚙️ Settings panel initialized')
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// Export for testing
export { init, showPartySelector, showGameScreen }
