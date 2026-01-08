/**
 * GameTimer - Countdown timer component for Election Wars
 * Displays time remaining until game end date
 */
export class GameTimer {
  /**
   * @param {HTMLElement} container - DOM element to render timer into
   * @param {Date} endDate - Game end date as Date object
   */
  constructor(container, endDate) {
    this.container = container;
    this.endDate = endDate;
    this.intervalId = null;
    this.expireCallback = null;
    this.hasExpired = false;
  }

  /**
   * Start the countdown timer
   * Updates every second
   */
  start() {
    // Initial render
    this.render();

    // Update every second
    this.intervalId = setInterval(() => {
      this.render();
    }, 1000);
  }

  /**
   * Stop the countdown timer
   * Cleans up the interval
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Calculate time remaining until end date
   * @returns {{ days: number, hours: number, minutes: number, seconds: number }}
   */
  calculateTimeLeft() {
    const now = new Date();
    const difference = this.endDate.getTime() - now.getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }

  /**
   * Pad a number with leading zero if needed
   * @param {number} num - Number to pad
   * @returns {string} - Padded string
   */
  padNumber(num) {
    return num.toString().padStart(2, '0');
  }

  /**
   * Render the timer display
   */
  render() {
    const timeLeft = this.calculateTimeLeft();
    const isExpired = timeLeft.days === 0 &&
                      timeLeft.hours === 0 &&
                      timeLeft.minutes === 0 &&
                      timeLeft.seconds === 0;

    if (isExpired) {
      this.container.innerHTML = `
        <div class="timer-expired">
          <span>Game Ended!</span>
        </div>
      `;

      // Trigger expire callback only once
      if (!this.hasExpired && this.expireCallback) {
        this.hasExpired = true;
        this.expireCallback();
      }

      // Stop the interval when expired
      this.stop();
      return;
    }

    // Check if this is the inline timer (inside missiles counter)
    const isInline = this.container.classList.contains('game-timer-inline');

    if (isInline) {
      // Compact inline format: 30D 12:34:56
      this.container.innerHTML = `
        <span class="timer-days">${timeLeft.days}D</span>
        <span class="timer-colon"> </span>
        <span class="timer-time">${this.padNumber(timeLeft.hours)}:${this.padNumber(timeLeft.minutes)}:${this.padNumber(timeLeft.seconds)}</span>
      `;
    } else {
      // Full format with labels
      this.container.innerHTML = `
        <div class="timer-display">
          <div class="timer-segment">
            <span class="timer-value">${this.padNumber(timeLeft.days)}</span>
            <span class="timer-label">Days</span>
          </div>
          <div class="timer-segment">
            <span class="timer-value">${this.padNumber(timeLeft.hours)}</span>
            <span class="timer-label">Hours</span>
          </div>
          <div class="timer-segment">
            <span class="timer-value">${this.padNumber(timeLeft.minutes)}</span>
            <span class="timer-label">Min</span>
          </div>
          <div class="timer-segment">
            <span class="timer-value">${this.padNumber(timeLeft.seconds)}</span>
            <span class="timer-label">Sec</span>
          </div>
        </div>
      `;
    }
  }

  /**
   * Register a callback to be called when timer expires
   * @param {Function} callback - Function to call on expiration
   */
  onExpire(callback) {
    this.expireCallback = callback;
  }
}
