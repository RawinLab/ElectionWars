import { supabase } from '../lib/supabase.js';

export class Leaderboard {
  constructor(container) {
    this.container = container;
    this.realtimeManager = null;
    this.currentData = [];
  }

  async fetch() {
    try {
      this.renderLoading();

      const { data, error } = await supabase.rpc('get_leaderboard');

      if (error) {
        throw error;
      }

      this.currentData = data || [];
      this.render(this.currentData);
      return this.currentData;
    } catch (error) {
      this.renderError(error.message);
      throw error;
    }
  }

  render(data) {
    if (!this.container) return;

    const top10 = data.slice(0, 10);

    const html = `
      <div class="leaderboard-content">
        <div class="leaderboard-header">
          <span class="leaderboard-title">LEADERBOARD</span>
        </div>
        <table class="leaderboard-table">
          <tbody>
            ${top10.map((party, index) => this.renderRow(party, index + 1)).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.container.innerHTML = html;
  }

  renderRow(party, rank) {
    const isTop3 = rank <= 3;
    const rankClass = isTop3 ? `rank-${rank} rank-glow` : '';

    return `
      <tr class="leaderboard-row ${isTop3 ? 'top-3' : ''}" data-party-id="${party.party_id}">
        <td class="rank-cell">
          <span class="rank ${rankClass}">${rank}</span>
        </td>
        <td class="party-cell">
          <span class="party-badge" style="background-color: ${party.party_color}"></span>
          <span class="party-name">${party.party_name}</span>
        </td>
        <td class="provinces-cell">
          <span class="provinces-count">${party.provinces_count}</span>
        </td>
        <td class="clicks-cell">
          <span class="clicks-count">${this.formatNumber(party.total_clicks)}</span>
        </td>
      </tr>
    `;
  }

  renderLoading() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="leaderboard-header">
        <h3>Party Rankings</h3>
      </div>
      <div class="leaderboard-loading">Loading...</div>
    `;
  }

  renderError(message) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="leaderboard-header">
        <h3>Party Rankings</h3>
      </div>
      <div class="leaderboard-error">Error: ${message}</div>
    `;
  }

  formatNumber(num) {
    if (num === null || num === undefined) return '0';

    const n = Number(num);

    if (n >= 1000000) {
      return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }

    if (n >= 1000) {
      return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }

    return n.toString();
  }

  update(data) {
    if (!this.container || !data) return;

    const row = this.container.querySelector(`.leaderboard-row[data-party-id="${data.party_id}"]`);

    if (!row) return;

    if (data.provinces_count !== undefined) {
      const provincesEl = row.querySelector('.provinces-count');
      if (provincesEl) {
        provincesEl.textContent = data.provinces_count;
      }
    }

    if (data.total_clicks !== undefined) {
      const clicksEl = row.querySelector('.clicks-count');
      if (clicksEl) {
        clicksEl.textContent = this.formatNumber(data.total_clicks);
      }
    }
  }

  setRealtimeManager(manager) {
    this.realtimeManager = manager;

    if (this.realtimeManager && typeof this.realtimeManager.subscribe === 'function') {
      this.realtimeManager.subscribe('leaderboard', () => {
        this.fetch();
      });
    }
  }
}
