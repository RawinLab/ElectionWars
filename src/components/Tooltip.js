/**
 * Tooltip component for province hover information
 */
export class Tooltip {
  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'province-tooltip';
    this.applyStyles();
    document.body.appendChild(this.element);
    this.visible = false;
  }

  /**
   * Apply inline styles for portability
   */
  applyStyles() {
    Object.assign(this.element.style, {
      position: 'absolute',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      padding: '12px',
      maxWidth: '250px',
      zIndex: '1001',
      pointerEvents: 'none',
      display: 'none',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      lineHeight: '1.4'
    });
  }

  /**
   * Show tooltip at position with HTML content
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} content - HTML content
   */
  show(x, y, content) {
    this.element.innerHTML = content;
    this.element.style.display = 'block';
    this.visible = true;
    this.updatePosition(x, y);
  }

  /**
   * Hide tooltip
   */
  hide() {
    this.element.style.display = 'none';
    this.visible = false;
  }

  /**
   * Move tooltip to new position, avoiding viewport edges
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  updatePosition(x, y) {
    if (!this.visible) return;

    const padding = 10;
    const tooltipRect = this.element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let posX = x + padding;
    let posY = y + padding;

    // Avoid right edge
    if (posX + tooltipRect.width > viewportWidth - padding) {
      posX = x - tooltipRect.width - padding;
    }

    // Avoid bottom edge
    if (posY + tooltipRect.height > viewportHeight - padding) {
      posY = y - tooltipRect.height - padding;
    }

    // Avoid left edge
    if (posX < padding) {
      posX = padding;
    }

    // Avoid top edge
    if (posY < padding) {
      posY = padding;
    }

    this.element.style.left = `${posX}px`;
    this.element.style.top = `${posY}px`;
  }

  /**
   * Set tooltip content for province data
   * @param {Object} province - Province data { name, englishName }
   * @param {Object} state - Province state { currentShield, maxShield }
   * @param {Object} party - Controlling party { name, color }
   * @param {number} playerAttacks - Number of player attacks on this province
   */
  setProvinceData(province, state, party, playerAttacks) {
    const shieldPercentage = state.maxShield > 0
      ? (state.currentShield / state.maxShield) * 100
      : 0;

    const shieldCurrent = state.currentShield.toLocaleString();
    const shieldMax = state.maxShield.toLocaleString();

    const content = `
      <div class="tooltip-header" style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
        <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #333;">${province.name}</h4>
        <span class="tooltip-english" style="color: #666; font-size: 12px;">${province.englishName}</span>
      </div>
      <div class="tooltip-body">
        <div class="shield-info" style="margin-bottom: 8px;">
          <span class="shield-label" style="display: block; color: #666; font-size: 12px; margin-bottom: 4px;">Shield:</span>
          <div class="shield-bar" style="background: #e0e0e0; border-radius: 4px; height: 8px; overflow: hidden; margin-bottom: 4px;">
            <div class="shield-fill" style="width: ${shieldPercentage}%; background: linear-gradient(90deg, #4CAF50, #8BC34A); height: 100%; border-radius: 4px; transition: width 0.3s ease;"></div>
          </div>
          <span class="shield-value" style="font-size: 12px; color: #666;">${shieldCurrent} / ${shieldMax}</span>
        </div>
        <div class="party-info" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span class="party-badge" style="width: 12px; height: 12px; border-radius: 50%; background-color: ${party.color};"></span>
          <span style="font-size: 13px; color: #333;">Controlled by: ${party.name}</span>
        </div>
        <div class="attack-info" style="font-size: 12px; color: #666;">
          <span>Your attacks: ${playerAttacks.toLocaleString()}</span>
        </div>
      </div>
    `;

    this.element.innerHTML = content;
  }

  /**
   * Destroy the tooltip element
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

export default Tooltip;
