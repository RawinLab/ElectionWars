export class SoundToggle {
  constructor(container) {
    this.container = container
    this.enabled = this.loadPreference()
    this.render()
  }

  loadPreference() {
    const saved = localStorage.getItem('electionWar_soundEnabled')
    if (saved === null) {
      return false
    }
    return saved === 'true'
  }

  savePreference() {
    localStorage.setItem('electionWar_soundEnabled', String(this.enabled))
  }

  setEnabled(enabled) {
    this.enabled = enabled
    this.savePreference()
    this.render()
  }

  isEnabled() {
    return this.enabled
  }

  render() {
    this.container.innerHTML = ''

    const button = document.createElement('button')
    button.className = 'sound-toggle'
    button.setAttribute('aria-label', this.enabled ? 'Disable sound' : 'Enable sound')
    button.textContent = this.enabled ? 'Sound: ON' : 'Sound: OFF'

    button.style.padding = '8px 16px'
    button.style.border = '1px solid #ccc'
    button.style.borderRadius = '4px'
    button.style.backgroundColor = this.enabled ? '#22c55e' : '#6b7280'
    button.style.color = 'white'
    button.style.cursor = 'pointer'
    button.style.fontSize = '14px'
    button.style.fontWeight = '500'
    button.style.transition = 'background-color 0.2s'

    button.addEventListener('click', () => {
      this.setEnabled(!this.enabled)
    })

    this.container.appendChild(button)
  }
}
