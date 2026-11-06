# Elementary & High School Spelling Bee Tiebreaker Wheels

Organize tiebreak wheels into two clean groups: **Elementary** and **High School**, using concise naming (`[Grade] - 1st Place` with 40s timer, `[Grade] - 2nd/3rd Place` with 20s timer), minimal on-screen text, and zero bloat.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following simplified naming and timer rules are confirmed:

- **Two Main Groups Only**:
  - **Elementary**: 1st Grade, 2nd Grade, 3rd Grade, 4th Grade, 5th Grade, 6th Grade.
  - **High School**: 1st to 5th Year (shared pool).
- **Concise Naming Convention (No Bloat)**:
  - `1st Grade - 1st Place` (40s)
  - `1st Grade - 2nd/3rd Place` (20s)
  - `2nd Grade - 1st Place` (40s)
  - `2nd Grade - 2nd/3rd Place` (20s)
  - `3rd Grade - 1st Place` (40s)
  - `3rd Grade - 2nd/3rd Place` (20s)
  - `4th Grade - 1st Place` (40s)
  - `4th Grade - 2nd/3rd Place` (20s)
  - `5th Grade - 1st Place` (40s)
  - `5th Grade - 2nd/3rd Place` (20s)
  - `6th Grade - 1st Place` (40s)
  - `6th Grade - 2nd/3rd Place` (20s)
  - `High School - 1st Place` (40s)
  - `High School - 2nd/3rd Place` (20s)
- **Timers by Default**:
  - 1st Place tiebreakers: **40 seconds**.
  - 2nd & 3rd Place tiebreakers: **20 seconds**.
- **Slide Indicator**:
  - Clean text without filler words like "Division":
    `Elementary · 1st Grade - 1st Place` or `High School · 1st Place`.

---

## 1. Overview & Core Concept

### What It Delivers
A clean, streamlined tiebreak wheel system for *Salto Ángel Spelling Bee 2026*, categorized strictly into **Elementary** and **High School**, with preset 40s (1st place) and 20s (2nd/3rd place) timers.

### Key Value
- **Less Words, No Bloat**: Direct labels without long descriptive titles.
- **Instant Recognition**: Presenters immediately select the grade and place.
- **Automatic Timers**: Selecting a 1st place wheel primes a 40s countdown; selecting a 2nd/3rd place wheel primes a 20s countdown.

---

## 2. User Experience & Minimal Navigation

### Navigation Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  [ Elementary ]                     [ High School ]                    │  <- Group Tabs
├────────────────────────────────────────────────────────────────────────┤
│  Elementary Grades: 1st  |  2nd  |  3rd  |  4th  |  5th  |  6th        │  <- Grade Buttons
│  Tiebreaker:        [ 1st Place (40s) ]   [ 2nd/3rd Place (20s) ]      │  <- Place Buttons
└────────────────────────────────────────────────────────────────────────┘
```

1. **Top Bar Dropdown**:
   - Tab 1: **Elementary** (shows 1st to 6th grade buttons, then 1st Place / 2nd/3rd Place).
   - Tab 2: **High School** (shows 1st Place / 2nd/3rd Place).
   - Selecting a wheel immediately sets it active in both presentation and studio.

2. **Wheel Creator Studio**:
   - Same clean two-group filter: `Elementary` and `High School`.
   - Clear chips: `1st Grade - 1st Place`, `1st Grade - 2nd/3rd Place`, etc.
   - Timer input correctly defaults to 40s (1st place) or 20s (2nd/3rd place), remaining fully editable.

3. **Presentation Slide**:
   - Minimal banner centered above the wheel:
     `Elementary · 4th Grade - 1st Place`
     `High School · 2nd/3rd Place`
   - Active countdown timer starts at 40s or 20s accordingly.
   - Winner modal shows `Start 40s Timer` or `Start 20s Timer`.

---

## 3. Data Model & Vocabulary

### Types

```typescript
export type WheelGroup = 'elementary' | 'high_school' | 'custom';
export type WheelPlace = '1st' | '2nd_3rd' | 'custom';

