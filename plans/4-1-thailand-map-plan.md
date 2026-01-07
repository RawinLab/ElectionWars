# Plan: Thailand Map Implementation (Module 4.1)

## Module Information
- **Module:** 4.1
- **Name:** Thailand SVG Map
- **Dependencies:** 1.1 (Project Setup), 2.3 (Seed Data)
- **Priority:** HIGH
- **Estimated:** 2-3 days

---

## Features

### 4.1.1 SVG Map Rendering
Interactive Thailand map with 77 provinces

### 4.1.2 Province Click Handling
Click to attack/defend with shield system

### 4.1.3 Province Coloring
Color based on controlling party

### 4.1.4 Province Tooltip
Show province info on hover

### 4.1.5 Click Feedback
Visual animation + floating +1 + sound

---

## Technical Design

### Map Data Source
- **TopoJSON:** https://github.com/cvibhagool/thailand-map
- **Province Names:** Match with provinces table in database
- Convert TopoJSON → SVG with province IDs

### SVG Structure
```html
<svg id="thailand-map" viewBox="0 0 800 1200" preserveAspectRatio="xMidYMid meet">
  <g id="provinces">
    <path id="province-1"
          data-province-id="1"
          data-name-th="กรุงเทพมหานคร"
          data-name-en="Bangkok"
          class="province neutral"
          d="M..."></path>
    <path id="province-2"
          data-province-id="2"
          data-name-th="สมุทรปราการ"
          data-name-en="Samut Prakan"
          class="province neutral"
          d="M..."></path>
    <!-- ... 77 provinces -->
  </g>
</svg>
```

### CSS Styling
```css
/* Base province styling */
.province {
  fill: #E0E0E0;  /* Neutral gray */
  stroke: #FFFFFF;
  stroke-width: 1;
  cursor: pointer;
  transition: fill 0.3s ease, transform 0.2s ease;
}

.province:hover {
  filter: brightness(1.1);
}

/* Party colors - dynamically set via CSS custom properties */
.province.party-1 { fill: #E31838; }  /* Pheu Thai - Red */
.province.party-2 { fill: #FF7A00; }  /* People's Party - Orange */
.province.party-3 { fill: #004E89; }  /* Bhumjaithai - Blue */
.province.party-4 { fill: #87CEEB; }  /* Democrat - Light Blue */
.province.party-5 { fill: #1B4D3E; }  /* Palang Pracharath - Green */
.province.party-6 { fill: #663399; }  /* UTN - Purple */
/* ... etc for all parties */

/* Click animation */
.province.clicked {
  animation: pulse 0.2s ease-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Floating +1 animation */
.click-number {
  position: absolute;
  font-size: 16px;
  font-weight: bold;
  color: var(--party-color, #333);
  pointer-events: none;
  animation: float-up 0.5s ease-out forwards;
}

@keyframes float-up {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-30px); }
}
```

### Map Component
```javascript
// src/components/Map.js
import { supabase } from '../lib/supabase.js';

export class ThailandMap {
  constructor(containerId, session) {
    this.container = document.getElementById(containerId);
    this.session = session;
    this.provinceStates = new Map();
    this.parties = new Map();
    this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    this.clickSound = new Audio('/sounds/click.mp3');
    this.clickSound.volume = 0.3;
  }

  async init() {
    // Load parties for color mapping
    const { data: parties } = await supabase.from('parties').select('*');
    parties.forEach(p => this.parties.set(p.id, p));

    // Load initial province states
    const { data: states } = await supabase.from('province_state').select('*');
    states.forEach(s => this.provinceStates.set(s.province_id, s));

    // Load SVG map
    await this.loadMap();

    // Apply initial colors
    this.updateAllColors();

    // Set up click handlers
    this.setupClickHandlers();

    // Subscribe to realtime updates
    this.subscribeToUpdates();
  }

  async loadMap() {
    const response = await fetch('/thailand-map.svg');
    const svgText = await response.text();
    this.container.innerHTML = svgText;
    this.svg = this.container.querySelector('svg');
  }

  updateAllColors() {
    this.provinceStates.forEach((state, provinceId) => {
      this.updateProvinceColor(provinceId, state.controlling_party_id);
    });
  }

  updateProvinceColor(provinceId, partyId) {
    const path = this.svg.querySelector(`[data-province-id="${provinceId}"]`);
    if (!path) return;

    // Remove all party classes
    path.className.baseVal = 'province';

    if (partyId) {
      path.classList.add(`party-${partyId}`);
    } else {
      path.classList.add('neutral');
    }
  }

  setupClickHandlers() {
    this.svg.querySelectorAll('.province').forEach(path => {
      path.addEventListener('click', (e) => this.handleClick(e));
    });
  }

  async handleClick(event) {
    const provinceId = parseInt(event.target.dataset.provinceId);
    const playerId = this.session.player.id;
    const partyId = this.session.player.party_id;

    // Optimistic UI - show click animation immediately
    this.showClickFeedback(event, partyId);

    // Call click_province RPC
    const { data, error } = await supabase.rpc('click_province', {
      p_player_id: playerId,
      p_province_id: provinceId,
      p_party_id: partyId
    });

    if (error) {
      console.error('Click error:', error);
      return;
    }

    if (!data.success) {
      // Rate limited - no feedback needed
      return;
    }

    // Update local state
    this.provinceStates.set(provinceId, {
      ...this.provinceStates.get(provinceId),
      shield_current: data.shield,
      controlling_party_id: data.controlling_party
    });

    // Handle capture event
    if (data.action === 'capture') {
      this.showCaptureNotification(provinceId, data.controlling_party);
    }
  }

  showClickFeedback(event, partyId) {
    const path = event.target;

    // Visual pulse
    path.classList.add('clicked');
    setTimeout(() => path.classList.remove('clicked'), 200);

    // Floating +1
    const party = this.parties.get(partyId);
    const num = document.createElement('div');
    num.className = 'click-number';
    num.textContent = '+1';
    num.style.setProperty('--party-color', party.official_color);
    num.style.left = `${event.clientX}px`;
    num.style.top = `${event.clientY}px`;
    document.body.appendChild(num);
    setTimeout(() => num.remove(), 500);

    // Sound effect
    if (this.soundEnabled) {
      this.clickSound.currentTime = 0;
      this.clickSound.play().catch(() => {});
    }
  }

  showCaptureNotification(provinceId, partyId) {
    const province = this.svg.querySelector(`[data-province-id="${provinceId}"]`);
    const party = this.parties.get(partyId);
    const provinceName = province.dataset.nameTh;

    // Emit event for toast notification
    window.dispatchEvent(new CustomEvent('province-captured', {
      detail: { provinceId, provinceName, party }
    }));
  }

  subscribeToUpdates() {
    supabase
      .channel('province_state_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'province_state' },
        (payload) => {
          const state = payload.new;
          this.provinceStates.set(state.province_id, state);
          this.updateProvinceColor(state.province_id, state.controlling_party_id);
        }
      )
      .subscribe();
  }
}
```

