import { supabase } from './supabase.js'

/**
 * RealtimeManager handles Supabase real-time subscriptions
 * for province_state and game_state changes with auto-reconnect
 */
export class RealtimeManager {
  constructor() {
    this.channels = []
    this.callbacks = {
      province: [],
      gameState: [],
      connection: []
    }
    this.status = 'disconnected'
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.baseReconnectDelay = 1000
    this.reconnectTimeout = null
  }

  /**
   * Subscribe to all channels (province_state, game_state)
   */
  subscribe() {
    this.subscribeToProvinces()
    this.subscribeToGameState()
  }

  /**
   * Subscribe to province_state table changes
   * @param {Function} callback - Optional callback for province changes
   * @returns {Object} The channel subscription
   */
  subscribeToProvinces(callback) {
    if (callback && typeof callback === 'function') {
      this.callbacks.province.push(callback)
    }

    const channel = supabase
      .channel('province-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'province_state'
      }, payload => {
        this.callbacks.province.forEach(cb => cb(payload))
      })
      .subscribe((status) => {
        this._handleSubscriptionStatus(status, 'province-changes')
      })

    this.channels.push(channel)
    return channel
  }

  /**
   * Subscribe to game_state table changes
   * @param {Function} callback - Optional callback for game state changes
   * @returns {Object} The channel subscription
   */
  subscribeToGameState(callback) {
    if (callback && typeof callback === 'function') {
      this.callbacks.gameState.push(callback)
    }

    const channel = supabase
      .channel('game-state-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_state'
      }, payload => {
        this.callbacks.gameState.forEach(cb => cb(payload))
      })
      .subscribe((status) => {
        this._handleSubscriptionStatus(status, 'game-state-changes')
      })

    this.channels.push(channel)
    return channel
  }

  /**
   * Handle subscription status changes
   * @private
   * @param {string} status - The subscription status
   * @param {string} channelName - The channel name for logging
   */
  _handleSubscriptionStatus(status, channelName) {
    if (status === 'SUBSCRIBED') {
      this.reconnectAttempts = 0
      this._setStatus('connected')
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      this._setStatus('disconnected')
      this._attemptReconnect(channelName)
    } else if (status === 'TIMED_OUT') {
      this._setStatus('reconnecting')
      this._attemptReconnect(channelName)
    }
  }

  /**
   * Set connection status and notify listeners
   * @private
   * @param {string} newStatus - The new connection status
   */
  _setStatus(newStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus
      this.callbacks.connection.forEach(cb => cb(newStatus))
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   * @private
   * @param {string} channelName - The channel that needs reconnection
   */
  _attemptReconnect(channelName) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${channelName}`)
      this._setStatus('disconnected')
      return
    }

    this._setStatus('reconnecting')

    const delay = this._calculateBackoff()
    this.reconnectAttempts++

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.reconnectTimeout = setTimeout(() => {
      this.unsubscribe()
      this.subscribe()
    }, delay)
  }

  /**
   * Calculate exponential backoff delay with jitter
   * @private
   * @returns {number} Delay in milliseconds
   */
  _calculateBackoff() {
    const exponentialDelay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts)
    const maxDelay = 30000 // Cap at 30 seconds
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    return Math.min(exponentialDelay, maxDelay) + jitter
  }

  /**
   * Unsubscribe from all channels and clean up
   */
  unsubscribe() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    this.channels.forEach(channel => {
      supabase.removeChannel(channel)
    })

    this.channels = []
    this._setStatus('disconnected')
  }

  /**
   * Get current connection status
   * @returns {string} 'connected', 'disconnected', or 'reconnecting'
   */
  getConnectionStatus() {
    return this.status
  }

  /**
   * Register a connection status change listener
   * @param {Function} callback - Callback to invoke on status change
   * @returns {Function} Unsubscribe function
   */
  onConnectionChange(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }

    this.callbacks.connection.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.connection.indexOf(callback)
      if (index > -1) {
        this.callbacks.connection.splice(index, 1)
      }
    }
  }

  /**
   * Add a province change listener
   * @param {Function} callback - Callback to invoke on province changes
   * @returns {Function} Unsubscribe function
   */
  onProvinceChange(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }

    this.callbacks.province.push(callback)

    return () => {
      const index = this.callbacks.province.indexOf(callback)
      if (index > -1) {
        this.callbacks.province.splice(index, 1)
      }
    }
  }

  /**
   * Add a game state change listener
   * @param {Function} callback - Callback to invoke on game state changes
   * @returns {Function} Unsubscribe function
   */
  onGameStateChange(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }

    this.callbacks.gameState.push(callback)

    return () => {
      const index = this.callbacks.gameState.indexOf(callback)
      if (index > -1) {
        this.callbacks.gameState.splice(index, 1)
      }
    }
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager()
