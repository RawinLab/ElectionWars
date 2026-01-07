/**
 * LanguageToggle component for Thai/English language switching
 */

const STORAGE_KEY = 'electionWar_language';
const SUPPORTED_LANGUAGES = ['th', 'en'];

/**
 * Detect default language based on browser locale
 * @returns {string} 'th' or 'en'
 */
function detectDefaultLanguage() {
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  // Check if browser language starts with 'th'
  if (browserLang.toLowerCase().startsWith('th')) {
    return 'th';
  }
  return 'en';
}

export class LanguageToggle {
  /**
   * @param {HTMLElement} container - Container element to render into
   */
  constructor(container) {
    this.container = container;
    this.currentLanguage = this.loadLanguage();
    this.listeners = [];
    this.element = null;
    this.render();
  }

  /**
   * Load language preference from localStorage or detect from browser
   * @returns {string} 'th' or 'en'
   */
  loadLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('Failed to load language preference:', e);
    }
    return detectDefaultLanguage();
  }

  /**
   * Save language preference to localStorage
   * @param {string} lang - 'th' or 'en'
   */
  saveLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  }

  /**
   * Create toggle button element
   * @param {string} lang - Language code
   * @param {string} label - Display label
   * @returns {HTMLButtonElement}
   */
  createButton(lang, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'language-btn';
    button.dataset.lang = lang;
    button.textContent = label;
    button.setAttribute('aria-pressed', this.currentLanguage === lang);

    if (this.currentLanguage === lang) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => {
      this.setLanguage(lang);
    });

    return button;
  }

  /**
   * Render the language toggle buttons
   */
  render() {
    if (!this.container) return;

    // Create wrapper element
    this.element = document.createElement('div');
    this.element.className = 'language-toggle';
    this.element.setAttribute('role', 'group');
    this.element.setAttribute('aria-label', 'Language selection');

    // Apply inline styles for portability
    Object.assign(this.element.style, {
      display: 'flex',
      gap: '4px',
      padding: '4px',
      background: 'var(--color-background, #F5F5F5)',
      borderRadius: 'var(--radius-md, 8px)'
    });

    // Create Thai button
    const thButton = this.createButton('th', 'ไทย');
    this.applyButtonStyles(thButton);

    // Create English button
    const enButton = this.createButton('en', 'EN');
    this.applyButtonStyles(enButton);

    this.element.appendChild(thButton);
    this.element.appendChild(enButton);

    // Clear and append to container
    this.container.innerHTML = '';
    this.container.appendChild(this.element);
  }

  /**
   * Apply styles to a button
   * @param {HTMLButtonElement} button
   */
  applyButtonStyles(button) {
    Object.assign(button.style, {
      padding: '8px 16px',
      border: 'none',
      borderRadius: 'var(--radius-sm, 6px)',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      background: 'transparent',
      color: 'var(--color-text-secondary, #666666)'
    });

    if (button.classList.contains('active')) {
      Object.assign(button.style, {
        background: 'var(--color-surface, #FFFFFF)',
        color: 'var(--color-text, #333333)',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))'
      });
    }

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
  }

  /**
   * Set the current language
   * @param {string} lang - 'th' or 'en'
   */
  setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      console.warn(`Unsupported language: ${lang}`);
      return;
    }

    if (lang === this.currentLanguage) return;

    const previousLang = this.currentLanguage;
    this.currentLanguage = lang;
    this.saveLanguage(lang);

    // Update button states
    this.updateButtonStates();

    // Notify listeners
    this.notifyListeners(lang, previousLang);
  }

  /**
   * Update button visual states
   */
  updateButtonStates() {
    if (!this.element) return;

    const buttons = this.element.querySelectorAll('.language-btn');
    buttons.forEach(button => {
      const isActive = button.dataset.lang === this.currentLanguage;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive);

      // Update styles
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
    });
  }

  /**
   * Get the current language
   * @returns {string} 'th' or 'en'
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Register a change listener
   * @param {Function} callback - Called with (newLang, previousLang)
   * @returns {Function} Unsubscribe function
   */
  onChange(callback) {
    if (typeof callback !== 'function') {
      console.warn('onChange callback must be a function');
      return () => {};
    }

    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of language change
   * @param {string} newLang
   * @param {string} previousLang
   */
  notifyListeners(newLang, previousLang) {
    this.listeners.forEach(callback => {
      try {
        callback(newLang, previousLang);
      } catch (e) {
        console.error('Language change listener error:', e);
      }
    });
  }

  /**
   * Destroy the component
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.listeners = [];
    this.element = null;
  }
}

// Singleton instance
let languageToggleInstance = null;

/**
 * Get or create the singleton LanguageToggle instance
 * @param {HTMLElement} [container] - Container element (required for first call)
 * @returns {LanguageToggle}
 */
export function getLanguageToggle(container) {
  if (!languageToggleInstance && container) {
    languageToggleInstance = new LanguageToggle(container);
  }
  return languageToggleInstance;
}

export default LanguageToggle;
