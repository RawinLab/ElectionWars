/**
 * Election War - Main Entry Point
 * Real-time political clicker game for Thailand's 2026 election
 */

import { supabase } from './lib/supabase.js'
import { initAuth, getSession, joinGame, validateNickname, changeParty } from './lib/auth.js'
// import { ThailandMap } from './components/Map.js'  // Old SVG-based map
import { D3ThailandMap as ThailandMap } from './components/D3Map.js'  // New D3+GeoJSON map
import { Leaderboard } from './components/Leaderboard.js'
import { GameTimer } from './components/Timer.js'
import { GlobalStats } from './components/GlobalStats.js'
import { ConnectionStatus } from './components/ConnectionStatus.js'
import { realtimeManager } from './lib/realtime.js'
import { toastManager } from './components/Toast.js'
import { getSettingsPanel } from './components/SettingsPanel.js'
import i18n from './lib/i18n.js'
import { getPartyLogo, hasPartyLogo } from './lib/partyLogos.js'

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
let selectedParty = null
let highlightedIndex = -1
let isChangePartyMode = false  // Flag for party change mode

/**
 * Initialize the application
 */
async function init() {
  console.log('🗳️ Election War - Initializing...')

  try {
    // Always show game screen first (with map in background)
    document.getElementById('game-screen').classList.remove('hidden')

    // Load parties first
    await loadParties()

    // Check for existing session
    session = await initAuth()

    if (session) {
      // Player already joined - hide welcome and party selector
      hideWelcomeOverlay()
      hidePartySelectorOverlay()
      await initializeGameComponents()
    } else {
      // New player - show welcome overlay (map visible in background)
      showWelcomeOverlay()
      // Initialize map in background
      await initializeMap()
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
  // Party search autocomplete
  const partySearchInput = document.getElementById('party-search-input')
  if (partySearchInput) {
    partySearchInput.addEventListener('input', handlePartySearch)
    partySearchInput.addEventListener('keydown', handleAutocompleteKeydown)
    partySearchInput.addEventListener('focus', () => {
      if (partySearchInput.value.length > 0) {
        handlePartySearch({ target: partySearchInput })
      }
    })
  }

  // Close autocomplete when clicking outside
  document.addEventListener('click', (e) => {
    const autocompleteList = document.getElementById('party-autocomplete-list')
    const partySearchInput = document.getElementById('party-search-input')
    if (autocompleteList && !autocompleteList.contains(e.target) && e.target !== partySearchInput) {
      autocompleteList.classList.add('hidden')
    }
  })

  // Clear party button
  const clearPartyBtn = document.getElementById('clear-party-btn')
  if (clearPartyBtn) {
    clearPartyBtn.addEventListener('click', clearSelectedParty)
  }

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

  // Close modal button (for change party mode)
  const closeModalBtn = document.getElementById('close-party-modal-btn')
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      hidePartySelectorOverlay()
      // Show welcome overlay again if not in change party mode
      if (!isChangePartyMode) {
        showWelcomeOverlay()
      }
    })
  }

  // Welcome overlay buttons
  const welcomeJoinBtn = document.getElementById('welcome-join-btn')
  const welcomeRulesBtn = document.getElementById('welcome-rules-btn')

  if (welcomeJoinBtn) {
    welcomeJoinBtn.addEventListener('click', () => {
      hideWelcomeOverlay()
      showPartySelectorOverlay()
    })
  }

  if (welcomeRulesBtn) {
    welcomeRulesBtn.addEventListener('click', () => {
      const rulesModal = document.getElementById('rules-modal')
      if (rulesModal) {
        rulesModal.classList.remove('hidden')
      }
    })
  }

  // Rules modal
  const rulesBtn = document.getElementById('rules-btn')
  const rulesModal = document.getElementById('rules-modal')
  const closeRulesBtn = document.getElementById('close-rules-btn')

  if (rulesBtn && rulesModal) {
    rulesBtn.addEventListener('click', () => {
      rulesModal.classList.remove('hidden')
    })
  }

  if (closeRulesBtn && rulesModal) {
    closeRulesBtn.addEventListener('click', () => {
      rulesModal.classList.add('hidden')
    })
  }

  // Close rules modal when clicking overlay
  if (rulesModal) {
    rulesModal.addEventListener('click', (e) => {
      if (e.target === rulesModal) {
        rulesModal.classList.add('hidden')
      }
    })
  }

  // Mobile sidebar toggles
  const leftSidebar = document.getElementById('left-sidebar')
  const rightSidebar = document.getElementById('right-sidebar')
  const leftToggle = document.getElementById('left-sidebar-toggle')
  const rightToggle = document.getElementById('right-sidebar-toggle')

  if (leftToggle && leftSidebar) {
    leftToggle.addEventListener('click', () => {
      leftSidebar.classList.toggle('open')
      // Close right sidebar when opening left
      if (leftSidebar.classList.contains('open') && rightSidebar) {
        rightSidebar.classList.remove('open')
      }
    })
  }

  if (rightToggle && rightSidebar) {
    rightToggle.addEventListener('click', () => {
      rightSidebar.classList.toggle('open')
      // Close left sidebar when opening right
      if (rightSidebar.classList.contains('open') && leftSidebar) {
        leftSidebar.classList.remove('open')
      }
    })
  }

  // Close sidebars when clicking on map (mobile)
  const mapContainer = document.getElementById('thailand-map')
  if (mapContainer) {
    mapContainer.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        if (leftSidebar) leftSidebar.classList.remove('open')
        if (rightSidebar) rightSidebar.classList.remove('open')
      }
    })
  }

  // Leaderboard modal
  const showLeaderboardBtn = document.getElementById('show-full-leaderboard-btn')
  const leaderboardModal = document.getElementById('leaderboard-modal')
  const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn')

  if (showLeaderboardBtn && leaderboardModal) {
    showLeaderboardBtn.addEventListener('click', () => {
      renderFullLeaderboard()
      leaderboardModal.classList.remove('hidden')
    })
  }

  if (closeLeaderboardBtn && leaderboardModal) {
    closeLeaderboardBtn.addEventListener('click', () => {
      leaderboardModal.classList.add('hidden')
    })
  }

  if (leaderboardModal) {
    leaderboardModal.addEventListener('click', (e) => {
      if (e.target === leaderboardModal) {
        leaderboardModal.classList.add('hidden')
      }
    })
  }
}

