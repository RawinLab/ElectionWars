# Election War - Clarified Requirements

**Version:** 1.0
**Clarified on:** January 7, 2026
**Clarified by:** /project:clarify

---

## Original Requirements Summary

ดู PRD, Tech Spec, และ Roadmap ฉบับเต็มที่:
- `Election_War_PRD.md`
- `Election_War_Tech_Spec.md`
- `Election_War_Roadmap.md`

---

## Clarifications Made

### Q1: Business Logic - Shield System (CRITICAL)
**Question:** เมื่อสองพรรคมี clicks เท่ากัน (tie) ในจังหวัดเดียวกัน ควรจัดการอย่างไร?

**Answer:** ใช้ระบบ Shield (เหมือน Clickwars)

**Impact - New Game Mechanic:**
```
Shield System:
┌─────────────────────────────────────────────────────┐
│  Province Control Flow                               │
├─────────────────────────────────────────────────────┤
│  1. Neutral province มี shield เริ่มต้น 50% ของ MAX   │
│  2. ทุกพรรค click → ลด shield                        │
│  3. เมื่อ shield = 0 → พรรคที่ click มากสุดได้ยึด      │
│  4. หลังยึด shield เริ่มที่ 5% ของ MAX                │
│  5. พรรคเจ้าของ click → เพิ่ม shield (max = MAX)     │
│  6. พรรคอื่น click → ลด shield                       │
│  7. เมื่อ shield = 0 อีกครั้ง → พรรคที่โจมตีมากสุดยึด   │
└─────────────────────────────────────────────────────┘
```

---

### Q2: Business Logic - Shield Configuration
**Question:** Shield ควรมีค่า MAX เท่าไหร่?

**Answer:** Shield MAX = ประชากรจังหวัด / 10

**Impact - Dynamic Shield per Province:**
```javascript
// Shield calculation
shield_max = province_population / 10
shield_start_neutral = shield_max * 0.50  // 50% for neutral
shield_start_captured = shield_max * 0.05 // 5% after capture
```

**Example Values:**
| Province | Population | Shield MAX | Neutral Start (50%) | Captured Start (5%) |
|----------|------------|------------|---------------------|---------------------|
| กรุงเทพฯ | 5,500,000 | 550,000 | 275,000 | 27,500 |
| เชียงใหม่ | 1,800,000 | 180,000 | 90,000 | 9,000 |
| สมุทรสงคราม | 193,000 | 19,300 | 9,650 | 965 |

**Data Source:** Real population data from กรมการปกครอง (Department of Provincial Administration)

---

### Q3: Business Logic - First Capture Mechanic
**Question:** Neutral province เมื่อ shield หมด ใครได้ยึด?

**Answer:** พรรคที่มี clicks สูงสุด (Highest attacker wins)

**Impact:**
- ระบบต้องนับ attack clicks ของแต่ละพรรคระหว่าง neutral phase
- เมื่อ shield = 0 → ดูว่าพรรคไหน click มากที่สุด → ได้ยึด
- หลังยึด → reset attack clicks ทั้งหมดเป็น 0

---

### Q4: Business Logic - Province Flip Mechanic
**Question:** เมื่อ shield ของจังหวัดที่มีเจ้าของหมด ใครได้?

**Answer:** พรรคที่โจมตีมากที่สุดได้ยึดทันที

**Impact:**
- Attacker with highest clicks captures immediately
- New shield starts at 5% of MAX
- All attack counts reset to 0

---

### Q5: Business Logic - Game End
**Question:** เมื่อเกมสิ้นสุด (8 ก.พ. 2026 23:59) ควรทำอย่างไร?

**Answer:** Freeze + Show Results

**Impact:**
```javascript
// Game end behavior
if (currentTime >= game_end_time) {
  game_status = 'ended'
  // Disable all clicks
  // Show final results overlay
  // Display: provinces per party, total clicks, top players
  // Map still viewable but not interactive
}
```

---

### Q6: Authorization - Party Change
**Question:** ผู้เล่นสามารถเปลี่ยนพรรคได้หรือไม่?

**Answer:** Allow with cooldown (24 hours) + Reset clicks to 0

**Impact:**
```sql
-- New columns in players table
ALTER TABLE players ADD COLUMN party_changed_at TIMESTAMPTZ DEFAULT NULL;

-- Party change rules:
-- 1. Check if 24 hours passed since last change
-- 2. Reset total_clicks to 0
-- 3. Update party_id
-- 4. Update party_changed_at to NOW()
```

---

### Q7: UX - Language Support
**Question:** ภาษาที่ใช้ในเกมควรเป็นแบบไหน?

**Answer:** Thai + English (Bilingual)

**Impact:**
- UI text ต้องมีทั้ง 2 ภาษา
- Province names: แสดงภาษาไทยเป็นหลัก (English as tooltip)
- Party names: ภาษาไทยเป็นหลัก
- System messages: ตาม browser language preference
- Add language toggle button (TH/EN)

---

### Q8: Validation - Nickname Rules
**Question:** Nickname ควรมีกฎการ validation อย่างไร?

**Answer:** Simple: 3-20 chars

**Impact:**
```javascript
// Nickname validation
const NICKNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  allowedChars: /^[\u0E00-\u0E7Fa-zA-Z0-9_\s]+$/,  // Thai, English, numbers, underscore, space
  noProfanityFilter: true  // Not implementing profanity filter
}
```

---

### Q9: UX - Click Feedback
**Question:** การ click feedback ควรเป็นแบบไหน?

**Answer:** Multiple feedback types (multiselect)
- Visual animation on province
- +1 floating number
- Click sound effect (with mute button)

**Impact:**
```css
/* Province click animation */
.province.clicked {
  animation: pulse 0.2s ease-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* +1 floating animation */
.click-number {
  animation: float-up 0.5s ease-out forwards;
}
```

