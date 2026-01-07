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

    const html = `
      <div class="leaderboard-header">
        <h3>Party Rankings</h3>
      </div>
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Party</th>
            <th>Provinces</th>
            <th>Clicks</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((party, index) => this.renderRow(party, index + 1)).join('')}
        </tbody>
      </table>
    `;

    this.container.innerHTML = html;
  }

  renderRow(party, rank) {
    return `
      <tr data-party-id="${party.party_id}">
        <td>${rank}</td>
        <td>
          <span class="party-badge" style="background: ${party.party_color}"></span>
          ${party.party_name}
        </td>
        <td>${party.provinces_count}</td>
        <td>${this.formatNumber(party.total_clicks)}</td>
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

    const row = this.container.querySelector(`tr[data-party-id="${data.party_id}"]`);

    if (!row) return;

    const cells = row.querySelectorAll('td');

    if (cells.length >= 4) {
      if (data.provinces_count !== undefined) {
        cells[2].textContent = data.provinces_count;
      }

      if (data.total_clicks !== undefined) {
        cells[3].textContent = this.formatNumber(data.total_clicks);
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
