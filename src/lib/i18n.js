import thTranslations from '../i18n/th.json';
import enTranslations from '../i18n/en.json';

const translations = {
  th: thTranslations,
  en: enTranslations
};

class I18n {
  constructor() {
    this.listeners = [];
    this.currentLanguage = this.detectLanguage();
  }

  detectLanguage() {
    // Check localStorage first
    if (typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('electionwars_language');
      if (savedLang && (savedLang === 'th' || savedLang === 'en')) {
        return savedLang;
      }
    }

    // Check browser preference
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang && browserLang.startsWith('th')) {
        return 'th';
      }
    }

    // Default to Thai
    return 'th';
  }

  setLanguage(lang) {
    if (lang !== 'th' && lang !== 'en') {
      console.warn(`Invalid language: ${lang}. Supported languages: 'th', 'en'`);
      return;
    }

    this.currentLanguage = lang;

    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('electionwars_language', lang);
    }

    // Notify listeners
    this.listeners.forEach(callback => {
      try {
        callback(lang);
      } catch (error) {
        console.error('Error in language change listener:', error);
      }
    });
  }

  getLanguage() {
    return this.currentLanguage;
  }

  t(key, params = {}) {
    const keys = key.split('.');
    let value = translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key is not a string: ${key}`);
      return key;
    }

    // Replace placeholders like {party} and {province}
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }

  onLanguageChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Export singleton instance
const i18n = new I18n();
export default i18n;