/**
 * Show welcome overlay
 */
function showWelcomeOverlay() {
  const overlay = document.getElementById('welcome-overlay')
  if (overlay) {
    overlay.classList.remove('hidden')
  }
}

/**
 * Hide welcome overlay
 */
function hideWelcomeOverlay() {
  const overlay = document.getElementById('welcome-overlay')
  if (overlay) {
    overlay.classList.add('hidden')
  }
}

/**
 * Show party selector overlay
 * @param {boolean} changeMode - If true, show in change party mode
 */
function showPartySelectorOverlay(changeMode = false) {
  isChangePartyMode = changeMode
  const overlay = document.getElementById('party-selector-overlay')
  const nicknameGroup = document.querySelector('#party-selector-overlay .form-group:has(#nickname-input)')
  const joinButton = document.getElementById('join-button')
  const modalSubtitle = document.querySelector('#party-selector-overlay .modal-subtitle')
  const closeButton = document.getElementById('close-party-modal-btn')

  if (overlay) {
    overlay.classList.remove('hidden')

    // Reset state
    selectedParty = null
    document.getElementById('party-search-input').value = ''
    document.getElementById('selected-party-preview').classList.add('hidden')
    document.getElementById('party-autocomplete-list').classList.add('hidden')

    if (changeMode) {
      // Show close button in change mode (allow cancel)
      if (closeButton) closeButton.classList.remove('hidden')
      // Hide nickname input in change mode
      if (nicknameGroup) nicknameGroup.style.display = 'none'
      if (joinButton) {
        joinButton.textContent = 'เปลี่ยนพรรค / Change Party'
        joinButton.disabled = true
      }
      if (modalSubtitle) {
        modalSubtitle.textContent = 'เลือกพรรคใหม่ของคุณ (คลิกจะถูกรีเซ็ตเป็น 0)'
      }
    } else {
      // Hide close button in join mode (must select party)
      if (closeButton) closeButton.classList.add('hidden')
      // Show nickname input in join mode
      if (nicknameGroup) nicknameGroup.style.display = ''
      const nicknameInput = document.getElementById('nickname-input')
      if (nicknameInput) nicknameInput.value = ''
      if (joinButton) {
        joinButton.textContent = 'เข้าร่วมเกม / Join Game'
        joinButton.disabled = true
      }
      if (modalSubtitle) {
        modalSubtitle.textContent = 'เลือกพรรค ยึดครองจังหวัด ชิงชัยประเทศไทย'
      }
    }

    // Focus on search input
    setTimeout(() => {
      document.getElementById('party-search-input').focus()
    }, 100)
  }
}