### Tooltip Component
```javascript
// src/components/Tooltip.js
export class ProvinceTooltip {
  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'province-tooltip hidden';
    document.body.appendChild(this.element);
  }

  show(event, province, state, party, playerPartyId) {
    const shieldPercent = Math.round((state.shield_current / state.shield_max) * 100);
    const isOwn = party?.id === playerPartyId;
    const attackCount = state.attack_counts[playerPartyId] || 0;

    this.element.innerHTML = `
      <h4>${province.name_th}</h4>
      <p class="province-name-en">${province.name_en}</p>
      <div class="party-info">
        ${party ? `
          <span class="party-badge" style="background: ${party.official_color}"></span>
          <span>${party.name_thai}</span>
        ` : '<span class="neutral">Neutral</span>'}
      </div>
      <div class="shield-bar">
        <div class="shield-fill" style="width: ${shieldPercent}%"></div>
        <span>${state.shield_current.toLocaleString()} / ${state.shield_max.toLocaleString()}</span>
      </div>
      ${!isOwn && attackCount > 0 ? `
        <div class="attack-info">Your attacks: ${attackCount.toLocaleString()}</div>
      ` : ''}
    `;

    this.element.style.left = `${event.clientX + 10}px`;
    this.element.style.top = `${event.clientY + 10}px`;
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
```

---

## Implementation Steps

### Step 1: Download & Process Map Data
```bash
# Download TopoJSON
curl -o data/thailand.topojson https://raw.githubusercontent.com/cvibhagool/thailand-map/master/thailand-provinces.topojson

# Create conversion script
npm install topojson-client d3-geo
node scripts/convert-map.js
```

### Step 2: Create Map Component
1. Create `src/components/Map.js`
2. Implement ThailandMap class
3. Add click handling
4. Add realtime subscription

### Step 3: Create Tooltip Component
1. Create `src/components/Tooltip.js`
2. Add hover event handlers
3. Style tooltip with shield bar

### Step 4: Add Click Feedback
1. Add CSS animations (pulse, float-up)
2. Add click sound audio file
3. Implement optimistic UI updates

### Step 5: Integrate with Main App
1. Initialize map on game screen
2. Connect to session data
3. Test click mechanics

---

## Test Cases

### Unit Tests
- [ ] Map SVG loads correctly
- [ ] Province colors update correctly
- [ ] Click feedback animation triggers
- [ ] Tooltip shows correct data

### Integration Tests
- [ ] click_province RPC called on click
- [ ] Realtime updates received
- [ ] Province color changes on capture
- [ ] Shield values display correctly

### E2E Tests
- [ ] Click province → see animation
- [ ] Click province → shield changes
- [ ] Multiple players → map syncs in realtime
- [ ] Capture province → notification shown

---

## Acceptance Criteria
- [ ] All 77 provinces visible and clickable
- [ ] Colors update in realtime
- [ ] Click feedback (animation + sound + floating number)
- [ ] Tooltip shows shield bar and party info
- [ ] Map is responsive on mobile
