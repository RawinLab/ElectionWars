/**
 * ToastManager - Notification system for Election Wars game
 * Handles displaying toast notifications with auto-dismiss and manual close
 */

class ToastManager {
  constructor() {
    this.container = this.getOrCreateContainer();
    this.toasts = [];
    this.defaultDuration = 3000;
  }

  /**
   * Gets existing toast container or creates one if not found
   * @returns {HTMLElement} The toast container element
   */
  getOrCreateContainer() {
    let container = document.getElementById('toast-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    return container;
  }

  /**
   * Shows a toast notification
   * @param {string} message - The message to display
   * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Auto-dismiss duration in ms (0 for no auto-dismiss)
   * @returns {HTMLElement} The created toast element
   */
  show(message, type = 'info', duration = this.defaultDuration) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 280px;
      max-width: 400px;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      pointer-events: auto;
      animation: toastSlideIn 0.3s ease-out;
      ${this.getTypeStyles(type)}
    `;

    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message;
    messageSpan.style.cssText = `
      flex: 1;
      margin-right: 12px;
    `;

    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
      padding: 0;
      line-height: 1;
      color: inherit;
    `;
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.opacity = '1';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.opacity = '0.7';
    });
    closeButton.addEventListener('click', () => {
      this.dismiss(toast);
    });

    toast.appendChild(messageSpan);
    toast.appendChild(closeButton);

    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Inject animation keyframes if not already present
    this.injectAnimationStyles();

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    return toast;
  }

  /**
   * Gets CSS styles based on toast type
   * @param {string} type - The toast type
   * @returns {string} CSS style string
   */
  getTypeStyles(type) {
    const styles = {
      success: 'background-color: #10b981; color: #ffffff;',
      error: 'background-color: #ef4444; color: #ffffff;',
      warning: 'background-color: #f59e0b; color: #1f2937;',
      info: 'background-color: #3b82f6; color: #ffffff;'
    };
    return styles[type] || styles.info;
  }

  /**
   * Injects animation keyframes into the document
   */
  injectAnimationStyles() {
    if (document.getElementById('toast-animation-styles')) {
      return;
    }

    const styleSheet = document.createElement('style');
    styleSheet.id = 'toast-animation-styles';
    styleSheet.textContent = `
      @keyframes toastSlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes toastSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  /**
   * Dismisses a toast with animation
   * @param {HTMLElement} toast - The toast element to dismiss
   */
  dismiss(toast) {
    if (!toast || !toast.parentNode) {
      return;
    }

    toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      const index = this.toasts.indexOf(toast);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }
    }, 300);
  }

  /**
   * Dismisses all active toasts
   */
  dismissAll() {
    [...this.toasts].forEach(toast => this.dismiss(toast));
  }

  /**
   * Shows notification when a province changes hands
   * @param {string} partyName - The party that took the province
   * @param {string} provinceName - The name of the province
   */
  provinceFlip(partyName, provinceName) {
    const message = `${provinceName} has flipped to ${partyName}!`;
    this.show(message, 'warning');
  }

  /**
   * Shows notification when player's party wins a province
   * @param {string} partyName - The winning party name
   * @param {string} provinceName - The name of the province won
   */
  partyWin(partyName, provinceName) {
    const message = `Victory! ${partyName} has won ${provinceName}!`;
    this.show(message, 'success');
  }

  /**
   * Shows warning when a province's shield is low
   * @param {string} provinceName - The name of the province
   * @param {number} shieldLevel - The current shield level
   */
  shieldWarning(provinceName, shieldLevel) {
    const message = `Warning: ${provinceName} shield is low (${shieldLevel}%)!`;
    this.show(message, 'error');
  }
}

// Create singleton instance
const toastManager = new ToastManager();

export { ToastManager, toastManager };
