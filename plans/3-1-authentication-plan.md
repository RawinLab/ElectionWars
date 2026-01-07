# Plan: Authentication & Player Management (Module 3.1)

## Module Information
- **Module:** 3.1
- **Name:** Authentication & Player Management
- **Dependencies:** 1.1 (Project Setup), 2.1-2.3 (Database)
- **Priority:** HIGH
- **Estimated:** 1 day

---

## Features

### 3.1.1 Anonymous Authentication
Supabase anonymous auth for quick game entry

### 3.1.2 Party Selection Screen
Choose from 57 parties with visual selector

### 3.1.3 Player Registration (join_game)
Create player profile with nickname and party

### 3.1.4 Session Persistence
Store player session in localStorage

### 3.1.5 Party Change (change_party)
Switch party with 24hr cooldown

---

## Technical Design

### Authentication Flow
```
1. User opens game
   ↓
2. Check localStorage for existing session
   ↓
3a. If exists: Verify session with Supabase → Go to game
3b. If not: Show party selector
   ↓
4. User selects party, enters nickname
   ↓
5. Create anonymous auth session
   ↓
6. Call join_game() RPC
   ↓
7. Store player data in localStorage
   ↓
8. Go to game screen
```

### Types/Interfaces
```typescript
interface Player {
  id: string;           // UUID
  auth_id: string;      // Supabase auth UUID
  party_id: number;
  nickname: string;
  total_clicks: number;
  party_changed_at: string | null;
}

interface Party {
  id: number;
  name_thai: string;
  name_english: string;
  ballot_number: number | null;
  official_color: string;
  pattern_type: string;
  leader_name: string | null;
}

interface GameSession {
  player: Player;
  party: Party;
  created_at: string;
}
```

### Key Functions

#### initAuth()
```javascript
// src/lib/auth.js
export async function initAuth() {
  // Check localStorage first
  const session = localStorage.getItem('electionwar_session');
  if (session) {
    const { player, party } = JSON.parse(session);
    // Verify session is still valid
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (authSession) {
      return { player, party, isNew: false };
    }
  }
  return null;
}
```

#### createAnonymousSession()
```javascript
export async function createAnonymousSession() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}
```

#### joinGame()
```javascript
export async function joinGame(partyId, nickname) {
  // Create anonymous session first
  const authSession = await createAnonymousSession();

  // Call join_game RPC
  const { data, error } = await supabase.rpc('join_game', {
    p_auth_id: authSession.user.id,
    p_party_id: partyId,
    p_nickname: nickname
  });

  if (error) throw error;

  // Get full player and party data
  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', data.player_id)
    .single();

  const { data: party } = await supabase
    .from('parties')
    .select('*')
    .eq('id', partyId)
    .single();

  // Store in localStorage
  const session = { player, party, created_at: new Date().toISOString() };
  localStorage.setItem('electionwar_session', JSON.stringify(session));

  return session;
}
```

#### changeParty()
```javascript
export async function changeParty(playerId, newPartyId) {
  const { data, error } = await supabase.rpc('change_party', {
    p_player_id: playerId,
    p_new_party_id: newPartyId
  });

  if (error) throw error;

  if (!data.success) {
    throw new Error(data.error);
  }

  // Update localStorage
  const session = JSON.parse(localStorage.getItem('electionwar_session'));
  const { data: newParty } = await supabase
    .from('parties')
    .select('*')
    .eq('id', newPartyId)
    .single();

  session.party = newParty;
  session.player.party_id = newPartyId;
  session.player.total_clicks = 0;
  session.player.party_changed_at = new Date().toISOString();
  localStorage.setItem('electionwar_session', JSON.stringify(session));

  return data;
}
```

### Nickname Validation
```javascript
const NICKNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[\u0E00-\u0E7Fa-zA-Z0-9_\s]+$/  // Thai, English, numbers, underscore, space
};

export function validateNickname(nickname) {
  if (nickname.length < NICKNAME_RULES.minLength) {
    return { valid: false, error: 'Nickname must be at least 3 characters' };
  }
  if (nickname.length > NICKNAME_RULES.maxLength) {
    return { valid: false, error: 'Nickname must be at most 20 characters' };
  }
  if (!NICKNAME_RULES.pattern.test(nickname)) {
    return { valid: false, error: 'Nickname can only contain Thai, English, numbers, underscore, and space' };
  }
  return { valid: true };
}
```

---

## UI Components

### Party Selector Screen (HTML)
```html
<div id="party-selector" class="screen">
  <h1>เลือกพรรคของคุณ / Choose Your Party</h1>

  <div id="party-grid" class="party-grid">
    <!-- Dynamically populated -->
  </div>

  <div id="selected-party" class="hidden">
    <div id="party-preview"></div>
    <input type="text" id="nickname-input" placeholder="ชื่อเล่น / Nickname" maxlength="20">
    <p id="nickname-error" class="error hidden"></p>
    <button id="join-button">เข้าร่วมเกม / Join Game</button>
  </div>
</div>
```

### Party Card Component
```javascript
function createPartyCard(party) {
  return `
    <div class="party-card" data-party-id="${party.id}" style="--party-color: ${party.official_color}">
      <div class="party-color" style="background: ${party.official_color}"></div>
      <div class="party-info">
        <h3>${party.name_thai}</h3>
        <p>${party.name_english}</p>
        ${party.leader_name ? `<small>${party.leader_name}</small>` : ''}
      </div>
    </div>
  `;
}
```

---

## Implementation Steps

### Step 1: Create Auth Module
1. Create `src/lib/auth.js`
2. Implement initAuth, createAnonymousSession, joinGame, changeParty
3. Add nickname validation

### Step 2: Create Party Selector UI
1. Create `src/components/PartySelector.js`
2. Fetch parties from Supabase
3. Render party cards
4. Handle party selection

### Step 3: Implement Join Flow
1. On party select → show nickname input
2. Validate nickname
3. Call joinGame()
4. Navigate to game screen

### Step 4: Session Persistence
1. Store session in localStorage
2. Check on page load
3. Auto-login if valid session exists

### Step 5: Party Change UI
1. Add "Change Party" button in game
2. Show cooldown timer if applicable
3. Confirm before changing

---

## Test Cases

### Unit Tests
- [ ] validateNickname rejects < 3 chars
- [ ] validateNickname rejects > 20 chars
- [ ] validateNickname accepts Thai characters
- [ ] validateNickname accepts English characters
- [ ] validateNickname rejects special characters

### Integration Tests
- [ ] Can create anonymous session
- [ ] Can call join_game RPC
- [ ] Session stored in localStorage
- [ ] Page reload preserves session
- [ ] Party change respects cooldown

### E2E Tests
- [ ] Full flow: select party → enter nickname → join game
- [ ] Cannot join with invalid nickname
- [ ] Cannot change party within 24 hours

---

## Acceptance Criteria
- [ ] Anonymous auth working
- [ ] Party selector shows all 57 parties
- [ ] Nickname validation works
- [ ] Player created in database
- [ ] Session persisted in localStorage
- [ ] Party change with cooldown works
