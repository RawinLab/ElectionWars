# Plan: UX Features - Notifications & Language (Module 6.1)

## Module Information
- **Module:** 6.1
- **Name:** UX Features (Notifications, Language, Sound)
- **Dependencies:** 4.1 (Map), 5.1 (Realtime)
- **Priority:** MEDIUM
- **Estimated:** 1-2 days

---

## Features

### 6.1.1 Toast Notifications
Show alerts for province flip, party win, shield warning

### 6.1.2 Language Support (TH/EN)
Bilingual UI with language toggle

### 6.1.3 Sound Settings
Toggle sound effects on/off

### 6.1.4 Settings Panel
User preferences (language, sound, etc.)

---

## Technical Design

### Toast Notification System
```javascript
// src/components/Toast.js
export class ToastManager {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  show(type, message, options = {}) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = this.getIcon(type);
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    // Auto dismiss
    const duration = options.duration || 3000;
    setTimeout(() => this.dismiss(toast), duration);

    return toast;
  }

  dismiss(toast) {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }

  getIcon(type) {
    switch (type) {
      case 'flip': return '🔄';
      case 'win': return '🎉';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '';
    }
  }

  // Convenience methods
  provinceFlip(provinceName, partyName) {
    this.show('flip', `${provinceName} ถูกยึดโดย ${partyName}!`);
  }

  partyWin(provinceName) {
    this.show('win', `พรรคของคุณยึด ${provinceName} สำเร็จ!`);
  }

  shieldWarning(provinceName, percent) {
    this.show('warning', `เตือน! ${provinceName} shield เหลือ ${percent}%`);
  }
}
```

### Toast CSS
```css
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: toast-enter 0.3s ease-out;
  max-width: 350px;
}

.toast-exit {
  animation: toast-exit 0.3s ease-in forwards;
}

@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-exit {
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

.toast-flip {
  border-left: 4px solid #2196F3;
}

.toast-win {
  border-left: 4px solid #4CAF50;
}

.toast-warning {
  border-left: 4px solid #FF9800;
}

.toast-icon {
  font-size: 20px;
}

.toast-message {
  flex: 1;
  font-size: 14px;
}

.toast-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.5;
}

.toast-close:hover {
  opacity: 1;
}
```

### Internationalization (i18n)
```javascript
// src/lib/i18n.js
const translations = {
  th: {
    // Party Selector
    'choose_party': 'เลือกพรรคของคุณ',
    'nickname': 'ชื่อเล่น',
    'join_game': 'เข้าร่วมเกม',

    // Game
    'provinces_controlled': 'จังหวัดที่ครอบครอง',
    'total_clicks': 'คลิกทั้งหมด',
    'game_ends_in': 'เกมจบใน',
    'game_ended': 'เกมจบแล้ว!',

    // Leaderboard
    'party_rankings': 'อันดับพรรค',
    'rank': 'อันดับ',
    'party': 'พรรค',
    'provinces': 'จังหวัด',
    'clicks': 'คลิก',

    // Notifications
    'province_captured': '{province} ถูกยึดโดย {party}!',
    'your_party_won': 'พรรคของคุณยึด {province} สำเร็จ!',
    'shield_warning': 'เตือน! {province} shield เหลือ {percent}%',

    // Settings
    'settings': 'ตั้งค่า',
    'language': 'ภาษา',
    'sound': 'เสียง',
    'on': 'เปิด',
    'off': 'ปิด',

    // Status
    'connected': 'เชื่อมต่อแล้ว',
    'reconnecting': 'กำลังเชื่อมต่อ...',
    'neutral': 'กลาง',

    // Province Tooltip
    'shield': 'โล่',
    'your_attacks': 'การโจมตีของคุณ'
  },
  en: {
    'choose_party': 'Choose Your Party',
    'nickname': 'Nickname',
    'join_game': 'Join Game',

    'provinces_controlled': 'Provinces Controlled',
    'total_clicks': 'Total Clicks',
    'game_ends_in': 'Game ends in',
    'game_ended': 'Game Ended!',

    'party_rankings': 'Party Rankings',
    'rank': 'Rank',
    'party': 'Party',
    'provinces': 'Provinces',
    'clicks': 'Clicks',

    'province_captured': '{province} captured by {party}!',
    'your_party_won': 'Your party captured {province}!',
    'shield_warning': 'Warning! {province} shield at {percent}%',

    'settings': 'Settings',
    'language': 'Language',
    'sound': 'Sound',
    'on': 'On',
    'off': 'Off',

    'connected': 'Connected',
    'reconnecting': 'Reconnecting...',
    'neutral': 'Neutral',

    'shield': 'Shield',
    'your_attacks': 'Your Attacks'
  }
};

class I18n {
  constructor() {
    this.locale = localStorage.getItem('locale') || this.detectLocale();
    this.translations = translations;
  }

  detectLocale() {
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'th' ? 'th' : 'en';
  }

  setLocale(locale) {
    this.locale = locale;
    localStorage.setItem('locale', locale);
    window.dispatchEvent(new CustomEvent('locale-change', { detail: locale }));
  }

  t(key, params = {}) {
    let text = this.translations[this.locale]?.[key] || this.translations['en'][key] || key;

    // Replace placeholders
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });

    return text;
  }

  get currentLocale() {
    return this.locale;
  }
}

export const i18n = new I18n();
```

