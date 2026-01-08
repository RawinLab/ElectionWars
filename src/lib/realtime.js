import { supabase } from './supabase.js'

/**
 * RealtimeManager handles Supabase real-time subscriptions
 * for province_state and game_state changes with auto-reconnect
 */
export class RealtimeManager {
  constructor() {
    this.channels = []
    this.presenceChannel = null
    this.onlineUsers = new Map()
    this.totalPlayers = 0
    this.callbacks = {
      province: [],
      gameState: [],
      connection: [],
      presence: [],
      missiles: []
    }
    this.status = 'disconnected'
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.baseReconnectDelay = 1000
    this.reconnectTimeout = null

    // Missiles tracking
    this.missileEvents = [] // Array of { timestamp, count }
    this.missilesPerMinute = 0
    this.missileTrackingInterval = null
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

  /**
   * Subscribe to presence channel for tracking online users
   * @param {Object} playerInfo - Player info { id, nickname, party_id }
   */
  async subscribeToPresence(playerInfo) {
    if (this.presenceChannel) {
      return // Already subscribed
    }

    // Fetch total players count initially
    await this.fetchTotalPlayers()

    this.presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: playerInfo.id
        }
      }
    })

    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = this.presenceChannel.presenceState()
        this.onlineUsers.clear()
        Object.keys(state).forEach(key => {
          const presences = state[key]
          if (presences && presences.length > 0) {
            this.onlineUsers.set(key, presences[0])
          }
        })
        this._notifyPresenceChange()
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (newPresences && newPresences.length > 0) {
          this.onlineUsers.set(key, newPresences[0])
        }
        this._notifyPresenceChange()
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        this.onlineUsers.delete(key)
        this._notifyPresenceChange()
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          await this.presenceChannel.track({
            id: playerInfo.id,
            nickname: playerInfo.nickname,
            party_id: playerInfo.party_id,
            online_at: new Date().toISOString()
          })
        }
      })
  }

  /**
   * Fetch total players count from database
   */
  async fetchTotalPlayers() {
    try {
      const { count, error } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })

      if (!error && count !== null) {
        this.totalPlayers = count
        this._notifyPresenceChange()
      }
    } catch (err) {
      console.error('Failed to fetch total players:', err)
    }
  }

  /**
   * Leave presence channel
   */
  async leavePresence() {
    if (this.presenceChannel) {
      await this.presenceChannel.untrack()
      supabase.removeChannel(this.presenceChannel)
      this.presenceChannel = null
      this.onlineUsers.clear()
    }
  }

  /**
   * Get current online user count
   * @returns {number}
   */
  getOnlineCount() {
    return this.onlineUsers.size
  }

  /**
   * Get total players count
   * @returns {number}
   */
  getTotalPlayers() {
    return this.totalPlayers
  }

  /**
   * Notify presence change listeners
   * @private
   */
  _notifyPresenceChange() {
    const data = {
      online: this.onlineUsers.size,
      total: this.totalPlayers
    }
    this.callbacks.presence.forEach(cb => cb(data))
  }

  /**
   * Add a presence change listener
   * @param {Function} callback - Callback to invoke on presence changes
   * @returns {Function} Unsubscribe function
   */
  onPresenceChange(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }

    this.callbacks.presence.push(callback)

    // Immediately call with current data
    callback({
      online: this.onlineUsers.size,
      total: this.totalPlayers
    })

    return () => {
      const index = this.callbacks.presence.indexOf(callback)
      if (index > -1) {
        this.callbacks.presence.splice(index, 1)
      }
    }
  }

  /**
   * Start tracking missiles per minute
   */
  startMissileTracking() {
    // Listen to province changes for click deltas
    this.onProvinceChange((payload) => {
      if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
        const clickDelta = (payload.new.clicks || 0) - (payload.old.clicks || 0)
        if (clickDelta > 0) {
          this.missileEvents.push({
            timestamp: Date.now(),
            count: clickDelta
          })
        }
      }
    })

    // Calculate missiles per minute every 2 seconds
    this.missileTrackingInterval = setInterval(() => {
      this._calculateMissilesPerMinute()
    }, 2000)

    // Initial calculation
    this._calculateMissilesPerMinute()
  }

  /**
   * Calculate missiles per minute from recent events
   * @private
   */
  _calculateMissilesPerMinute() {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // Filter events from last 60 seconds
    this.missileEvents = this.missileEvents.filter(e => e.timestamp > oneMinuteAgo)

    // Sum up all missiles in the last minute
    const totalMissiles = this.missileEvents.reduce((sum, e) => sum + e.count, 0)

    // Calculate actual rate based on time window
    const oldestEvent = this.missileEvents[0]
    let rate = 0

    if (this.missileEvents.length > 0 && oldestEvent) {
      const timeSpan = (now - oldestEvent.timestamp) / 1000 // in seconds
      if (timeSpan > 0) {
        // Calculate per minute rate
        rate = Math.round((totalMissiles / timeSpan) * 60)
      }
    }

    if (this.missilesPerMinute !== rate) {
      this.missilesPerMinute = rate
      this._notifyMissilesChange()
    }
  }

  /**
   * Stop missile tracking
   */
  stopMissileTracking() {
    if (this.missileTrackingInterval) {
      clearInterval(this.missileTrackingInterval)
      this.missileTrackingInterval = null
    }
    this.missileEvents = []
    this.missilesPerMinute = 0
  }

  /**
   * Get current missiles per minute
   * @returns {number}
   */
  getMissilesPerMinute() {
    return this.missilesPerMinute
  }

  /**
   * Notify missiles change listeners
   * @private
   */
  _notifyMissilesChange() {
    this.callbacks.missiles.forEach(cb => cb(this.missilesPerMinute))
  }

  /**
   * Add a missiles change listener
   * @param {Function} callback - Callback to invoke on missiles changes
   * @returns {Function} Unsubscribe function
   */
  onMissilesChange(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }

    this.callbacks.missiles.push(callback)

    // Immediately call with current data
    callback(this.missilesPerMinute)

    return () => {
      const index = this.callbacks.missiles.indexOf(callback)
      if (index > -1) {
        this.callbacks.missiles.splice(index, 1)
      }
    }
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager()