export interface WheelConfig {
  id: string;
  name: string;             // e.g. "1st Grade - 1st Place"
  group: WheelGroup;        // 'elementary' | 'high_school' | 'custom'
  grade?: string;           // '1st', '2nd', '3rd', '4th', '5th', '6th', 'High School'
  place: WheelPlace;        // '1st' | '2nd_3rd' | 'custom'
  slices: WheelSlice[];
  spinDuration: number;     // 6s
  timerDuration: number;    // 40s for 1st place, 20s for 2nd/3rd place
}
```

### Wheel Catalog (14 Wheels)

| Group | Grade | Name | Timer | Vocabulary |
|---|---|---|---|---|
| Elementary | 1st Grade | 1st Grade - 1st Place | 40s | 1st Grade Tie 1 |
| Elementary | 1st Grade | 1st Grade - 2nd/3rd Place | 20s | 1st Grade Tie 2 |
| Elementary | 2nd Grade | 2nd Grade - 1st Place | 40s | 2nd Grade Tie 1 |
| Elementary | 2nd Grade | 2nd Grade - 2nd/3rd Place | 20s | 2nd Grade Tie 2 |
| Elementary | 3rd Grade | 3rd Grade - 1st Place | 40s | 3rd Grade Tie 1 |
| Elementary | 3rd Grade | 3rd Grade - 2nd/3rd Place | 20s | 3rd Grade Tie 2 |
| Elementary | 4th Grade | 4th Grade - 1st Place | 40s | 4th Grade Tie 1 |
| Elementary | 4th Grade | 4th Grade - 2nd/3rd Place | 20s | 4th Grade Tie 2 |
| Elementary | 5th Grade | 5th Grade - 1st Place | 40s | 5th Grade Tie 1 |
| Elementary | 5th Grade | 5th Grade - 2nd/3rd Place | 20s | 5th Grade Tie 2 |
| Elementary | 6th Grade | 6th Grade - 1st Place | 40s | 6th Grade Tie 1 |
| Elementary | 6th Grade | 6th Grade - 2nd/3rd Place | 20s | 6th Grade Tie 2 |
| High School | High School | High School - 1st Place | 40s | High School Tie 1 |
| High School | High School | High School - 2nd/3rd Place | 20s | High School Tie 2 |

---

## 4. Execution Plan

1. **Update Types (`src/types/presentation.ts`)**:
   - `WheelGroup = 'elementary' | 'high_school' | 'custom'`.
   - `WheelPlace = '1st' | '2nd_3rd' | 'custom'`.
   - Add `group`, `grade`, `place` to `WheelConfig`.
2. **Update Vocabulary & Defaults (`src/utils/defaultData.ts`)**:
   - Populate `INITIAL_WHEELS` with the 14 wheels using the exact names (`1st Grade - 1st Place`, etc.).
   - Set `timerDuration: 40` for 1st place and `timerDuration: 20` for 2nd/3rd place.
   - Include distinct vocabulary for each wheel.
3. **Update TopGeniallyBar (`src/components/TopGeniallyBar.tsx`)**:
   - Two clean tabs: **Elementary** and **High School**.
   - Elementary reveals 1st–6th Grade pills, then `1st Place` / `2nd/3rd Place`.
   - High School reveals `1st Place` / `2nd/3rd Place`.
4. **Update WheelCreatorStudio (`src/components/WheelCreatorStudio.tsx`)**:
   - Clean group filter with `Elementary` and `High School`.
   - Quick chips for all 14 wheels.
   - Creating a new 1st place wheel sets 40s; creating 2nd/3rd sets 20s.
5. **Presentation Deck (`src/components/PresentationDeck.tsx`)**:
   - Minimal banner above the wheel: `Elementary · [Grade] - [Place]` or `High School · [Place]`.
6. **Winner Modal (`src/components/WinnerModal.tsx`)**:
   - Automatically uses the active wheel's timer duration (`Start 40s Timer` or `Start 20s Timer`).
7. **Verification**:
   - Run compilation and linting checks.
   - Verify clean switching and storage synchronization.
