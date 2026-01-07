# ElectionWars Development Plans

## Overview
This directory contains development plans for the ElectionWars project - a real-time political clicker game for Thailand's 2026 election.

## Module Structure

### Phase 1: Infrastructure (Days 1-2)
| Module | Name | Priority | Dependencies |
|--------|------|----------|--------------|
| **1.1** | [Project Setup](1-1-project-setup-plan.md) | CRITICAL | None |

### Phase 2: Database (Days 3-5)
| Module | Name | Priority | Dependencies |
|--------|------|----------|--------------|
| **2.1** | [Database Tables](2-1-database-tables-plan.md) | CRITICAL | 1.1 |
| **2.2** | [Database Functions](2-2-database-functions-plan.md) | CRITICAL | 2.1 |
| **2.3** | [RLS & Seed Data](2-3-database-rls-seed-plan.md) | CRITICAL | 2.1, 2.2 |

### Phase 3: Core Features (Week 1-2)
| Module | Name | Priority | Dependencies |
|--------|------|----------|--------------|
| **3.1** | [Authentication](3-1-authentication-plan.md) | HIGH | 1.1, 2.x |
| **4.1** | [Thailand Map](4-1-thailand-map-plan.md) | HIGH | 1.1, 2.3 |
| **5.1** | [Realtime & Leaderboard](5-1-realtime-leaderboard-plan.md) | HIGH | 2.x, 4.1 |

### Phase 4: Polish (Week 2-3)
| Module | Name | Priority | Dependencies |
|--------|------|----------|--------------|
| **6.1** | [UX Features](6-1-ux-notifications-plan.md) | MEDIUM | 4.1, 5.1 |

### Phase 5: Deployment (Week 3-4)
| Module | Name | Priority | Dependencies |
|--------|------|----------|--------------|
| **7.1** | [Testing & Deployment](7-1-deployment-plan.md) | HIGH | All |

## Implementation Order

```
Week 1:
  Day 1-2: 1.1 Project Setup → 2.1 Tables → 2.2 Functions
  Day 3-4: 2.3 RLS/Seed → 3.1 Authentication
  Day 5-7: 4.1 Thailand Map

Week 2:
  Day 8-9: 5.1 Realtime & Leaderboard
  Day 10-12: 6.1 UX Features (Notifications, Language)

Week 3:
  Day 13-14: 7.1 Testing
  Day 15-16: 7.1 Firebase Deployment
  Day 17+: Soft launch, bug fixes
```

## Tech Stack
- **Frontend:** Vite + Vanilla JS
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Hosting:** Firebase Hosting
- **Testing:** Vitest + Playwright
- **Monetization:** Google AdSense

## Key Features
1. **Shield System** - Population-based province defense
2. **Real-time Sync** - Supabase Realtime subscriptions
3. **77 Provinces** - Interactive Thailand SVG map
4. **Bilingual** - Thai/English support
5. **Click Feedback** - Animation + sound + floating +1

## Commands

```bash
# Development
npm run dev

# Testing
npm run test:unit
npm run test:e2e

# Deployment
npm run build
firebase deploy
```

## Related Documents
- [PRD](../requirements/Election_War_PRD.md)
- [Tech Spec](../requirements/Election_War_Tech_Spec.md)
- [Clarified Requirements](../requirements/Election_War_Clarified.md)
- [Roadmap](../requirements/Election_War_Roadmap.md)
