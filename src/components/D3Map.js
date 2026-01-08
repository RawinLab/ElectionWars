import * as d3 from 'd3'
import { supabase } from '../lib/supabase.js'

export class D3ThailandMap {
  constructor(container, soundToggle = null) {
    this.container = container
    this.parties = new Map()
    this.provinceStates = new Map()
    this.lastClickTime = 0
    this.session = null
    this.CLICK_COOLDOWN = 100
    this.soundToggle = soundToggle

    // D3 specific
    this.svg = null
    this.projection = null
    this.path = null
    this.geoData = null
    this.width = 600
    this.height = 900

    // Reusable overlay element
    this.hpShieldOverlay = null
    this.overlayHideTimer = null

    // Ambient missile animation
    this.ambientMissileInterval = null
  }

  async init(session) {
    this.session = session
    await this.loadGeoJSON()
    await this.loadData()
    this.createMap()
    this.createHpShieldOverlay()  // Create reusable overlay
    this.addProvinceLabels()
    this.updateAllProvinces()
    this.setupInteractions()
    this.enableZoom()  // Enable drag/pan by default
    this.startAmbientMissiles()  // Start ambient animation
  }

  startAmbientMissiles() {
    // Fire random missiles every 500-1500ms for ambient animation
    const fireRandomMissile = () => {
      if (!this.geoData || !this.container) return

      // Pick a random province
      const randomIndex = Math.floor(Math.random() * this.geoData.features.length)
      const feature = this.geoData.features[randomIndex]
      const centroid = this.path.centroid(feature)

      // Calculate position
      const svgRect = this.svg.node().getBoundingClientRect()
      const scaleX = svgRect.width / 600
      const scaleY = svgRect.height / 900

      // Add some randomness to the target position within the province
      const targetX = centroid[0] * scaleX + (Math.random() - 0.5) * 30
      const targetY = centroid[1] * scaleY + (Math.random() - 0.5) * 30

      // Fire ambient missile (no glow, just the line)
      this.showAmbientMissile(targetX, targetY)
    }

    // Start with a random interval
    const scheduleNext = () => {
      const delay = 300 + Math.random() * 1200  // 300-1500ms
      this.ambientMissileInterval = setTimeout(() => {
        fireRandomMissile()
        scheduleNext()
      }, delay)
    }

    scheduleNext()
  }

  showAmbientMissile(targetX, targetY) {
    const containerWidth = this.container.offsetWidth
    const containerHeight = this.container.offsetHeight

    // Random direction
    const direction = Math.floor(Math.random() * 5)
    let startX, startY

    switch (direction) {
      case 0: // Top
        startX = targetX + (Math.random() - 0.5) * 300
        startY = -50
        break
      case 1: // Top-right
        startX = containerWidth + 50
        startY = Math.random() * containerHeight * 0.4 - 50
        break
      case 2: // Right
        startX = containerWidth + 50
        startY = targetY + (Math.random() - 0.5) * 200
        break
      case 3: // Top-left
        startX = -50
        startY = Math.random() * containerHeight * 0.4 - 50
        break
      case 4: // Left
        startX = -50
        startY = targetY + (Math.random() - 0.5) * 200
        break
      default:
        startX = Math.random() * containerWidth * 0.3
        startY = -50
    }

    const missile = document.createElement('div')
    missile.className = 'ambient-missile'

    const deltaX = targetX - startX
    const deltaY = targetY - startY
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)

    // Random color from 5 colors with lower opacity
    const colors = ['#00ffff', '#ff00ff', '#00ff88', '#ffaa00', '#ff4466']
    const color = colors[Math.floor(Math.random() * colors.length)]

    missile.style.cssText = `
      position: absolute;
      left: ${startX}px;
      top: ${startY}px;
      width: ${length}px;
      height: 1px;
      background: linear-gradient(90deg, transparent, ${color}66);
      transform-origin: left center;
      transform: rotate(${angle}deg);
      pointer-events: none;
      z-index: 50;
      opacity: 0;
      animation: ambientMissileShoot 0.4s ease-out forwards;
    `

