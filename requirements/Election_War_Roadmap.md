# Election War - Feature Roadmap & Development Checklist

**Version:** 2.0 (Supabase Edition)
**Date:** January 7, 2026
**Estimated Total Timeline:** 5-7 weeks (accelerated with Supabase)

---

## PHASE 1: MVP (Minimum Viable Product)
**Target Launch:** Mid-Late October 2025 (14+ weeks before election)
**Duration:** 4-5 weeks

### MVP Scope (Must Have)
- [ ] Party selection screen
- [ ] Interactive Thailand map (77 provinces)
- [ ] Real-time click-to-vote mechanic
- [ ] Supabase Realtime for live updates
- [ ] Party leaderboard (provinces controlled)
- [ ] Province color changes (real-time)
- [ ] Mobile responsive UI
- [ ] Game timer (countdown to 8 Feb 2026)
- [ ] Player join/game state sync
- [ ] Basic error handling & reconnection

### MVP Technical Components

#### Supabase Setup (Day 1-3)
- [ ] Create Supabase project
- [ ] Configure authentication (anonymous sessions)
- [ ] Create database schema:
  - `parties` table
  - `provinces` table
  - `province_state` table
  - `players` table
  - `game_state` table
- [ ] Create database functions:
  - `click_province()` - main click handler with rate limiting
  - `join_game()` - player registration
  - `get_leaderboard()` - party rankings
- [ ] Set up Row Level Security (RLS) policies
- [ ] Enable Realtime for province_state and game_state tables
- [ ] Test Supabase connection from browser

**Estimated Story Points:** 8-10 SP

#### Frontend (Week 1-2)
- [ ] Project setup (Vite + vanilla JS or Alpine.js)
- [ ] Supabase client integration
- [ ] HTML structure (party selector, map container)
- [ ] SVG map rendering (77 provinces)
- [ ] CSS styling (responsive, mobile-first)
- [ ] Party selector UI with official colors
- [ ] Province click event handlers
- [ ] Real-time subscription setup
- [ ] Province color updates on realtime events
- [ ] Leaderboard display component
- [ ] Timer countdown component
- [ ] Player stats display
- [ ] Connection status indicator
- [ ] Error handling & reconnection logic

**Estimated Story Points:** 20-25 SP

