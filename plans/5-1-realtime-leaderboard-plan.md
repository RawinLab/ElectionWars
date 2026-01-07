# Plan: Real-time & Leaderboard (Module 5.1)

## Module Information
- **Module:** 5.1
- **Name:** Real-time Sync & Leaderboard
- **Dependencies:** 2.1-2.3 (Database), 4.1 (Map)
- **Priority:** HIGH
- **Estimated:** 1-2 days

---

## Features

### 5.1.1 Supabase Realtime Integration
Subscribe to province_state and game_state changes

### 5.1.2 Party Leaderboard
Show party rankings by provinces controlled

### 5.1.3 Game Timer
Countdown to February 8, 2026 23:59 ICT

### 5.1.4 Global Stats
Total clicks, total players

### 5.1.5 Connection Status
Show connection state and handle reconnection

---

## Technical Design

### Realtime Subscription Manager
```javascript
// src/lib/realtime.js
import { supabase } from './supabase.js';

export class RealtimeManager {
  constructor() {
    this.channels = [];
    this.callbacks = {
      provinceUpdate: [],
      gameStateUpdate: [],
      connectionChange: []
    };
    this.isConnected = false;
  }

  async subscribe() {
    // Province state changes
    const provinceChannel = supabase
      .channel('province_updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'province_state' },
        (payload) => this.emit('provinceUpdate', payload.new)
      )
      .subscribe((status) => {
        this.handleConnectionStatus(status);
      });

    // Game state changes
    const gameChannel = supabase
      .channel('game_updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_state' },
        (payload) => this.emit('gameStateUpdate', payload.new)
      )
      .subscribe();

    this.channels = [provinceChannel, gameChannel];
  }

  handleConnectionStatus(status) {
    const wasConnected = this.isConnected;
    this.isConnected = status === 'SUBSCRIBED';

    if (wasConnected !== this.isConnected) {
      this.emit('connectionChange', this.isConnected);
    }

    // Auto-reconnect
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      setTimeout(() => this.reconnect(), 3000);
    }
  }

  async reconnect() {
    await this.unsubscribe();
    await this.subscribe();
  }

  async unsubscribe() {
    for (const channel of this.channels) {
      await supabase.removeChannel(channel);
    }
    this.channels = [];
  }

  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(data));
    }
  }
}
```