    this.container.appendChild(missile)

    setTimeout(() => {
      missile.remove()
    }, 500)
  }

  stopAmbientMissiles() {
    if (this.ambientMissileInterval) {
      clearTimeout(this.ambientMissileInterval)
      this.ambientMissileInterval = null
    }
  }

  createHpShieldOverlay() {
    // Create reusable overlay element
    this.hpShieldOverlay = document.createElement('div')
    this.hpShieldOverlay.className = 'hp-shield-overlay'
    this.hpShieldOverlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 1001;
      opacity: 0;
      transition: opacity 0.2s ease;
    `
    this.hpShieldOverlay.innerHTML = `
      <div class="overlay-header">
        <span class="overlay-flag">🇹🇭</span>
        <span class="overlay-name"></span>
        <span class="overlay-status"></span>
      </div>
      <div class="overlay-stat">
        <span class="stat-icon">💗</span>
        <span class="stat-label">HP</span>
        <span class="stat-value hp-value"></span>
      </div>
      <div class="overlay-hp-bar">
        <div class="overlay-hp-fill"></div>
      </div>
      <div class="overlay-stat">
        <span class="stat-icon">💎</span>
        <span class="stat-label">SHIELD</span>
        <span class="stat-value shield-value"></span>
      </div>
    `
    this.container.appendChild(this.hpShieldOverlay)
  }

  async loadGeoJSON() {
    const response = await fetch('/thailand-provinces-simple.geojson')
    if (!response.ok) {
      throw new Error('Failed to load Thailand GeoJSON')
    }
    this.geoData = await response.json()
  }

  async loadData() {
    const [partiesResult, provincesResult] = await Promise.all([
      supabase.from('parties').select('*'),
      supabase.from('province_state').select('*')
    ])

    if (partiesResult.error) {
      throw new Error(`Failed to load parties: ${partiesResult.error.message}`)
    }

    if (provincesResult.error) {
      throw new Error(`Failed to load province states: ${provincesResult.error.message}`)
    }

    this.parties.clear()
    for (const party of partiesResult.data) {
      this.parties.set(party.id, party)
    }

    this.provinceStates.clear()
    for (const province of provincesResult.data) {
      this.provinceStates.set(province.province_id, province)
    }
  }

  createMap() {
    // Clear container
    this.container.innerHTML = ''

    // Get container dimensions
    const rect = this.container.getBoundingClientRect()
    this.width = rect.width || 600
    this.height = rect.height || 900

    // Create SVG element - fullscreen map
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('viewBox', '0 0 600 900')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('position', 'absolute')
      .style('top', '0')
      .style('left', '0')
      .style('width', '100%')
      .style('height', '100%')
      .style('background', 'transparent')

    // Create projection for Thailand
    // Thailand's approximate bounds: Lat 5.5-20.5, Lon 97.5-106
    this.projection = d3.geoMercator()
      .center([101.5, 13.5])  // Center of Thailand
      .scale(2800)
      .translate([300, 450])

    this.path = d3.geoPath().projection(this.projection)

    // Create group for provinces
    const provincesGroup = this.svg.append('g')
      .attr('id', 'thailand-provinces')

    // Draw provinces
    provincesGroup.selectAll('path')
      .data(this.geoData.features)
      .enter()
      .append('path')
      .attr('class', 'province')
      .attr('d', this.path)
      .attr('data-id', d => d.properties.id)
      .attr('data-name-thai', d => d.properties.name_thai)
      .attr('data-name-english', d => d.properties.name_english)
      .style('fill', '#3a3a4d')
      .style('stroke', '#6366f1')
      .style('stroke-width', '1px')
      .style('cursor', 'pointer')
      .style('transition', 'fill 0.2s ease, filter 0.2s ease')

    // Add CSS styles via <style> element
    const defs = this.svg.append('defs')
    defs.append('style').text(`
      .province:hover {
        filter: brightness(1.3);
      }
      @keyframes feedbackFloat {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -100%) scale(1.5);
        }
      }
      @keyframes captureFlash {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(2); }
      }
    `)
  }

  updateProvinceColor(provinceId, partyColor) {
    this.svg.select(`[data-id="${provinceId}"]`)
      .style('fill', partyColor)
  }

  updateAllProvinces() {
    for (const [provinceId, state] of this.provinceStates) {
      const party = this.parties.get(state.controlling_party_id)
      if (party) {
        this.updateProvinceColor(provinceId, party.official_color)
      }
    }
  }

  setupInteractions() {
    const self = this

    // Click handlers
    this.svg.selectAll('.province')
      .on('click', function(event) {
        const provinceId = parseInt(d3.select(this).attr('data-id'))
        // Get mouse position relative to container
        const containerRect = self.container.getBoundingClientRect()
        const clickX = event.clientX - containerRect.left
        const clickY = event.clientY - containerRect.top
        self.handleClick(provinceId, clickX, clickY)
      })

    // Hover handlers
    this.setupHoverHandlers()
  }

  async handleClick(provinceId, clickX, clickY) {
    const now = Date.now()
    if (now - this.lastClickTime < this.CLICK_COOLDOWN) {
      return
    }
    this.lastClickTime = now

    if (!this.session) {
      console.warn('No active session for click handling')
      return
    }

    const { data, error } = await supabase.rpc('click_province', {
      p_player_id: this.session.player.id,
      p_province_id: provinceId,
      p_party_id: this.session.party.id
    })

    if (error) {
      console.error('Click province error:', error.message)
      return
    }

    if (data) {
      this.showClickFeedback(provinceId, data, clickX, clickY)

      if (data.action === 'capture' || data.action === 'attack' || data.action === 'defend') {
        await this.loadData()
        this.updateAllProvinces()

        // Update target sidebar after data reload
        this.updateTargetSidebar(provinceId)

        // Increment session click count and update UI elements
        if (this.session && this.session.player) {
          this.session.player.total_clicks = (this.session.player.total_clicks || 0) + 1
          const formattedClicks = this.session.player.total_clicks.toLocaleString()

          // Update header click counter (new cyberpunk UI)
          const clickCount = document.getElementById('click-count')
          if (clickCount) {
            clickCount.textContent = formattedClicks
          }

          // Update sidebar player clicks
          const playerClicks = document.getElementById('player-clicks')
          if (playerClicks) {
            playerClicks.textContent = formattedClicks
          }

          // Legacy header click counter
          const headerClickCounter = document.getElementById('header-click-count')
          if (headerClickCounter) {
            headerClickCounter.textContent = formattedClicks
          }
        }
      }
    }
  }

  playClickSound() {
    if (!this.soundToggle || !this.soundToggle.isEnabled()) {
      return
    }

    try {
      const audio = new Audio('/sounds/click.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {
        // Silently handle playback errors
      })
    } catch (error) {
      // Silently handle audio creation errors
    }
  }

  showClickFeedback(provinceId, result, clickX, clickY) {
    this.playClickSound()

    const provinceElement = this.container.querySelector(`[data-id="${provinceId}"]`)
    if (!provinceElement) return

    // Use mouse click position as target
    const targetX = clickX
    const targetY = clickY

    if (!this.container.style.position || this.container.style.position === 'static') {
      this.container.style.position = 'relative'
    }

    // Show missile line effect from random direction to click position
    this.showMissileLine(targetX, targetY, result.action)

    // Show impact glow effect at click position
    this.showImpactGlow(targetX, targetY, result.action)

    // Show HP/Shield overlay below click position
    this.showHpShieldOverlay(provinceId, targetX, targetY, result)

    // Show floating feedback text above click position
    const feedback = document.createElement('div')
    feedback.className = 'click-feedback'
    feedback.style.position = 'absolute'
    feedback.style.left = `${targetX}px`
    feedback.style.top = `${targetY - 40}px`
    feedback.style.transform = 'translate(-50%, -50%)'
    feedback.style.pointerEvents = 'none'
    feedback.style.fontWeight = 'bold'
    feedback.style.fontSize = '24px'
    feedback.style.zIndex = '1000'
    feedback.style.animation = 'feedbackFloat 1s ease-out forwards'
    feedback.style.textShadow = '0 0 10px currentColor'

    switch (result.action) {
      case 'defend':
        feedback.textContent = '+1'
        feedback.style.color = '#22c55e'
        break
      case 'attack':
        feedback.textContent = '-1'
        feedback.style.color = '#ef4444'
        break
      case 'capture':
        feedback.textContent = 'CAPTURED!'
        feedback.style.color = '#f59e0b'
        feedback.style.fontSize = '28px'
        this.playCaptureAnimation(provinceElement)
        break
      default:
        feedback.textContent = '!'
        feedback.style.color = '#6b7280'
    }

    this.container.appendChild(feedback)

    setTimeout(() => {
      feedback.remove()
    }, 1000)
  }

  showMissileLine(targetX, targetY, action) {
    const containerWidth = this.container.offsetWidth
    const containerHeight = this.container.offsetHeight

    // Random direction: 0=top, 1=top-right, 2=right, 3=top-left, 4=left
    const direction = Math.floor(Math.random() * 5)
    let startX, startY

    switch (direction) {
      case 0: // Top
        startX = targetX + (Math.random() - 0.5) * 200
        startY = -50
        break
      case 1: // Top-right
        startX = containerWidth + 50
        startY = Math.random() * containerHeight * 0.3 - 50
        break
      case 2: // Right
        startX = containerWidth + 50
        startY = targetY + (Math.random() - 0.5) * 200
        break
      case 3: // Top-left
        startX = -50
        startY = Math.random() * containerHeight * 0.3 - 50
        break
      case 4: // Left
        startX = -50
        startY = targetY + (Math.random() - 0.5) * 200
        break
      default:
        startX = Math.random() * containerWidth * 0.3
        startY = -50
    }

    const missile = document.createElement('div')
    missile.className = 'missile-line'

    // Calculate line angle and length
    const deltaX = targetX - startX
    const deltaY = targetY - startY
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)

    // Random color from 5 cyberpunk colors
    const colors = ['#00ffff', '#ff00ff', '#00ff88', '#ffaa00', '#ff4466']
    const color = colors[Math.floor(Math.random() * colors.length)]

    missile.style.cssText = `
      position: absolute;
      left: ${startX}px;
      top: ${startY}px;
      width: ${length}px;
      height: 2px;
      background: linear-gradient(90deg, transparent, ${color});
      transform-origin: left center;
      transform: rotate(${angle}deg);
      pointer-events: none;
      z-index: 999;
      opacity: 0;
      animation: missileShoot 0.3s ease-out forwards;
    `

    this.container.appendChild(missile)

    setTimeout(() => {
      missile.remove()
    }, 400)
  }

  showImpactGlow(targetX, targetY, action) {
    const glow = document.createElement('div')
    glow.className = 'impact-glow'

    const color = action === 'defend' ? '#22c55e' : action === 'capture' ? '#f59e0b' : '#ff6b35'

    glow.style.cssText = `
      position: absolute;
      left: ${targetX}px;
      top: ${targetY}px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: radial-gradient(circle, ${color}88 0%, ${color}44 40%, transparent 70%);
      transform: translate(-50%, -50%) scale(0);
      pointer-events: none;
      z-index: 998;
      animation: impactPulse 0.5s ease-out forwards;
    `

    this.container.appendChild(glow)

    setTimeout(() => {
      glow.remove()
    }, 500)
  }

  showHpShieldOverlay(provinceId, targetX, targetY, result) {
    if (!this.hpShieldOverlay) return

    const state = this.provinceStates.get(provinceId)
    const feature = this.geoData.features.find(f => f.properties.id === provinceId)
    if (!state || !feature) return

    const party = this.parties.get(state.controlling_party_id)
    const nameThai = feature.properties.name_thai || ''
    const shieldCurrent = state.shield_current || 0
    const shieldMax = state.shield_max || 1
    const shieldPct = Math.round((shieldCurrent / shieldMax) * 100)

    // Determine if enemy or friendly
    const isEnemy = this.session && party && party.id !== this.session.party?.id
    const isFriendly = this.session && party && party.id === this.session.party?.id
    const statusText = isFriendly ? 'FRIENDLY' : isEnemy ? 'ENEMY' : 'NEUTRAL'
    const statusColor = isFriendly ? '#22c55e' : isEnemy ? '#ef4444' : '#6b7280'
    const hpColor = shieldPct > 50 ? '#22c55e' : shieldPct > 20 ? '#f59e0b' : '#ef4444'

    // Clear any pending hide timer
    if (this.overlayHideTimer) {
      clearTimeout(this.overlayHideTimer)
    }

    // Update overlay position
    this.hpShieldOverlay.style.left = `${targetX}px`
    this.hpShieldOverlay.style.top = `${targetY + 30}px`
    this.hpShieldOverlay.style.transform = 'translateX(-50%)'
    this.hpShieldOverlay.style.opacity = '1'

    // Update overlay content
    const nameEl = this.hpShieldOverlay.querySelector('.overlay-name')
    const statusEl = this.hpShieldOverlay.querySelector('.overlay-status')
    const hpValueEl = this.hpShieldOverlay.querySelector('.hp-value')
    const hpFillEl = this.hpShieldOverlay.querySelector('.overlay-hp-fill')
    const shieldValueEl = this.hpShieldOverlay.querySelector('.shield-value')

    if (nameEl) nameEl.textContent = nameThai
    if (statusEl) {
      statusEl.textContent = statusText
      statusEl.style.background = `${statusColor}22`
      statusEl.style.color = statusColor
      statusEl.style.borderColor = `${statusColor}44`
    }
    if (hpValueEl) hpValueEl.textContent = `${shieldCurrent.toLocaleString()}/${shieldMax.toLocaleString()}`
    if (hpFillEl) {
      hpFillEl.style.width = `${shieldPct}%`
      hpFillEl.style.background = hpColor
    }
    if (shieldValueEl) shieldValueEl.textContent = shieldCurrent > 0 ? shieldCurrent.toLocaleString() : '0'

    // Set timer to hide overlay
    this.overlayHideTimer = setTimeout(() => {
      this.hpShieldOverlay.style.opacity = '0'
    }, 1500)
  }

  playCaptureAnimation(provinceElement) {
    d3.select(provinceElement)
      .transition()
      .duration(250)
      .style('filter', 'brightness(2)')
      .transition()
      .duration(250)
      .style('filter', 'brightness(1)')
  }

  updateTargetSidebar(provinceId) {
    const state = this.provinceStates.get(provinceId)
    const feature = this.geoData.features.find(f => f.properties.id === provinceId)

    // Get province names
    const nameThai = feature?.properties.name_thai || ''
    const nameEnglish = feature?.properties.name_english || ''

    // Update province name
    const targetName = document.getElementById('target-province-name')
    const targetThai = document.getElementById('target-province-thai')
    if (targetName) targetName.textContent = nameEnglish || `Province ${provinceId}`
    if (targetThai) targetThai.textContent = nameThai

    if (state) {
      const shieldCurrent = state.shield_current || 0
      const shieldMax = state.shield_max || 1
      const shieldPct = Math.round((shieldCurrent / shieldMax) * 100)

      // Update shield bar and values
      const shieldFill = document.getElementById('target-shield-fill')
      const shieldValue = document.getElementById('target-shield-value')
      const shieldStatus = document.getElementById('target-shield-status')
      if (shieldFill) shieldFill.style.width = `${shieldPct}%`
      if (shieldValue) shieldValue.textContent = `${shieldCurrent.toLocaleString()}/${shieldMax.toLocaleString()}`
      if (shieldStatus) {
        if (shieldCurrent === 0) {
          shieldStatus.textContent = 'UNPROTECTED'
          shieldStatus.style.color = '#ef4444'
        } else if (shieldPct < 30) {
          shieldStatus.textContent = 'LOW SHIELD'
          shieldStatus.style.color = '#f59e0b'
        } else {
          shieldStatus.textContent = 'PROTECTED'
          shieldStatus.style.color = '#22c55e'
        }
      }

      // Update health (using shield as health since this game uses shield as the main HP)
      const healthFill = document.getElementById('target-health-fill')
      const healthValue = document.getElementById('target-health-value')
      const healthPercent = document.getElementById('target-health-percent')
      const healthStatus = document.getElementById('target-health-status')
      if (healthFill) healthFill.style.width = `${shieldPct}%`
      if (healthValue) healthValue.textContent = `${shieldCurrent.toLocaleString()}/${shieldMax.toLocaleString()}`
      if (healthPercent) healthPercent.textContent = `${shieldPct}%`
      if (healthStatus) {
        const party = this.parties.get(state.controlling_party_id)
        if (party) {
          healthStatus.textContent = party.name_thai || party.name_english
          healthStatus.style.color = party.official_color
        } else {
          healthStatus.textContent = 'NEUTRAL'
          healthStatus.style.color = '#6b7280'
        }
      }

      // Update total clicks
      const totalClicks = document.getElementById('target-total-clicks')
      if (totalClicks) totalClicks.textContent = state.total_clicks?.toLocaleString() || '0'

      // Update controller party
      const controllerEl = document.getElementById('target-controller-party')
      if (controllerEl) {
        const party = this.parties.get(state.controlling_party_id)
        if (party) {
          controllerEl.innerHTML = `<span class="party-badge" style="background: ${party.official_color}"></span> ${party.name_thai}`
        } else {
          controllerEl.innerHTML = '<span class="neutral-badge">Neutral</span>'
        }
      }

      // Update territory type
      const territoryType = document.getElementById('target-territory-type')
      if (territoryType && this.session) {
        const party = this.parties.get(state.controlling_party_id)
        if (!party) {
          territoryType.textContent = 'Neutral Territory'
          territoryType.style.color = '#6b7280'
        } else if (party.id === this.session.party?.id) {
          territoryType.textContent = 'Your Territory'
          territoryType.style.color = '#22c55e'
        } else {
          territoryType.textContent = 'Enemy Territory'
          territoryType.style.color = '#ef4444'
        }
      }
    }
  }

  setupHoverHandlers() {
    const self = this

    let tooltip = document.getElementById('province-tooltip')
    if (!tooltip) {
      tooltip = document.createElement('div')
      tooltip.id = 'province-tooltip'
      tooltip.style.position = 'fixed'
      tooltip.style.display = 'none'
      tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
      tooltip.style.color = 'white'
      tooltip.style.padding = '12px 16px'
      tooltip.style.borderRadius = '8px'
      tooltip.style.fontSize = '14px'
      tooltip.style.pointerEvents = 'none'
      tooltip.style.zIndex = '10000'
      tooltip.style.maxWidth = '280px'
      tooltip.style.border = '1px solid rgba(99, 102, 241, 0.5)'
      tooltip.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)'
      document.body.appendChild(tooltip)
    }

    this.svg.selectAll('.province')
      .on('mouseover', function(event) {
        const el = d3.select(this)
        const provinceId = parseInt(el.attr('data-id'))
        const nameThai = el.attr('data-name-thai')
        const nameEnglish = el.attr('data-name-english')
        const state = self.provinceStates.get(provinceId)
        const party = state ? self.parties.get(state.controlling_party_id) : null

        // Update the target sidebar
        self.updateTargetSidebar(provinceId)

        let tooltipContent = `<strong style="font-size: 16px;">${nameThai}</strong><br><small style="color: #a5b4fc;">${nameEnglish}</small>`
        if (state) {
          const shieldPct = Math.round((state.shield_current / state.shield_max) * 100)
          tooltipContent += `<br><br><span style="color: #60a5fa;">🛡️ Shield:</span> ${state.shield_current.toLocaleString()} / ${state.shield_max.toLocaleString()} (${shieldPct}%)`
        }
        if (party) {
          tooltipContent += `<br><span style="color: #60a5fa;">👑 Controlled by:</span> <span style="color: ${party.official_color};">${party.name_thai}</span>`
        } else {
          tooltipContent += `<br><em style="color: #94a3b8;">⚪ Neutral territory</em>`
        }

        tooltip.innerHTML = tooltipContent
        tooltip.style.display = 'block'
      })
      .on('mousemove', function(event) {
        tooltip.style.left = `${event.clientX + 15}px`
        tooltip.style.top = `${event.clientY + 15}px`
      })
      .on('mouseout', function() {
        tooltip.style.display = 'none'
      })
  }

  // Add province name labels to the map
  addProvinceLabels() {
    const self = this

    // Create group for labels
    const labelsGroup = this.svg.select('#thailand-provinces')
      .append('g')
      .attr('id', 'province-labels')

    // Add text labels for each province
    labelsGroup.selectAll('text')
      .data(this.geoData.features)
      .enter()
      .append('text')
      .attr('class', 'province-label')
      .attr('x', d => this.path.centroid(d)[0])
      .attr('y', d => this.path.centroid(d)[1])
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('data-id', d => d.properties.id)
      .style('font-size', '8px')
      .style('font-family', 'Sarabun, sans-serif')
      .style('fill', '#ffffff')
      .style('text-shadow', '0 0 3px #000, 0 0 5px #000, 1px 1px 2px #000')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('opacity', 0.9)
      .text(d => d.properties.name_thai)

    // Add styles for labels
    this.svg.select('defs style').text(
      this.svg.select('defs style').text() + `
      .province-label {
        transition: opacity 0.2s ease;
      }
    `)
  }

  // Update label size based on zoom level
  updateLabelsVisibility(scale) {
    const labels = this.svg.selectAll('.province-label')

    // Use INVERSE scaling to keep font size constant on screen
    // SVG transform already scales everything, so we counteract it
    // Base size 8px on screen, divided by scale to appear constant
    const baseFontSize = 8
    const fontSize = baseFontSize / scale

    labels
      .style('opacity', scale >= 1 ? 1 : 0.7)
      .style('font-size', `${fontSize}px`)
  }

  // Zoom and pan functionality
  enableZoom() {
    const self = this

    const zoom = d3.zoom()
      .scaleExtent([0.8, 8])
      .filter((event) => {
        // Disable zoom on double-click to allow rapid clicking
        if (event.type === 'dblclick') return false
        // Allow wheel zoom and drag pan
        return event.type === 'wheel' || event.type === 'mousedown' || event.type === 'touchstart'
      })
      .on('zoom', (event) => {
        // Transform both provinces and labels together
        this.svg.select('#thailand-provinces')
          .attr('transform', event.transform)

        // Update label visibility based on zoom
        self.updateLabelsVisibility(event.transform.k)
      })

    this.svg.call(zoom)

    // Disable double-click zoom explicitly
    this.svg.on('dblclick.zoom', null)

    // Store zoom behavior for later use
    this.zoom = zoom
  }

  // Reset zoom
  resetZoom() {
    this.svg.transition()
      .duration(500)
      .call(d3.zoom().transform, d3.zoomIdentity)
  }

  destroy() {
    // Clear timers
    if (this.overlayHideTimer) {
      clearTimeout(this.overlayHideTimer)
    }

    // Stop ambient missiles
    this.stopAmbientMissiles()

    const tooltip = document.getElementById('province-tooltip')
    if (tooltip) {
      tooltip.remove()
    }
    this.container.innerHTML = ''
    this.parties.clear()
    this.provinceStates.clear()
    this.session = null
    this.svg = null
    this.geoData = null
    this.hpShieldOverlay = null
  }
}
