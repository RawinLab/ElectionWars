/**
 * ConnectionStatus Component
 * Displays realtime connection status indicator with auto-hide functionality
 */
export class ConnectionStatus {
  /**
   * @param {HTMLElement} container - Container element for the status indicator
   */
  constructor(container) {
    this.container = container;
    this.status = 'disconnected';
    this.hideTimeout = null;
    this.realtimeManager = null;
    this.element = null;
  }

  /**
   * Set the realtime manager and listen to connection changes
   * @param {Object} manager - RealtimeManager instance
   */
  setRealtimeManager(manager) {
    this.realtimeManager = manager;

    if (manager && typeof manager.onConnectionChange === 'function') {
      manager.onConnectionChange((status) => {
        this.setStatus(status);
      });
    }
  }

  /**
   * Update the displayed status
   * @param {'connected' | 'disconnected' | 'reconnecting'} status - Connection status
   */
  setStatus(status) {
    this.status = status;

    // Clear any existing hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Update the display
    this.render();

    // Auto-hide when connected after 3 seconds
    if (status === 'connected') {
      this.hideTimeout = setTimeout(() => {
        if (this.element) {
          this.element.style.display = 'none';
        }
      }, 3000);
    }
  }

  /**
   * Get display text for current status
   * @returns {string} Status text
   */
  getStatusText() {
    switch (this.status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'reconnecting':
        return 'Reconnecting...';
      default:
        return 'Unknown';
    }
  }

  /**
   * Render the status indicator
   */
  render() {
    if (!this.container) {
      return;
    }

    // Create element if it doesn't exist
    if (!this.element) {
      this.element = document.createElement('div');
      this.container.appendChild(this.element);
    }

    // Update classes
    this.element.className = `connection-status ${this.status}`;

    // Ensure element is visible when rendering
    this.element.style.display = '';

    // Update content
    this.element.innerHTML = `
      <span class="status-dot"></span>
      <span class="status-text">${this.getStatusText()}</span>
    `;
  }
}

export default ConnectionStatus;