/**
 * Hide party selector overlay
 */
function hidePartySelectorOverlay() {
  const overlay = document.getElementById('party-selector-overlay')
  if (overlay) {
    overlay.classList.add('hidden')
  }
  // Reset change mode flag
  isChangePartyMode = false
}

/**
 * Handle party search input
 */
function handlePartySearch(e) {
  const query = e.target.value.toLowerCase().trim()
  const autocompleteList = document.getElementById('party-autocomplete-list')

  if (!query) {
    autocompleteList.classList.add('hidden')
    return
  }

  // Filter parties and sort by ballot number
  const filteredParties = allParties.filter(party =>
    party.name_thai?.toLowerCase().includes(query) ||
    party.name_english?.toLowerCase().includes(query) ||
    (party.ballot_number && party.ballot_number.toString().includes(query))
  )
  .sort((a, b) => (a.ballot_number || 999) - (b.ballot_number || 999))
  .slice(0, 10) // Limit to 10 results

  if (filteredParties.length === 0) {
    autocompleteList.classList.add('hidden')
    return
  }

  // Render autocomplete list
  highlightedIndex = -1
  autocompleteList.innerHTML = filteredParties.map((party, index) => {
    // Use ballot_number for logo lookup (since id = ballot_number in new data)
    const logoUrl = getPartyLogo(party.ballot_number || party.id)
    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${party.name_english}" class="party-logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
         <div class="party-color-badge" style="background: ${party.official_color}; display: none;"></div>`
      : `<div class="party-color-badge" style="background: ${party.official_color};"></div>`

    const ballotNum = party.ballot_number || party.id
    return `
      <div class="autocomplete-item" data-party-id="${party.id}" data-index="${index}">
        <div class="party-ballot-number">เบอร์ ${ballotNum}</div>
        <div class="party-logo-container">
          ${logoHtml}
        </div>
        <div class="party-name-container">
          <div class="party-name-thai">${party.name_thai}</div>
          <div class="party-name-english">${party.name_english}</div>
        </div>
      </div>
    `
  }).join('')

  // Add click handlers
  autocompleteList.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      const partyId = parseInt(item.dataset.partyId)
      const party = allParties.find(p => p.id === partyId)
      if (party) {
        selectPartyFromAutocomplete(party)
      }
    })
  })

  autocompleteList.classList.remove('hidden')
}

/**
 * Handle keyboard navigation in autocomplete
 */
function handleAutocompleteKeydown(e) {
  const autocompleteList = document.getElementById('party-autocomplete-list')
  const items = autocompleteList.querySelectorAll('.autocomplete-item')

  if (items.length === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1)
    updateHighlighted(items)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightedIndex = Math.max(highlightedIndex - 1, 0)
    updateHighlighted(items)
  } else if (e.key === 'Enter' && highlightedIndex >= 0) {
    e.preventDefault()
    const item = items[highlightedIndex]
    const partyId = parseInt(item.dataset.partyId)
    const party = allParties.find(p => p.id === partyId)
    if (party) {
      selectPartyFromAutocomplete(party)
    }
  } else if (e.key === 'Escape') {
    autocompleteList.classList.add('hidden')
  }
}

/**
 * Update highlighted item in autocomplete
 */
function updateHighlighted(items) {
  items.forEach((item, index) => {
    item.classList.toggle('highlighted', index === highlightedIndex)
    if (index === highlightedIndex) {
      item.scrollIntoView({ block: 'nearest' })
    }
  })
}

/**
 * Select party from autocomplete
 */
function selectPartyFromAutocomplete(party) {
  selectedParty = party

  // Hide autocomplete
  const autocompleteList = document.getElementById('party-autocomplete-list')
  autocompleteList.classList.add('hidden')

  // Clear search input
  const searchInput = document.getElementById('party-search-input')
  searchInput.value = ''

  // Show selected party preview
  const preview = document.getElementById('selected-party-preview')
  const previewColor = preview.querySelector('.preview-party-color')
  const previewName = preview.querySelector('.preview-party-name')
  const previewEnglish = preview.querySelector('.preview-party-english')

  // Check if party has a logo (use ballot_number as key)
  const logoUrl = getPartyLogo(party.ballot_number || party.id)
  if (logoUrl) {
    previewColor.innerHTML = `<img src="${logoUrl}" alt="${party.name_english}" class="preview-logo-img" onerror="this.style.display='none'; this.parentElement.style.background='${party.official_color}';">`
    previewColor.style.background = 'transparent'
  } else {
    previewColor.innerHTML = ''
    previewColor.style.background = party.official_color
  }

  const ballotNum = party.ballot_number || party.id
  previewName.textContent = `เบอร์ ${ballotNum} - ${party.name_thai}`
  previewEnglish.textContent = party.name_english

  preview.classList.remove('hidden')

  // Update join button state
  updateJoinButtonState()

  // Focus nickname input
  document.getElementById('nickname-input').focus()
}

/**
 * Clear selected party
 */
function clearSelectedParty() {
  selectedParty = null

  // Hide preview
  const preview = document.getElementById('selected-party-preview')
  preview.classList.add('hidden')

  // Update join button state
  updateJoinButtonState()

  // Focus search input
  document.getElementById('party-search-input').focus()
}

/**
 * Update join button state
 */
function updateJoinButtonState() {
  const joinButton = document.getElementById('join-button')
  const nicknameInput = document.getElementById('nickname-input')
  const nickname = nicknameInput?.value.trim() || ''

  if (isChangePartyMode) {
    // In change mode, only need party selection
    joinButton.disabled = !selectedParty
  } else {
    // In join mode, need party and nickname
    const canJoin = selectedParty && nickname.length >= 2 && nickname.length <= 20
    joinButton.disabled = !canJoin
  }
}

/**
 * Load parties from Supabase
 */
async function loadParties() {
  try {
    const { data: parties, error } = await supabase
      .from('parties')
      .select('*')
      .order('ballot_number', { ascending: true })

    if (error) throw error

    // Store parties globally
    allParties = parties
    console.log(`📋 Loaded ${parties.length} parties`)
  } catch (error) {
    console.error('Failed to load parties:', error)
    showError('Failed to load parties. Please refresh.')
  }
}

/**
 * Handle nickname input validation
 */
function handleNicknameInput(e) {
  const nickname = e.target.value
  const errorEl = document.getElementById('nickname-error')

  const validation = validateNickname(nickname)

  if (nickname.length > 0 && !validation.valid) {
    errorEl.textContent = validation.error
    errorEl.classList.remove('hidden')
  } else {
    errorEl.classList.add('hidden')
  }

  // Update join button state
  updateJoinButtonState()
}

/**
 * Handle join game button click (also handles change party)
 */
async function handleJoinGame() {
  const nicknameInput = document.getElementById('nickname-input')
  const joinButton = document.getElementById('join-button')
  const errorEl = document.getElementById('nickname-error')

  // Check party selection
  if (!selectedParty) {
    showError('กรุณาเลือกพรรคก่อน / Please select a party first')
    return
  }

  if (isChangePartyMode) {
    // Handle party change
    await handleChangePartySubmit(joinButton)
  } else {
    // Handle new player join
    const nickname = nicknameInput.value.trim()

    // Validate nickname
    const validation = validateNickname(nickname)
    if (!validation.valid) {
      errorEl.textContent = validation.error
      errorEl.classList.remove('hidden')
      return
    }

    // Disable button during join
    joinButton.disabled = true
    joinButton.textContent = 'กำลังเข้าร่วม...'

    try {
      session = await joinGame(selectedParty.id, nickname)
      console.log('✅ Joined game:', session)

      // Hide party selector overlay
      hidePartySelectorOverlay()

      // Initialize remaining game components
      await initializeGameComponents()

      toastManager.show(`ยินดีต้อนรับ ${nickname}!`, 'success')
    } catch (error) {
      console.error('Join game error:', error)
      errorEl.textContent = error.message || 'Failed to join game'
      errorEl.classList.remove('hidden')
      joinButton.disabled = false
      joinButton.textContent = 'เข้าร่วมเกม / Join Game'
    }
  }
}

/**
 * Handle change party submission
 */
async function handleChangePartySubmit(joinButton) {
  // Disable button during change
  joinButton.disabled = true
  joinButton.textContent = 'กำลังเปลี่ยนพรรค...'

  try {
    const result = await changeParty(session.player.id, selectedParty.id)
    console.log('Party changed:', result)

    // Reload session from localStorage
    session = getSession()

    // Hide overlay
    hidePartySelectorOverlay()

    // Reset change mode flag
    isChangePartyMode = false

    // Update UI
    updatePlayerInfo()
    if (thailandMap) {
      thailandMap.session = session
    }

    toastManager.show(`เปลี่ยนพรรคเป็น ${selectedParty.name_thai} สำเร็จ!`, 'success')
  } catch (error) {
    console.error('Change party error:', error)
    showError(error.message || 'Failed to change party')
    joinButton.disabled = false
    joinButton.textContent = 'เปลี่ยนพรรค / Change Party'
  }
}

/**
 * Initialize all game components (called after successful login)
 */
async function initializeGameComponents() {
  // Update player info in header
  updatePlayerInfo()

  // Initialize map if not already done
  if (!thailandMap) {
    await initializeMap()
  } else {
    // Update map with session
    thailandMap.session = session
    await thailandMap.loadData()
    thailandMap.updateAllProvinces()
  }

  // Initialize other components in parallel
  await Promise.all([
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

  // Update conquered list
  updateConqueredList()

  console.log('🎮 Game components initialized. Session:', session)
}

/**
 * Legacy function - kept for compatibility
 */
async function showGameScreen() {
  hidePartySelectorOverlay()
  await initializeGameComponents()
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
    updatePlayerRank()
    console.log('📊 Leaderboard initialized')

    // Render conquered leaderboard (top 5)
    renderConqueredLeaderboard()

    // Update conquered leaderboard when main leaderboard updates
    leaderboard.onUpdate(() => {
      renderConqueredLeaderboard()
    })
  } catch (error) {
    console.error('Failed to initialize leaderboard:', error)
  }
}

/**
 * Render top 5 parties in the conquered leaderboard panel
 */
function renderConqueredLeaderboard() {
  const container = document.getElementById('conquered-leaderboard')
  if (!container || !leaderboard || !leaderboard.currentData) return

  const top5 = leaderboard.currentData.slice(0, 5)

  if (top5.length === 0) {
    container.innerHTML = '<div class="leaderboard-empty">ยังไม่มีข้อมูล</div>'
    return
  }

  const html = top5.map((party, index) => {
    const rank = index + 1
    const rankClass = rank <= 3 ? `rank-${rank}` : ''
    return `
      <div class="conquered-leaderboard-item">
        <span class="conquered-rank ${rankClass}">${rank}</span>
        <span class="conquered-party-badge" style="background-color: ${party.party_color}"></span>
        <span class="conquered-party-name">${party.party_name}</span>
        <span class="conquered-province-count">${party.provinces_count}</span>
      </div>
    `
  }).join('')

  container.innerHTML = html
}

/**
 * Render full leaderboard in modal
 */
function renderFullLeaderboard() {
  const container = document.getElementById('full-leaderboard-list')
  if (!container || !leaderboard || !leaderboard.currentData) return

  const data = leaderboard.currentData

  if (data.length === 0) {
    container.innerHTML = '<div class="leaderboard-empty">ยังไม่มีข้อมูล</div>'
    return
  }

  const html = data.map((party, index) => {
    const rank = index + 1
    const rankClass = rank <= 3 ? `rank-${rank}` : ''
    const isTop3 = rank <= 3
    return `
      <div class="full-leaderboard-item ${isTop3 ? 'top-3' : ''}">
        <span class="full-leaderboard-rank ${rankClass}">${rank}</span>
        <span class="full-leaderboard-badge" style="background-color: ${party.party_color}"></span>
        <span class="full-leaderboard-name">${party.party_name}</span>
        <div class="full-leaderboard-stats">
          <span class="full-leaderboard-provinces">${party.provinces_count}</span>
        </div>
      </div>
    `
  }).join('')

  container.innerHTML = html
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
      leaderboard.fetch().then(() => updatePlayerRank())
    }

    // Update conquered list
    updateConqueredList()
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
  if (!session) return

  const { player, party } = session

  // Update header click counter
  const clickCount = document.getElementById('click-count')
  if (clickCount) {
    clickCount.textContent = player.total_clicks?.toLocaleString() || '0'
  }

  // Update sidebar stats
  const playerClicks = document.getElementById('player-clicks')
  if (playerClicks) {
    playerClicks.textContent = player.total_clicks?.toLocaleString() || '0'
  }

  const playerParty = document.getElementById('player-party')
  if (playerParty) {
    playerParty.innerHTML = `<span class="party-badge" style="background: ${party.official_color}"></span> ${party.name_thai}`
  }

  // Update Your Empire panel - party info with logo
  const empirePartyLogo = document.getElementById('empire-party-logo')
  const empireLogoImg = document.getElementById('empire-logo-img')
  const empirePartyColor = document.getElementById('empire-party-color')
  const empirePartyName = document.getElementById('empire-party-name')
  const empirePlayerName = document.getElementById('empire-player-name')
  const empirePartyBadge = document.getElementById('empire-party-badge')

  // Set party color CSS variable for glow effects
  if (empirePartyLogo) {
    empirePartyLogo.style.setProperty('--party-color', party.official_color)
    empirePartyLogo.style.borderColor = party.official_color
  }

  // Show party logo if available
  const logoUrl = getPartyLogo(party.ballot_number || party.id)
  if (empireLogoImg && logoUrl) {
    empireLogoImg.src = logoUrl
    empireLogoImg.alt = party.name_english || party.name_thai
    empireLogoImg.classList.remove('hidden')
    empireLogoImg.onerror = () => {
      empireLogoImg.classList.add('hidden')
    }
  } else if (empireLogoImg) {
    empireLogoImg.classList.add('hidden')
  }

  // Fallback color dot (shown when no logo)
  if (empirePartyColor) {
    empirePartyColor.style.background = party.official_color
    empirePartyColor.style.boxShadow = `0 0 12px ${party.official_color}`
  }

  if (empirePartyName) {
    empirePartyName.textContent = party.name_thai || party.name_english
    empirePartyName.style.color = party.official_color
    empirePartyName.style.textShadow = `0 0 10px ${party.official_color}`
  }
  if (empirePlayerName) {
    empirePlayerName.textContent = player.nickname
  }
  if (empirePartyBadge) {
    empirePartyBadge.style.setProperty('--party-color', party.official_color)
  }

  // Add change party button handler
  const changePartyBtn = document.getElementById('change-party-btn')
  if (changePartyBtn) {
    // Remove existing listener to prevent duplicates
    changePartyBtn.replaceWith(changePartyBtn.cloneNode(true))
    document.getElementById('change-party-btn').addEventListener('click', showChangePartyDialog)
  }

  // Update conquered provinces list
  updateConqueredList()

  // Update legacy player info element if present
  const playerInfoEl = document.getElementById('player-info')
  if (playerInfoEl) {
    playerInfoEl.innerHTML = `
      <div class="player-badge" style="background: ${party.official_color}"></div>
      <div class="player-details">
        <span class="player-name">${player.nickname}</span>
        <span class="player-party">${party.name_thai}</span>
      </div>
    `
  }
}

/**
 * Update conquered provinces list for the player's party
 */
async function updateConqueredList() {
  if (!session || !thailandMap) return

  const { party } = session
  const conqueredList = document.getElementById('conquered-list')
  const conqueredCount = document.getElementById('player-conquered-count')

  if (!conqueredList) return

  // Get provinces controlled by player's party
  const controlledProvinces = []
  for (const [provinceId, state] of thailandMap.provinceStates) {
    if (state.controlling_party_id === party.id) {
      const feature = thailandMap.geoData?.features.find(f => f.properties.id === provinceId)
      controlledProvinces.push({
        id: provinceId,
        nameThai: feature?.properties.name_thai || `Province ${provinceId}`,
        nameEnglish: feature?.properties.name_english || ''
      })
    }
  }

  // Update count
  if (conqueredCount) {
    conqueredCount.textContent = controlledProvinces.length
  }

  // Update list
  if (controlledProvinces.length === 0) {
    conqueredList.innerHTML = '<div class="conquered-empty">ยังไม่มีจังหวัดที่ยึดครอง</div>'
  } else {
    conqueredList.innerHTML = controlledProvinces.map(province => `
      <div class="conquered-item" data-province-id="${province.id}">
        <span class="province-dot" style="background: ${party.official_color}"></span>
        <span class="province-name">${province.nameThai}</span>
      </div>
    `).join('')

    // Add click handlers to focus on province
    conqueredList.querySelectorAll('.conquered-item').forEach(item => {
      item.addEventListener('click', () => {
        const provinceId = parseInt(item.dataset.provinceId)
        if (thailandMap) {
          thailandMap.updateTargetSidebar(provinceId)
        }
      })
    })
  }
}

/**
 * Update player rank from leaderboard data
 */
function updatePlayerRank() {
  if (!session || !leaderboard?.currentData) return
  const partyRank = leaderboard.currentData.find(p => p.party_id === session.party.id)
  const rankEl = document.getElementById('player-rank')
  if (rankEl && partyRank) {
    rankEl.textContent = `#${partyRank.rank}`
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

  // Show party selector overlay in change mode
  showPartySelectorOverlay(true)
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
export { init, showPartySelectorOverlay, hidePartySelectorOverlay, showGameScreen }