#### Data & Content (Week 2)
- [ ] Seed database with 57 Thai parties (SQL script)
- [ ] **Download map data from GitHub:**
  - [ ] `thailand-provinces.topojson` from [cvibhagool/thailand-map](https://github.com/cvibhagool/thailand-map)
  - [ ] `provinces.json` from [thailand-geography-data](https://github.com/thailand-geography-data/thailand-geography-json)
- [ ] **Create province name mapping script:**
  - [ ] Map TopoJSON `NAME_1` (English) → Thai names from `provinces.json`
  - [ ] Generate `seeds/province_mapping.sql` with all 77 provinces
- [ ] **Convert TopoJSON to SVG:**
  - [ ] Install dependencies: `topojson-client`, `d3-geo`
  - [ ] Run `scripts/convert-map.js` to generate `thailand-map.svg`
  - [ ] Add `data-province-id`, `data-name-th`, `data-name-en` attributes to paths
- [ ] Import province data (names, regions) into Supabase
- [ ] Set official party colors & patterns
- [ ] Initialize province_state for all 77 provinces
- [ ] Initialize game_state singleton

**Estimated Story Points:** 8-10 SP

#### Testing (Week 3)
- [ ] Unit tests for database functions (pgTAP or Vitest)
- [ ] Integration tests (Supabase client operations)
- [ ] E2E tests with Playwright
- [ ] Real-time subscription tests
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] Performance testing (concurrent users)

**Estimated Story Points:** 8-12 SP

#### Deployment & Launch (Week 3-4)
- [ ] Deploy frontend to Firebase Hosting (`firebase deploy`)
- [ ] Configure environment variables (.env.production)
- [ ] Set up GitHub Actions CI/CD for Firebase
- [ ] Configure custom domain (optional)
- [ ] Check Google AdSense approval status
- [ ] If approved: Add AdSense code to production
- [ ] Add cookie consent banner (PDPA compliance)
- [ ] Soft launch (invite-only, 50-100 players)
- [ ] Monitor Supabase dashboard for issues
- [ ] Monitor Firebase console for errors
- [ ] Fix any bugs found
- [ ] Public launch announcement
- [ ] Monitor AdSense revenue dashboard

**Estimated Story Points:** 6-8 SP

**Phase 1 Total:** 47-63 Story Points (~4-5 weeks)

---

## PHASE 2: Post-Launch Enhancements
**Target:** Week 5-6 (after MVP launch)
**Duration:** 1-2 weeks

### Features
- [ ] **Individual Player Leaderboard**
  - Top 100 clickers globally (Supabase query with ORDER BY total_clicks)
  - Rank within party
  - Real-time rank updates via Realtime subscription

- [ ] **Province Info Modal**
  - Click province → Show details:
    - Current controlling party
    - Total clicks per party (from click_counts JSONB)
    - Click breakdown pie chart
    - Region info

- [ ] **Player Profile Page**
  - Nickname, party affiliation
  - Total clicks, ranking
  - Join date
  - (Store in players table, query on demand)

- [ ] **Toast Notifications**
  - In-game notifications:
    - "Your party took Nakhon Pathom!"
    - "Province flipped to [Party]!"
  - Use Realtime subscription to trigger

- [ ] **Province Flip History** (Optional)
  - Add `province_history` table for tracking flips
  - Trigger on controlling_party_id change
  - Display timeline in UI

**Estimated Story Points:** 15-20 SP

---

## PHASE 3: Advanced Features (Optional)
**Target:** Week 7+ (if time permits before election)
**Duration:** 2-3 weeks (optional, based on user feedback)

### Features
- [ ] **Achievement Badges**
  - "First to 10K clicks"
  - "Province Conquerer" (took 5+ provinces for your party)
  - "Loyalty Badge" (stayed with one party whole game)
  - Store in `player_achievements` table
  - Display on profile

- [ ] **Share-to-Social Features**
  - Generate shareable image with stats
  - "I clicked X times for [Party]!" template
  - Share buttons (Twitter, Facebook, LINE)

- [ ] **Simple Analytics Dashboard**
  - Admin page (protected by Supabase RLS)
  - Party performance graphs (Chart.js)
  - Click velocity over time
  - Use Supabase SQL queries for data

- [ ] **Anti-Cheat Enhancements**
  - Add `is_flagged` column to players
  - Database trigger for suspicious patterns
  - Manual review via admin dashboard

- [ ] **Real Election Poll Comparison** (Optional)
  - Static data embed of poll results
  - Side-by-side comparison: "Game vs. Polls"

**Estimated Story Points:** 20-30 SP (optional features)

### NOT Implementing (Scope Cut)
- ~~Mobile App~~ - Web app is mobile-responsive, sufficient for MVP
- ~~Party Alliances~~ - Adds complexity, defer to post-election if popular
- ~~Push Notifications~~ - Browser notifications are complex, skip for now

---

## DEVELOPMENT TEAM & RESOURCE ALLOCATION

### Recommended Team Structure (Supabase - Minimal)
| Role | Count | Effort (hrs/week) | Notes |
|------|-------|------------------|-------|
| **Full-Stack Developer** | 1-2 | 40 each | Frontend + Supabase integration |
| **Designer** (optional) | 1 | 10-20 | UI/UX polish, party colors |
| **QA** (can be same person) | 1 | 10 | Testing, bug verification |
| **Total** | 1-2 | 50-80 hrs/week | ~1-2 FTE |

**Why so small?**
- No backend engineers needed - Supabase handles it
- No DevOps needed - Vercel + Supabase are fully managed
- Database functions replace API development
- Real-time is built-in, no Socket.io expertise needed

**Cost Estimate:**
- Solo developer: $5K-10K total project
- Small team (2): $10K-15K total project
- Freelance rate: ~$50-100/hr × 100-150 hours

---

## DEVELOPMENT CHECKLIST - PHASE 1 MVP (Supabase)

### Day 1-2: Project Setup
- [ ] Create GitHub repository
- [ ] Initialize Vite project (`npm create vite@latest`)
- [ ] Install dependencies:
  - `@supabase/supabase-js`
  - `vite` (dev)
  - `firebase-tools` (dev, global)
- [ ] Create Supabase project at supabase.com
- [ ] Copy Supabase URL and anon key to `.env.local`
- [ ] Test Supabase connection from browser console
- [ ] Create Firebase project at console.firebase.google.com
- [ ] Initialize Firebase Hosting (`firebase init hosting`)
- [ ] Apply for Google AdSense (early - takes time for approval)

### Day 3-5: Supabase Database
- [ ] Create `parties` table with schema
- [ ] Create `provinces` table with schema
- [ ] Create `province_state` table
- [ ] Create `players` table
- [ ] Create `game_state` table (singleton)
- [ ] Write `click_province()` function
- [ ] Write `join_game()` function
- [ ] Write `get_leaderboard()` function
- [ ] Set up RLS policies (public read, function write)
- [ ] Enable Realtime on `province_state` and `game_state`
- [ ] Seed parties data (57 parties)
- [ ] Seed provinces data (77 provinces)
- [ ] Initialize `province_state` for all provinces
- [ ] Initialize `game_state` row

### Week 1: Frontend Core
- [ ] Create HTML structure (`index.html`)
- [ ] Create CSS styles (responsive, mobile-first)
- [ ] Create Supabase client module (`src/supabase.js`)
- [ ] Implement party selector screen
- [ ] Style party cards with official colors
- [ ] Add nickname input field
- [ ] Implement `joinGame()` function
- [ ] Store player session in localStorage
- [ ] Add ad container placeholder at bottom (for future AdSense)
- [ ] Add Privacy Policy page (required for AdSense)

### Week 1-2: Map Implementation
- [ ] Obtain/create Thailand SVG map
- [ ] Add province IDs to SVG paths (`data-province-id`)
- [ ] Embed SVG in HTML
- [ ] Make map responsive (viewBox)
- [ ] Add click handlers to provinces
- [ ] Implement `handleProvinceClick()` function
- [ ] Add visual click feedback (animation)
- [ ] Color provinces based on controlling party

### Week 2: Real-time Integration
- [ ] Set up Supabase Realtime subscription
- [ ] Subscribe to `province_state` changes
- [ ] Update map colors on realtime events
- [ ] Subscribe to `game_state` changes
- [ ] Display global stats (total clicks, players)
- [ ] Implement countdown timer to Feb 8, 2026
- [ ] Add connection status indicator
- [ ] Handle reconnection on disconnect

### Week 2-3: Leaderboard & Polish
- [ ] Implement leaderboard component
- [ ] Query `get_leaderboard()` function
- [ ] Display party rankings with colors
- [ ] Auto-refresh leaderboard (or use Realtime)
- [ ] Add player stats display (your clicks, rank)
- [ ] Mobile responsive testing
- [ ] Fix any UI bugs
- [ ] Optimize for performance

### Week 3: Testing
- [ ] Write Vitest tests for Supabase functions
- [ ] Test rate limiting behavior
- [ ] Test province flipping logic
- [ ] Browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Test with multiple simultaneous users
- [ ] Fix any bugs found

### Week 3-4: Deployment & Launch
- [ ] Configure production environment variables
- [ ] Build production bundle (`npm run build`)
- [ ] Deploy to Firebase Hosting (`firebase deploy`)
- [ ] Test production deployment
- [ ] Set up custom domain in Firebase (optional)
- [ ] Upgrade Supabase to Pro plan
- [ ] Check Google AdSense approval status
- [ ] If approved: Add AdSense code to production
- [ ] Add cookie consent banner (PDPA compliance)
- [ ] Soft launch with 50-100 test users
- [ ] Monitor Supabase dashboard
- [ ] Monitor Firebase console
- [ ] Fix any production issues
- [ ] Public launch announcement
- [ ] Share on social media
- [ ] Monitor AdSense revenue dashboard

---

## TECHNICAL DEBT & RISK MITIGATION

### Known Risks (Supabase Architecture)
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Supabase Realtime connection limits** | Medium | High | Monitor dashboard, upgrade to Team plan for election day |
| **Database function performance** | Medium | Medium | Optimize PL/pgSQL, add proper indexes, test with load |
| **SVG rendering performance on mobile** | Medium | Medium | Optimize SVG file size, test on low-end devices |
| **Bot/cheat attacks** | High | Medium | Rate limiting in DB function, flag suspicious accounts |
| **Supabase service outage** | Low | High | Have communication plan, no self-hosting fallback |
| **Bandwidth limits exceeded** | Low | Medium | Monitor usage, upgrade plan proactively |

### Technical Debt to Address (Post-Launch)
- [ ] Add more comprehensive error handling in UI
- [ ] Implement offline indicator and queue
- [ ] Add database query caching (if needed)
- [ ] Refactor to component-based framework if codebase grows
- [ ] Add comprehensive analytics tracking
- [ ] Consider Edge Functions for complex rate limiting

---

## TESTING STRATEGY - PHASE 1 (Supabase)

### Database Function Testing
```bash
# Using Supabase CLI with pgTAP
supabase test db

# Or via Vitest with service role key
npm test
```

**Coverage targets:**
- `click_province()` function: 90%+
- `join_game()` function: 90%+
- Rate limiting logic: 95%+

### Integration Testing
```bash
npm run test:integration

Tests:
- Full game flow (join → click → flip)
- Realtime subscription receives updates
- Multiple concurrent clicks
- Rate limiting enforcement
```

### E2E Testing (Playwright)
```bash
npm run test:e2e

Scenarios:
- Player joins game successfully
- Click updates province color
- Realtime sync between two browsers
- Leaderboard updates correctly
```

### Browser Testing
| Browser | Desktop | Mobile | Priority |
|---------|---------|--------|----------|
| Chrome | ✓ | ✓ | Required |
| Firefox | ✓ | - | Required |
| Safari | ✓ | ✓ | Required |
| Edge | ✓ | - | Nice-to-have |
| Mobile Chrome | - | ✓ | Required |
| Mobile Safari | - | ✓ | Required |

---

## GO/NO-GO DECISION POINTS

### Pre-MVP Launch Checklist
- [ ] Supabase functions working correctly in production
- [ ] Realtime subscriptions stable (no dropped connections)
- [ ] Frontend loads in <2 seconds on 4G
- [ ] Database queries responsive (<100ms)
- [ ] Rate limiting working correctly
- [ ] RLS policies tested and secure
- [ ] Mobile responsive UI verified
- [ ] Basic tests passing
- [ ] **GO/NO-GO DECISION:** Proceed to public launch? ☐ YES ☐ NO

### Pre-Election Day Checklist (Jan 30, 2026)
- [ ] Game has active players (target: 10K+)
- [ ] Supabase upgraded to Team plan
- [ ] Monitor realtime connection counts
- [ ] Database backups verified
- [ ] Supabase dashboard alerts configured
- [ ] Know how to contact Supabase support
- [ ] Phase 2 features stable (if implemented)
- [ ] **GO/NO-GO DECISION:** Ready for election day surge? ☐ YES ☐ NO

---

## SUCCESS CRITERIA

### Business Metrics (by Feb 8, 2026)
- [ ] 50K+ total players joined
- [ ] 10K+ daily active users (DAU) on election day
- [ ] 100M+ total clicks (cumulative)
- [ ] 99%+ uptime over entire game period
- [ ] No major outages on election day
- [ ] Positive social media mentions

### Technical Metrics
- [ ] Realtime update latency: <500ms (typical)
- [ ] Click RPC latency: <200ms (p95)
- [ ] Supabase connection stability: >99%
- [ ] Database query time: <100ms (p95)
- [ ] Frontend load time: <2 seconds

### User Experience Metrics
- [ ] Average session duration: >5 minutes
- [ ] Return rate: >30%
- [ ] Mobile traffic: >60% of total (Thailand is mobile-first)
- [ ] No complaints about disconnections
- [ ] Organic social media shares

---

## DEPLOYMENT CHECKLIST - LAUNCH DAY

### 24 Hours Before Launch
- [ ] Supabase production project ready
- [ ] All database migrations applied
- [ ] Seed data verified (parties, provinces)
- [ ] Firebase Hosting deployment tested
- [ ] Environment variables configured
- [ ] Custom domain working (if applicable)
- [ ] Google AdSense approved and code added
- [ ] Privacy Policy page live
- [ ] Cookie consent banner working
- [ ] Social media posts drafted

### Launch Time (T=0)
- [ ] Verify Supabase dashboard shows healthy status
- [ ] Verify Firebase Hosting is serving correctly
- [ ] Test one click from production URL
- [ ] Verify Realtime is working
- [ ] All provinces showing as neutral (gray)
- [ ] Game timer counting down correctly
- [ ] Ads loading correctly (if AdSense approved)
- [ ] Share launch announcement

### Post-Launch (First 24 Hours)
- [ ] Monitor Supabase dashboard every few hours
- [ ] Monitor Firebase console for errors
- [ ] Check AdSense revenue dashboard
- [ ] Check for any error logs
- [ ] Respond to player feedback
- [ ] Fix any critical bugs immediately
- [ ] Celebrate launch! 🎉

---

## APPENDIX: Simplified Timeline

```
Week 1: Setup + Database + Basic Frontend
Week 2: Map + Realtime + Leaderboard
Week 3: Testing + Polish + Bug fixes
Week 4: Deployment + Soft launch + Public launch

Total: 4 weeks to MVP (vs. 8-10 weeks traditional)
```

---

## Document End

**Next Actions:**
1. Review & approve PRD + Tech Spec
2. Create Supabase project
3. Create Firebase project
4. Apply for Google AdSense (do early!)
5. Set up GitHub repository
6. Begin Day 1 tasks
7. Deploy first version within 1 week

**Questions? Gaps?**
- Feature scope clarity? → Adjust PRD
- Technical concerns? → Refine Tech Spec
- Supabase questions? → Check docs.supabase.com
- Firebase questions? → Check firebase.google.com/docs
- AdSense questions? → Check support.google.com/adsense
- Budget concerns? → Start with Free tiers, ads can offset costs!

**Ready to build with Supabase + Firebase + AdSense!** 🚀💰
