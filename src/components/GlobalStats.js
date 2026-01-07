/**
 * GlobalStats Component
 * Displays total clicks and players count with realtime updates
 */

import { supabase } from '../lib/supabase.js'

export class GlobalStats {
  constructor(container) {
    this.container = container
    this.realtimeManager = null
    this.currentData = {
      total_players: 0,
      total_clicks: 0,
      is_active: true
    }
  }

  async fetch() {
    const { data, error } = await supabase
      .from('game_state')
      .select('total_players, total_clicks, is_active')
      .single()

    if (error) {
      console.error('Failed to fetch game state:', error)
      return null
    }

    return data
  }

  render(data) {
    if (!this.container) return

    this.currentData = data || this.currentData

    const html = `
      <div class="global-stats">
        <div class="stat-card">
          <span class="stat-label">Total Players</span>
          <span class="stat-value" id="stat-players">${this.formatNumber(this.currentData.total_players)}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total Clicks</span>
          <span class="stat-value" id="stat-clicks">${this.formatNumber(this.currentData.total_clicks)}</span>
        </div>
      </div>
    `

    this.container.innerHTML = html
  }

  formatNumber(num) {
    if (num === null || num === undefined) return '0'

    const absNum = Math.abs(num)

    if (absNum >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }

    if (absNum >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }

    return num.toString()
  }

  animateCounter(element, newValue) {
    if (!element) return

    const startValue = parseInt(element.dataset.rawValue) || 0
    const duration = 500
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3)

      const currentValue = Math.round(startValue + (newValue - startValue) * easeProgress)
      element.textContent = this.formatNumber(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        element.dataset.rawValue = newValue
      }
    }

    requestAnimationFrame(animate)
  }

  setRealtimeManager(manager) {
    this.realtimeManager = manager

    if (this.realtimeManager && typeof this.realtimeManager.on === 'function') {
      this.realtimeManager.on('game_state', (data) => {
        this.handleGameStateUpdate(data)
      })
    }
  }

  handleGameStateUpdate(data) {
    if (!data) return

    const playersElement = this.container?.querySelector('#stat-players')
    const clicksElement = this.container?.querySelector('#stat-clicks')

    if (data.total_players !== undefined && playersElement) {
      this.animateCounter(playersElement, data.total_players)
      this.currentData.total_players = data.total_players
    }

    if (data.total_clicks !== undefined && clicksElement) {
      this.animateCounter(clicksElement, data.total_clicks)
      this.currentData.total_clicks = data.total_clicks
    }

    if (data.is_active !== undefined) {
      this.currentData.is_active = data.is_active
    }
  }
}

export default GlobalStats
