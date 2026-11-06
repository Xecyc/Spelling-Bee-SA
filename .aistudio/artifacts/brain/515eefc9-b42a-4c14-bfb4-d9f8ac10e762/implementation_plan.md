# 10-Wheel Competition System & Tiebreak Restructure

Restructure the Salto Ángel Spelling Bee 2026 application from the preliminary 14-wheel layout to the official **10-wheel competition system** described in the user's instructions and voice notes. This combines general grade-band lists with cumulative grade-specific tiebreaker lists and renames the competition stage buttons to **General** and **Tiebreak**.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The application is transitioning from 14 wheels down to **10 official competition wheels**.
> In this new structure:
> - **General Wheels (3 wheels)** contain the base grade-band vocabulary for standard rounds (40s timer).
> - **Tiebreak Wheels (7 wheels)** contain the base grade-band vocabulary **PLUS** the grade's specific tiebreaker list (20s timer).
> - All button labels previously showing *"1st Place"* and *"2nd/3rd Place"* will now read **"General"** and **"Tiebreak"**.

- **Wheel Count**: Exactly 10 wheels (4 for 1st-3rd, 4 for 4th-6th, 2 for High School).
- **Cumulative Tiebreakers**: Each tiebreak wheel combines the base round vocabulary with the grade's tiebreaker words so eliminated words can be tracked cleanly and difficulty scales progressively.
- **Slice Capacity**: Increasing `MAX_SLICES` limit from 50 to 120 to support combined tiebreak wheels (up to 73 words in High School Tiebreak).
- **Automatic Deduplication**: When combining the general list and tiebreak list, identical words are deduplicated so every slice represents a unique word.

---

### 1. Overview & 10-Wheel Roster

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SALTO ÁNGEL SPELLING BEE 2026                         │
│                           10-WHEEL SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1st - 3rd Grade Group (Elementary Block 1)                                  │
│   1. 1st-3rd Grade - General      │ 20 words  │ 40s timer │ Standard Round  │
│   2. 1st Grade - Tiebreak         │ 43 words  │ 20s timer │ Base + 1st TB   │
│   3. 2nd Grade - Tiebreak         │ 38 words  │ 20s timer │ Base + 2nd TB   │
│   4. 3rd Grade - Tiebreak         │ 42 words  │ 20s timer │ Base + 3rd TB   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4th - 6th Grade Group (Elementary Block 2)                                  │
│   5. 4th-6th Grade - General      │ 30 words  │ 40s timer │ Standard Round  │
│   6. 4th Grade - Tiebreak         │ 51 words  │ 20s timer │ Base + 4th TB   │
│   7. 5th Grade - Tiebreak         │ 48 words  │ 20s timer │ Base + 5th TB   │
│   8. 6th Grade - Tiebreak         │ 48 words  │ 20s timer │ Base + 6th TB   │
├─────────────────────────────────────────────────────────────────────────────┤
│ High School Group (Bachillerato - 1er a 5to Año)                            │
│   9. High School - General        │ 40 verbs  │ 40s timer │ 40 Current Verbs│
│  10. High School - Tiebreak       │ 73 verbs  │ 20s timer │ 40 + 33 Verbs   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. User Experience & Button Modernization

> [!NOTE]
> **Permanent Design Constitution Rule**: Never stray back or deviate from established design decisions (sober presentation navy `#061a3e`, unified button tokens `bg-[#0a2354]/60`, and gold `bg-amber-400` active selection) unless explicitly requested by the user.

1. **Role & Filter Button Updates**:
   - Change Top Navigation tab toggle from `[1st Place] [2nd/3rd Place]` to `[General] [Tiebreak]`.
   - **Identical Sober Navy Styling**: Both `General` and `Tiebreak` buttons maintain the exact same design:
     - Inactive: Sober Navy `bg-[#0a2354]/60 text-blue-100 border-blue-400/20 hover:bg-[#0e2f6d] hover:text-white`
     - Active / Selected: Presentation Gold `bg-amber-400 text-[#06152d] border-amber-300 shadow-md shadow-amber-400/20`
     - *No amber/coral or alternate color shifts are applied to Tiebreak.*
2. **Grade Selection & Wheel Switcher**:
   - The Top Dropdown and Studio Sidebar will cleanly group wheels under:
     - **Elementary: 1st – 3rd Grade** (1 General + 3 Tiebreak wheels)
     - **Elementary: 4th – 6th Grade** (1 General + 3 Tiebreak wheels)
     - **High School: 1er a 5to Año** (1 General + 1 Tiebreak wheel)
3. **Responsive Presentation Deck**:
   - Slide 0 and Slide 1 dynamic headers display `"General Round"` or `"Grade X Tiebreak"`.
   - Smooth navigation and full-screen preservation across all 10 wheels.

---

### 3. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ src/utils/defaultData.ts                                                    │
│  - WORDS_MAIN_1ST_3RD (20 words)                                            │
│  - WORDS_MAIN_4TH_6TH (30 words)                                            │
│  - WORDS_MAIN_HIGHSCHOOL (40 verbs)                                         │
│  - Grade Tiebreak Lists (TB 1st through TB 6th + TB High School)            │
│  - combineUniqueWords(base, tiebreak) helper                                │
│  - INITIAL_WHEELS: 10 structured WheelConfig entries                        │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Server & Client State Synchronization                                       │
│  - data/wheels.json: re-seeded with the 10 official wheels                   │
│  - App.tsx cache version bumped to flush old 14-wheel storage               │
│  - Role type WheelRole updated to 'general' | 'tiebreak' (backward-compat)  │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ UI Components                                                               │
│  - TopGeniallyBar.tsx: 'General' & 'Tiebreak' switcher                      │
│  - WheelCreatorStudio.tsx: updated role filters & creation modal            │
│  - PresentationDeck.tsx: updated slide header labels                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Changes:
1. **`src/types/presentation.ts`**:
   - Update `WheelRole` type to accept `'general' | 'tiebreak' | '1st' | '2nd'`.
2. **`src/utils/defaultData.ts`**:
   - Set `MAX_SLICES = 150`.
   - Combine words using `Array.from(new Set([...base, ...tiebreak]))`.
   - Define the 10 wheels with clear IDs:
     - `wheel-elem-1-3-general`
     - `wheel-elem-1st-tb`
     - `wheel-elem-2nd-tb`
     - `wheel-elem-3rd-tb`
     - `wheel-elem-4-6-general`
     - `wheel-elem-4th-tb`
     - `wheel-elem-5th-tb`
     - `wheel-elem-6th-tb`
     - `wheel-hs-general`
     - `wheel-hs-tb`
3. **`data/wheels.json`**:
   - Re-populate with the updated 10 wheels.
4. **`src/components/TopGeniallyBar.tsx` & `src/components/WheelCreatorStudio.tsx`**:
   - Replace *"1st Place"* label with **"General"**.
   - Replace *"2nd/3rd Place"* label with **"Tiebreak"**.
5. **Persistence**:
   - Bump localStorage key in `App.tsx` to `salto_angel_wheels_2026_v7` to automatically load the new 10 wheels without requiring a manual reset.