### Leaderboard Component
```javascript
// src/components/Leaderboard.js
import { supabase } from '../lib/supabase.js';

export class Leaderboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = [];
  }

  async init() {
    await this.fetch();
    this.render();
  }

  async fetch() {
    const { data, error } = await supabase.rpc('get_leaderboard');
    if (error) {
      console.error('Leaderboard error:', error);
      return;
    }
    this.data = data;
  }

  render() {
    this.container.innerHTML = `
      <div class="leaderboard">
        <h3>Party Rankings</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Party</th>
              <th>Provinces</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            ${this.data.map(party => `
              <tr class="party-row" style="--party-color: ${party.official_color}">
                <td>${party.rank}</td>
                <td>
                  <span class="party-badge" style="background: ${party.official_color}"></span>
                  ${party.party_name}
                </td>
                <td>${party.provinces_controlled}</td>
                <td>${this.formatNumber(party.total_clicks)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  async update() {
    await this.fetch();
    this.render();
  }
}
```

### Game Timer Component
```javascript
// src/components/Timer.js
export class GameTimer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.endTime = new Date('2026-02-08T23:59:59+07:00').getTime();
    this.interval = null;
  }

  start() {
    this.update();
    this.interval = setInterval(() => this.update(), 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  update() {
    const now = Date.now();
    const diff = this.endTime - now;

    if (diff <= 0) {
      this.container.innerHTML = `
        <div class="timer ended">
          <span>Game Ended!</span>
        </div>
      `;
      this.stop();
      window.dispatchEvent(new CustomEvent('game-ended'));
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.container.innerHTML = `
      <div class="timer">
        <span class="timer-label">Game ends in:</span>
        <span class="timer-value">
          ${days}d ${hours}h ${minutes}m ${seconds}s
        </span>
      </div>
    `;
  }
}
```

### Global Stats Component
```javascript
// src/components/Stats.js
import { supabase } from '../lib/supabase.js';

export class GlobalStats {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = { total_clicks: 0, total_players: 0 };
  }

  async init() {
    await this.fetch();
    this.render();
  }

  async fetch() {
    const { data, error } = await supabase
      .from('game_state')
      .select('total_clicks, total_players')
      .eq('id', 1)
      .single();

    if (!error) {
      this.data = data;
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="global-stats">
        <div class="stat">
          <span class="stat-value">${this.formatNumber(this.data.total_clicks)}</span>
          <span class="stat-label">Total Clicks</span>
        </div>
        <div class="stat">
          <span class="stat-value">${this.formatNumber(this.data.total_players)}</span>
          <span class="stat-label">Players</span>
        </div>
      </div>
    `;
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  update(newData) {
    this.data = { ...this.data, ...newData };
    this.render();
  }
}
```

### Connection Status Component
```javascript
// src/components/ConnectionStatus.js
export class ConnectionStatus {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.isConnected = false;
  }

  update(connected) {
    this.isConnected = connected;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="connection-status ${this.isConnected ? 'connected' : 'disconnected'}">
        <span class="status-dot"></span>
        <span class="status-text">
          ${this.isConnected ? 'Connected' : 'Reconnecting...'}
        </span>
      </div>
    `;
  }
}
```

---

## CSS Styling
```css
/* Leaderboard */
.leaderboard {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.leaderboard table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard th, .leaderboard td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.party-badge {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 8px;
}

/* Timer */
.timer {
  text-align: center;
  padding: 12px;
  background: #333;
  color: #fff;
  border-radius: 8px;
}

.timer-label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.timer-value {
  font-size: 24px;
  font-weight: bold;
  font-family: monospace;
}

.timer.ended {
  background: #E31838;
}

/* Connection Status */
.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.connected .status-dot {
  background: #4CAF50;
}

.disconnected .status-dot {
  background: #F44336;
  animation: blink 1s infinite;
}

@keyframes blink {
  50% { opacity: 0.5; }
}

/* Global Stats */
.global-stats {
  display: flex;
  gap: 24px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  color: #666;
}
```

---

## Implementation Steps

### Step 1: Create Realtime Manager
1. Create `src/lib/realtime.js`
2. Implement subscription logic
3. Add reconnection handling

### Step 2: Create Leaderboard
1. Create `src/components/Leaderboard.js`
2. Fetch from get_leaderboard RPC
3. Style with party colors

### Step 3: Create Timer
1. Create `src/components/Timer.js`
2. Countdown to game end
3. Emit event when game ends

### Step 4: Create Stats & Connection
1. Create GlobalStats component
2. Create ConnectionStatus component
3. Wire up to realtime events

### Step 5: Integrate Components
1. Initialize all components in main.js
2. Connect realtime events to component updates
3. Test with multiple browser tabs

---

## Test Cases

### Unit Tests
- [ ] Timer countdown works correctly
- [ ] Number formatting works (K, M)
- [ ] Connection status updates correctly

### Integration Tests
- [ ] Realtime subscription connects
- [ ] Province updates trigger callbacks
- [ ] Leaderboard updates on province change
- [ ] Reconnection works after disconnect

### E2E Tests
- [ ] Open two browsers → changes sync
- [ ] Disconnect WiFi → reconnects automatically
- [ ] Game end → shows ended message

---

## Acceptance Criteria
- [ ] Realtime subscriptions working
- [ ] Leaderboard shows correct rankings
- [ ] Timer counts down accurately
- [ ] Global stats update in realtime
- [ ] Connection status indicator works
- [ ] Auto-reconnection on disconnect