```javascript
// Sound effect
const clickSound = new Audio('/sounds/click.mp3')
clickSound.volume = 0.3

// User preference
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false'
```

---

### Q10: UX - Notifications
**Question:** ต้องการแสดง notifications แบบไหนบ้าง?

**Answer:** Multiple notification types (multiselect)
- Province flipped toast
- Your party won toast
- Shield low warning (<20%)

**Impact:**
```javascript
// Toast notification system
function showToast(type, message) {
  // Types: 'flip', 'win', 'warning'
  // Duration: 3 seconds
  // Position: top-right
}

// Notification triggers:
// 1. Province flip: "เชียงใหม่ ถูกยึดโดย พรรคเพื่อไทย!"
// 2. Party win: "พรรคของคุณยึด นครปฐม สำเร็จ!"
// 3. Shield warning: "เตือน! สงขลา shield เหลือ 15%"
```

---

## New Database Schema Additions

```sql
-- Updated province_state table
ALTER TABLE province_state ADD COLUMN shield_current BIGINT DEFAULT 0;
ALTER TABLE province_state ADD COLUMN shield_max BIGINT NOT NULL;
ALTER TABLE province_state ADD COLUMN attack_counts JSONB DEFAULT '{}';

-- Add population to provinces
ALTER TABLE provinces ADD COLUMN population INTEGER NOT NULL DEFAULT 100000;

-- Updated players table
ALTER TABLE players ADD COLUMN party_changed_at TIMESTAMPTZ DEFAULT NULL;
```

---

## Updated click_province Function

```sql
CREATE OR REPLACE FUNCTION click_province(
  p_player_id UUID,
  p_province_id INTEGER,
  p_party_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_shield BIGINT;
  v_shield_max BIGINT;
  v_controlling_party INTEGER;
  v_attack_counts JSONB;
  v_new_attack_count BIGINT;
  v_max_attacker_id INTEGER;
  v_max_attack_count BIGINT;
BEGIN
  -- Get current province state
  SELECT shield_current, shield_max, controlling_party_id, attack_counts
  INTO v_current_shield, v_shield_max, v_controlling_party, v_attack_counts
  FROM province_state WHERE province_id = p_province_id;

  -- Case 1: Player's party controls this province → Add shield
  IF v_controlling_party = p_party_id THEN
    v_current_shield := LEAST(v_current_shield + 1, v_shield_max);

    UPDATE province_state
    SET shield_current = v_current_shield,
        updated_at = NOW()
    WHERE province_id = p_province_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'defend',
      'shield', v_current_shield,
      'shield_max', v_shield_max
    );
  END IF;

  -- Case 2: Attacking → Reduce shield
  v_current_shield := GREATEST(v_current_shield - 1, 0);

  -- Track attack count
  v_new_attack_count := COALESCE((v_attack_counts->>p_party_id::text)::bigint, 0) + 1;
  v_attack_counts := COALESCE(v_attack_counts, '{}'::jsonb) ||
                     jsonb_build_object(p_party_id::text, v_new_attack_count);

  -- Case 3: Shield depleted → Determine new owner
  IF v_current_shield = 0 THEN
    -- Find highest attacker
    SELECT key::integer, value::bigint INTO v_max_attacker_id, v_max_attack_count
    FROM jsonb_each_text(v_attack_counts)
    ORDER BY value::bigint DESC
    LIMIT 1;

    -- Transfer ownership
    UPDATE province_state
    SET controlling_party_id = v_max_attacker_id,
        shield_current = (v_shield_max * 0.05)::bigint,  -- 5% of max
        attack_counts = '{}'::jsonb,  -- Reset attack counts
        updated_at = NOW()
    WHERE province_id = p_province_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'capture',
      'new_owner', v_max_attacker_id,
      'shield', (v_shield_max * 0.05)::bigint
    );
  END IF;

  -- Update attack counts only
  UPDATE province_state
  SET shield_current = v_current_shield,
      attack_counts = v_attack_counts,
      updated_at = NOW()
  WHERE province_id = p_province_id;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'attack',
    'shield', v_current_shield,
    'your_attacks', v_new_attack_count
  );
END;
$$;
```

---

## Assumptions Made

Based on clarifications, these assumptions were made:

1. **Population data** - Will use official data from กรมการปกครอง (2024/2025 census)
2. **Sound effect** - Single click sound, user can mute via settings
3. **Toast position** - Top-right corner, non-intrusive
4. **Shield display** - Show as progress bar on province hover/click
5. **Attack counts** - Not displayed to users, only used internally for capture logic
6. **Party change** - Once per 24 hours maximum, no limit on total changes
7. **Language toggle** - Remember preference in localStorage

---

## Ambiguities Remaining (Deferred)

These were not critical for initial implementation:

1. **Admin Dashboard** - How to manage game state, view analytics? (Phase 2)
2. **Bot Detection** - Advanced anti-cheat measures? (Phase 2)
3. **Offline Mode** - Queue clicks when offline? (Nice-to-have)
4. **Push Notifications** - Browser notifications for major events? (Phase 2)
5. **Social Sharing** - Share results to social media? (Phase 2)

---

## Ready for Planning

- [x] Critical ambiguities resolved
- [x] Shield system fully specified
- [x] Game end behavior defined
- [x] Party change rules defined
- [x] Language support clarified
- [x] Click feedback specified
- [x] Notification system defined
- [x] Assumptions documented

---

## Next Steps

1. **Update Tech Spec** - Add shield system to database schema and functions
2. **Update PRD** - Add shield mechanic to game rules section
3. **Find Population Data** - Source official Thai province population data
4. **Run `/project:plan-module`** - Plan implementation with clarified requirements

---

**Document End**
