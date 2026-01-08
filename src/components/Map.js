import { supabase } from '../lib/supabase.js'

export class ThailandMap {
  constructor(container, soundToggle = null) {
    this.container = container
    this.parties = new Map()
    this.provinceStates = new Map()
    this.lastClickTime = 0
    this.session = null
    this.CLICK_COOLDOWN = 100
    this.soundToggle = soundToggle
  }

  async init(session) {
    this.session = session
    await this.loadMap()
    await this.loadData()
    this.updateAllProvinces()
    this.setupClickHandlers()
    this.setupHoverHandlers()
  }

  async loadMap() {
    const response = await fetch('/thailand-map.svg')
    if (!response.ok) {
      throw new Error('Failed to load Thailand map SVG')
    }
    const svgContent = await response.text()
    this.container.innerHTML = svgContent
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

  updateProvinceColor(provinceId, partyColor) {
    const provinceElement = this.container.querySelector(`[data-id="${provinceId}"]`)
    if (provinceElement) {
      provinceElement.style.fill = partyColor
    }
  }

  updateAllProvinces() {
    for (const [provinceId, state] of this.provinceStates) {
      const party = this.parties.get(state.controlling_party_id)
      if (party) {
        this.updateProvinceColor(provinceId, party.official_color)
      }
    }
  }

  setupClickHandlers() {
    const provinces = this.container.querySelectorAll('[data-id]')
    provinces.forEach(province => {
      province.style.cursor = 'pointer'
      province.addEventListener('click', (event) => {
        const provinceId = parseInt(event.currentTarget.getAttribute('data-id'))
        this.handleClick(provinceId)
      })
    })
  }

  async handleClick(provinceId) {
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
      this.showClickFeedback(provinceId, data)

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
        // Silently handle playback errors (e.g., missing file, user interaction required)
      })
    } catch (error) {
      // Silently handle audio creation errors
    }
  }

  showClickFeedback(provinceId, result) {
    this.playClickSound()

    const provinceElement = this.container.querySelector(`[data-id="${provinceId}"]`)
    if (!provinceElement) return

    const feedback = document.createElement('div')
    feedback.className = 'click-feedback'

    const rect = provinceElement.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()

    feedback.style.position = 'absolute'
    feedback.style.left = `${rect.left - containerRect.left + rect.width / 2}px`
    feedback.style.top = `${rect.top - containerRect.top + rect.height / 2}px`
    feedback.style.transform = 'translate(-50%, -50%)'
    feedback.style.pointerEvents = 'none'
    feedback.style.fontWeight = 'bold'
    feedback.style.fontSize = '24px'
    feedback.style.zIndex = '1000'
    feedback.style.animation = 'feedbackFloat 1s ease-out forwards'

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
        feedback.style.textShadow = '0 0 10px #f59e0b'
        this.playCaptureAnimation(provinceElement)
        break
      default:
        feedback.textContent = '!'
        feedback.style.color = '#6b7280'
    }

    if (!this.container.style.position || this.container.style.position === 'static') {
      this.container.style.position = 'relative'
    }

    this.container.appendChild(feedback)

    setTimeout(() => {
      feedback.remove()
    }, 1000)
  }

  playCaptureAnimation(provinceElement) {
    provinceElement.style.animation = 'captureFlash 0.5s ease-in-out'
    setTimeout(() => {
      provinceElement.style.animation = ''
    }, 500)
  }

  updateTargetSidebar(provinceId) {
    const state = this.provinceStates.get(provinceId)
    const provinceEl = this.container.querySelector(`[data-id="${provinceId}"]`)

    // Get province names from SVG attributes
    const nameThai = provinceEl?.getAttribute('data-name-thai') || ''
    const nameEnglish = provinceEl?.getAttribute('data-name-english') || ''

    // Update province name
    const targetName = document.getElementById('target-province-name')
    const targetThai = document.getElementById('target-province-thai')
    if (targetName) targetName.textContent = nameEnglish || `Province ${provinceId}`
    if (targetThai) targetThai.textContent = nameThai

    // Update shield bar
    if (state) {
      const shieldPct = Math.round((state.shield_current / state.shield_max) * 100)
      const shieldFill = document.getElementById('target-shield-fill')
      const shieldValue = document.getElementById('target-shield-value')
      if (shieldFill) shieldFill.style.width = `${shieldPct}%`
      if (shieldValue) shieldValue.textContent = `${shieldPct}%`

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
    }
  }

  setupHoverHandlers() {
    const provinces = this.container.querySelectorAll('[data-id]')

    let tooltip = document.getElementById('province-tooltip')
    if (!tooltip) {
      tooltip = document.createElement('div')
      tooltip.id = 'province-tooltip'
      tooltip.style.position = 'fixed'
      tooltip.style.display = 'none'
      tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.85)'
      tooltip.style.color = 'white'
      tooltip.style.padding = '8px 12px'
      tooltip.style.borderRadius = '6px'
      tooltip.style.fontSize = '14px'
      tooltip.style.pointerEvents = 'none'
      tooltip.style.zIndex = '10000'
      tooltip.style.maxWidth = '250px'
      document.body.appendChild(tooltip)
    }

    provinces.forEach(province => {
      province.addEventListener('mouseover', (event) => {
        const provinceId = parseInt(event.currentTarget.getAttribute('data-id'))
        const nameThai = event.currentTarget.getAttribute('data-name-thai')
        const nameEnglish = event.currentTarget.getAttribute('data-name-english')
        const state = this.provinceStates.get(provinceId)
        const party = state ? this.parties.get(state.controlling_party_id) : null

        // Update the target sidebar
        this.updateTargetSidebar(provinceId)

        let tooltipContent = `<strong>${nameThai}</strong><br><small>${nameEnglish}</small>`
        if (state) {
          const shieldPct = Math.round((state.shield_current / state.shield_max) * 100)
          tooltipContent += `<br>Shield: ${state.shield_current.toLocaleString()} / ${state.shield_max.toLocaleString()} (${shieldPct}%)`
        }
        if (party) {
          tooltipContent += `<br>Controlled by: ${party.name_thai}`
        } else {
          tooltipContent += `<br><em>Neutral territory</em>`
        }

        tooltip.innerHTML = tooltipContent
        tooltip.style.display = 'block'
      })

      province.addEventListener('mousemove', (event) => {
        tooltip.style.left = `${event.clientX + 15}px`
        tooltip.style.top = `${event.clientY + 15}px`
      })

      province.addEventListener('mouseout', () => {
        tooltip.style.display = 'none'
      })
    })
  }

  destroy() {
    const tooltip = document.getElementById('province-tooltip')
    if (tooltip) {
      tooltip.remove()
    }
    this.container.innerHTML = ''
    this.parties.clear()
    this.provinceStates.clear()
    this.session = null
  }
}