### Settings Panel
```javascript
// src/components/Settings.js
import { i18n } from '../lib/i18n.js';

export class SettingsPanel {
  constructor() {
    this.isOpen = false;
    this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

    this.element = document.createElement('div');
    this.element.className = 'settings-panel hidden';
    document.body.appendChild(this.element);

    this.render();
    this.setupEventListeners();
  }

  render() {
    this.element.innerHTML = `
      <div class="settings-content">
        <h3>${i18n.t('settings')}</h3>

        <div class="setting-row">
          <label>${i18n.t('language')}</label>
          <div class="language-toggle">
            <button class="lang-btn ${i18n.currentLocale === 'th' ? 'active' : ''}" data-lang="th">TH</button>
            <button class="lang-btn ${i18n.currentLocale === 'en' ? 'active' : ''}" data-lang="en">EN</button>
          </div>
        </div>

        <div class="setting-row">
          <label>${i18n.t('sound')}</label>
          <button class="sound-toggle ${this.soundEnabled ? 'on' : 'off'}">
            ${this.soundEnabled ? i18n.t('on') : i18n.t('off')}
          </button>
        </div>

        <button class="close-settings">&times;</button>
      </div>
    `;
  }

  setupEventListeners() {
    // Language toggle
    this.element.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        i18n.setLocale(lang);
        this.render();
      });
    });

    // Sound toggle
    this.element.querySelector('.sound-toggle').addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      localStorage.setItem('soundEnabled', this.soundEnabled);
      this.render();
      window.dispatchEvent(new CustomEvent('sound-change', { detail: this.soundEnabled }));
    });

    // Close
    this.element.querySelector('.close-settings').addEventListener('click', () => {
      this.close();
    });
  }

  open() {
    this.isOpen = true;
    this.element.classList.remove('hidden');
  }

  close() {
    this.isOpen = false;
    this.element.classList.add('hidden');
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }
}
```

### Settings CSS
```css
.settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background: #fff;
  box-shadow: -4px 0 20px rgba(0,0,0,0.1);
  z-index: 1001;
  transition: transform 0.3s ease;
}

.settings-panel.hidden {
  transform: translateX(100%);
}

.settings-content {
  padding: 24px;
}

.settings-content h3 {
  margin-bottom: 24px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.language-toggle {
  display: flex;
  gap: 8px;
}

.lang-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
}

.lang-btn.active {
  background: #333;
  color: #fff;
  border-color: #333;
}

.sound-toggle {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
}

.sound-toggle.on {
  background: #4CAF50;
  color: #fff;
}

.sound-toggle.off {
  background: #f5f5f5;
}

.close-settings {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

/* Settings Button (in header) */
.settings-btn {
  padding: 8px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
```

---

## Implementation Steps

### Step 1: Create Toast System
1. Create `src/components/Toast.js`
2. Add CSS animations
3. Integrate with realtime events

### Step 2: Create i18n Module
1. Create `src/lib/i18n.js`
2. Add Thai and English translations
3. Add locale detection

### Step 3: Create Settings Panel
1. Create `src/components/Settings.js`
2. Add language toggle
3. Add sound toggle

### Step 4: Wire Up Notifications
1. Listen for province-captured events
2. Check if player's party won
3. Show appropriate toast

### Step 5: Localize All UI
1. Replace hardcoded text with i18n.t() calls
2. Add locale-change event listener
3. Re-render components on language change

---

## Test Cases

### Unit Tests
- [ ] Toast shows and auto-dismisses
- [ ] i18n.t() returns correct translation
- [ ] i18n.t() handles missing keys
- [ ] Settings toggle works

### Integration Tests
- [ ] Language change persists
- [ ] Sound setting persists
- [ ] Toast shows on province capture

### E2E Tests
- [ ] Switch language → UI updates
- [ ] Toggle sound → click sound changes
- [ ] Province captured → toast appears

---

## Acceptance Criteria
- [ ] Toast notifications working
- [ ] Thai/English toggle working
- [ ] Sound on/off working
- [ ] Settings panel accessible
- [ ] All UI text localized
