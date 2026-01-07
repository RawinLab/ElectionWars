# Election War (อีเลคชั่น วอร์)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Firebase Hosting](https://img.shields.io/badge/Hosted%20on-Firebase-orange)](https://firebase.google.com/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E)](https://supabase.com/)

A real-time, browser-based political clicker game for Thailand's 2026 parliamentary election. Choose your party and compete to control all 77 Thai provinces!

🎮 **[Play Now](#)** | 📖 **[Documentation](./requirements/)** | 🐛 **[Report Bug](https://github.com/rawinlab/ElectionWars/issues)**

---

## 🎯 Game Overview

**Election War** is inspired by Clickwar-style games where players from different political parties compete to control provinces on a map through continuous clicking.

### Key Features

- 🗺️ **Interactive Thailand Map** - All 77 provinces with real-time updates
- 🛡️ **Shield System** - Provinces have shields based on population that must be depleted before capture
- ⚡ **Real-time Multiplayer** - See changes instantly as other players click
- 🎨 **Official Party Colors** - All 57 registered parties with authentic colors
- 🌐 **Bilingual UI** - Thai and English language support
- 📱 **Mobile Friendly** - Responsive design for all devices

### How to Play

1. **Choose Your Party** - Select from 57 Thai political parties
2. **Click to Attack/Defend** - Click provinces to reduce enemy shields or strengthen your own
3. **Capture Provinces** - When shield reaches 0, highest attacker captures
4. **Win the Election!** - Party controlling most provinces on Feb 8, 2026 wins

---

## 🛡️ Shield System

Each province has a shield based on its population:

| Province | Population | Shield MAX | Start (Neutral) |
|----------|------------|------------|-----------------|
| Bangkok | 5,456,000 | 545,600 | 272,800 |
| Nakhon Ratchasima | 2,620,000 | 262,000 | 131,000 |
| Samut Songkhram | 187,000 | 18,700 | 9,350 |

- **Defend (Own Province):** +1 Shield per click
- **Attack (Enemy Province):** -1 Shield per click
- **Capture:** When shield = 0, highest attacker wins

---

## 🚀 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Vite + Vanilla JavaScript |
| **Backend** | Supabase (PostgreSQL + Realtime) |
| **Hosting** | Firebase Hosting |
| **Auth** | Supabase Anonymous Auth |
| **Real-time** | Supabase Realtime (WebSocket) |
| **Testing** | Vitest + Playwright |
| **Monetization** | Google AdSense |

---

## 📁 Project Structure

```
ElectionWars/
├── public/
│   ├── sounds/              # Sound effects
│   └── thailand-map.svg     # SVG map of Thailand
├── src/
│   ├── lib/
│   │   ├── supabase.js      # Supabase client
│   │   ├── auth.js          # Authentication
│   │   ├── realtime.js      # Realtime subscriptions
│   │   └── i18n.js          # Internationalization
│   ├── components/
│   │   ├── Map.js           # Thailand map
│   │   ├── PartySelector.js # Party selection
│   │   ├── Leaderboard.js   # Rankings
│   │   ├── Timer.js         # Countdown
│   │   └── Toast.js         # Notifications
│   ├── styles/
│   │   └── main.css         # Styles
│   └── main.js              # Entry point
├── supabase/
│   ├── migrations/          # Database migrations
│   └── seed.sql             # Seed data
├── tests/
│   ├── unit/                # Unit tests
│   └── e2e/                 # E2E tests
├── plans/                   # Development plans
├── requirements/            # PRD, Tech Spec, Roadmap
├── index.html
├── package.json
├── vite.config.js
└── firebase.json
```

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Firebase account

### Installation

```bash
# Clone the repository
git clone https://github.com/rawinlab/ElectionWars.git
cd ElectionWars

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Environment Variables

```bash
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_GAME_END_DATE=2026-02-08T23:59:59+07:00
```

### Running Locally

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📊 Database Schema

### Core Tables

- **parties** - 57 Thai political parties
- **provinces** - 77 provinces with population
- **province_state** - Real-time game state (shield, control)
- **players** - Player profiles and stats
- **game_state** - Global game statistics

### Key Functions

- `click_province()` - Handle click with shield mechanics
- `join_game()` - Player registration
- `change_party()` - Switch party (24hr cooldown)
- `get_leaderboard()` - Party rankings

---

## 🚢 Deployment

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy
npm run build
firebase deploy --only hosting
```

### Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Run migrations in `supabase/migrations/`
3. Seed data with `supabase/seed.sql`
4. Enable Realtime on `province_state` and `game_state`

---

## 📋 Development Plans

Detailed implementation plans are in the `plans/` directory:

| Module | Description |
|--------|-------------|
| [1.1](plans/1-1-project-setup-plan.md) | Project Setup |
| [2.1](plans/2-1-database-tables-plan.md) | Database Tables |
| [2.2](plans/2-2-database-functions-plan.md) | Database Functions |
| [2.3](plans/2-3-database-rls-seed-plan.md) | RLS & Seed Data |
| [3.1](plans/3-1-authentication-plan.md) | Authentication |
| [4.1](plans/4-1-thailand-map-plan.md) | Thailand Map |
| [5.1](plans/5-1-realtime-leaderboard-plan.md) | Realtime & Leaderboard |
| [6.1](plans/6-1-ux-notifications-plan.md) | UX Features |
| [7.1](plans/7-1-deployment-plan.md) | Testing & Deployment |

---

## 📄 Requirements Documents

- [PRD](requirements/Election_War_PRD.md) - Product Requirements
- [Tech Spec](requirements/Election_War_Tech_Spec.md) - Technical Specification
- [Clarified](requirements/Election_War_Clarified.md) - Clarified Requirements
- [Roadmap](requirements/Election_War_Roadmap.md) - Development Roadmap

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This game is for **entertainment purposes only**. It is not affiliated with, endorsed by, or connected to:
- The Election Commission of Thailand (กกต.)
- Any political party
- The Thai government

The game does not influence, predict, or represent actual election outcomes.

---

## 👥 Credits

- **Developer:** [RawinLab](https://github.com/rawinlab)
- **Map Data:** [cvibhagool/thailand-map](https://github.com/cvibhagool/thailand-map)
- **Province Data:** [thailand-geography-data](https://github.com/thailand-geography-data)
- **Population Data:** กรมการปกครอง (Department of Provincial Administration)

---

**Game ends: February 8, 2026 at 23:59 ICT (Thailand Election Day)**

🗳️ **May the best party win!** 🇹🇭
