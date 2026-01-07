/**
 * SettingsPanel component for game settings (language, sound, etc.)
 */

import { LanguageToggle } from './LanguageToggle.js';

const SOUND_STORAGE_KEY = 'electionWar_sound';

export class SettingsPanel {
  constructor() {
    this.element = null;
    this.overlay = null;
    this.languageToggle = null;
    this.soundEnabled = this.loadSoundPreference();
    this.isOpen = false;
    this.onCloseCallback = null;
    this.onLanguageChangeCallback = null;
    this.onSoundChangeCallback = null;

    this.createDOMStructure();
  }

  /**
   * Load sound preference from localStorage
   * @returns {boolean}
   */
  loadSoundPreference() {
    try {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch (e) {
      console.warn('Failed to load sound preference:', e);
    }
    return true; // Default to sound on
  }

  /**
   * Save sound preference to localStorage
   * @param {boolean} enabled
   */
  saveSoundPreference(enabled) {
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    } catch (e) {
      console.warn('Failed to save sound preference:', e);
    }
  }

  /**
   * Create the DOM structure for the settings panel
   */
  createDOMStructure() {
    // Find or create the container
    const container = document.getElementById('settings-panel');
    if (!container) {
      console.warn('Settings panel container (#settings-panel) not found');
      return;
    }

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'settings-overlay';
    this.applyOverlayStyles();

    // Create panel
    this.element = document.createElement('div');
    this.element.className = 'settings-panel-content';
    this.applyPanelStyles();

    // Append panel to overlay
    this.overlay.appendChild(this.element);

    // Append to container
    container.innerHTML = '';
    container.appendChild(this.overlay);

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Close on escape key
    this.handleKeyDown = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Apply styles to overlay
   */
  applyOverlayStyles() {
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1002',
      opacity: '0',
      visibility: 'hidden',
      transition: 'opacity 0.2s ease, visibility 0.2s ease'
    });
  }

  /**
   * Apply styles to panel
   */
  applyPanelStyles() {
    Object.assign(this.element.style, {
      background: 'var(--color-surface, #FFFFFF)',
      borderRadius: 'var(--radius-lg, 16px)',
      padding: '24px',
      minWidth: '320px',
      maxWidth: '400px',
      width: '90%',
      boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.2))',
      transform: 'scale(0.9)',
      transition: 'transform 0.2s ease'
    });
  }

  /**
   * Render the settings panel content
   */
  render() {
    if (!this.element) return;

    this.element.innerHTML = '';

    // Header with title and close button
    const header = this.createHeader();
    this.element.appendChild(header);

    // Language section
    const languageSection = this.createLanguageSection();
    this.element.appendChild(languageSection);

    // Sound section
    const soundSection = this.createSoundSection();
    this.element.appendChild(soundSection);
  }

  /**
   * Create header with title and close button
   * @returns {HTMLElement}
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'settings-header';
    Object.assign(header.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '1px solid var(--color-neutral, #E0E0E0)'
    });

    // Title
    const title = document.createElement('h2');
    title.className = 'settings-title';
    title.textContent = 'Settings / \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32';
    Object.assign(title.style, {
      margin: '0',
      fontSize: '20px',
      fontWeight: '600',
      color: 'var(--color-text, #333333)'
    });

    // Close button
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'settings-close-btn';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close settings');
    Object.assign(closeButton.style, {
      width: '32px',
      height: '32px',
      border: 'none',
      borderRadius: '50%',
      background: 'var(--color-background, #F5F5F5)',
      cursor: 'pointer',
      fontSize: '24px',
      lineHeight: '1',
      color: 'var(--color-text-secondary, #666666)',
      transition: 'background 0.2s ease, color 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = 'var(--color-error, #F44336)';
      closeButton.style.color = '#FFFFFF';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'var(--color-background, #F5F5F5)';
      closeButton.style.color = 'var(--color-text-secondary, #666666)';
    });

    closeButton.addEventListener('click', () => {
      this.close();
    });

    header.appendChild(title);
    header.appendChild(closeButton);

    return header;
  }

  /**
   * Create language settings section
   * @returns {HTMLElement}
   */
  createLanguageSection() {
    const section = document.createElement('div');
    section.className = 'settings-section';
    Object.assign(section.style, {
      marginBottom: '20px'
    });

    // Section label
    const label = document.createElement('div');
    label.className = 'settings-label';
    label.textContent = 'Language / \u0E20\u0E32\u0E29\u0E32';
    Object.assign(label.style, {
      fontSize: '14px',
      fontWeight: '500',
      color: 'var(--color-text-secondary, #666666)',
      marginBottom: '12px'
    });

    // Language toggle container
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'language-toggle-container';

    // Create language toggle
    this.languageToggle = new LanguageToggle(toggleContainer);

    // Forward language change events
    this.languageToggle.onChange((newLang, prevLang) => {
      if (this.onLanguageChangeCallback) {
        this.onLanguageChangeCallback(newLang, prevLang);
      }
    });

    section.appendChild(label);
    section.appendChild(toggleContainer);

    return section;
  }

  /**
   * Create sound settings section
   * @returns {HTMLElement}
   */
  createSoundSection() {
    const section = document.createElement('div');
    section.className = 'settings-section';
    Object.assign(section.style, {
      marginBottom: '8px'
    });

    // Section label
    const label = document.createElement('div');
    label.className = 'settings-label';
    label.textContent = 'Sound / \u0E40\u0E2A\u0E35\u0E22\u0E07';
    Object.assign(label.style, {
      fontSize: '14px',
      fontWeight: '500',
      color: 'var(--color-text-secondary, #666666)',
      marginBottom: '12px'
    });

    // Sound toggle container
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'sound-toggle-container';
    Object.assign(toggleContainer.style, {
      display: 'flex',
      gap: '4px',
      padding: '4px',
      background: 'var(--color-background, #F5F5F5)',
      borderRadius: 'var(--radius-md, 8px)'
    });

    // On button
    const onButton = this.createSoundButton('on', 'On / \u0E40\u0E1B\u0E34\u0E14', this.soundEnabled);
    // Off button
    const offButton = this.createSoundButton('off', 'Off / \u0E1B\u0E34\u0E14', !this.soundEnabled);

    toggleContainer.appendChild(onButton);
    toggleContainer.appendChild(offButton);

    section.appendChild(label);
    section.appendChild(toggleContainer);

    return section;
  }

  /**
   * Create a sound toggle button
   * @param {string} type - 'on' or 'off'
   * @param {string} label - Button label
   * @param {boolean} isActive - Whether button is active
   * @returns {HTMLButtonElement}
   */
  createSoundButton(type, label, isActive) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `sound-btn ${isActive ? 'active' : ''}`;
    button.dataset.sound = type;
    button.textContent = label;
    button.setAttribute('aria-pressed', isActive);

    Object.assign(button.style, {
      padding: '8px 16px',
      border: 'none',
      borderRadius: 'var(--radius-sm, 6px)',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      flex: '1'
    });

    this.applySoundButtonStyles(button, isActive);

    button.addEventListener('click', () => {
      const newSoundEnabled = type === 'on';
      if (newSoundEnabled !== this.soundEnabled) {
        this.setSoundEnabled(newSoundEnabled);
      }
    });

    // Hover effect
    button.addEventListener('mouseenter', () => {
      if (!button.classList.contains('active')) {
        button.style.background = 'rgba(255, 255, 255, 0.5)';
      }
    });

    button.addEventListener('mouseleave', () => {
      if (!button.classList.contains('active')) {
        button.style.background = 'transparent';
      }
    });

    return button;
  }

  /**
   * Apply styles to sound button based on active state
   * @param {HTMLButtonElement} button
   * @param {boolean} isActive
   */
  applySoundButtonStyles(button, isActive) {
    if (isActive) {
      Object.assign(button.style, {
        background: 'var(--color-surface, #FFFFFF)',
        color: 'var(--color-text, #333333)',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))'
      });
    } else {
      Object.assign(button.style, {
        background: 'transparent',
        color: 'var(--color-text-secondary, #666666)',
        boxShadow: 'none'
      });
    }
  }

  /**
   * Set sound enabled state
   * @param {boolean} enabled
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    this.saveSoundPreference(enabled);
    this.updateSoundButtonStates();

    if (this.onSoundChangeCallback) {
      this.onSoundChangeCallback(enabled);
    }
  }

  /**
   * Update sound button visual states
   */
  updateSoundButtonStates() {
    if (!this.element) return;

    const buttons = this.element.querySelectorAll('.sound-btn');
    buttons.forEach(button => {
      const isOn = button.dataset.sound === 'on';
      const isActive = isOn === this.soundEnabled;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive);
      this.applySoundButtonStyles(button, isActive);
    });
  }

  /**
   * Open the settings panel
   */
  open() {
    if (this.isOpen) return;

    this.render();
    this.isOpen = true;

    // Show overlay
    if (this.overlay) {
      this.overlay.style.opacity = '1';
      this.overlay.style.visibility = 'visible';
    }

    // Show panel with animation
    if (this.element) {
      this.element.style.transform = 'scale(1)';
    }

    // Focus trap - focus close button
    const closeBtn = this.element?.querySelector('.settings-close-btn');
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  /**
   * Close the settings panel
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;

    // Hide with animation
    if (this.overlay) {
      this.overlay.style.opacity = '0';
      this.overlay.style.visibility = 'hidden';
    }

    if (this.element) {
      this.element.style.transform = 'scale(0.9)';
    }

    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  /**
   * Toggle the settings panel
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Register close callback
   * @param {Function} callback
   */
  onClose(callback) {
    this.onCloseCallback = callback;
  }

  /**
   * Register language change callback
   * @param {Function} callback - Called with (newLang, prevLang)
   */
  onLanguageChange(callback) {
    this.onLanguageChangeCallback = callback;
  }

  /**
   * Register sound change callback
   * @param {Function} callback - Called with (enabled)
   */
  onSoundChange(callback) {
    this.onSoundChangeCallback = callback;
  }

  /**
   * Get current language
   * @returns {string} 'th' or 'en'
   */
  getLanguage() {
    return this.languageToggle ? this.languageToggle.getLanguage() : 'en';
  }

  /**
   * Get sound enabled state
   * @returns {boolean}
   */
  isSoundEnabled() {
    return this.soundEnabled;
  }

  /**
   * Destroy the component
   */
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);

    if (this.languageToggle) {
      this.languageToggle.destroy();
    }

    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    this.element = null;
    this.overlay = null;
    this.languageToggle = null;
  }
}

// Singleton instance
let settingsPanelInstance = null;

/**
 * Get or create the singleton SettingsPanel instance
 * @returns {SettingsPanel}
 */
export function getSettingsPanel() {
  if (!settingsPanelInstance) {
    settingsPanelInstance = new SettingsPanel();
  }
  return settingsPanelInstance;
}

export default SettingsPanel;
