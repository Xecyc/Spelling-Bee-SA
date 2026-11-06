# Word Population Plan for Existing Wheels

Keep all current wheels exactly as they are (preserving IDs, titles, groups, and timers), updating only the internal words list with the user's verified vocabulary and removing any duplicates.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Zero Structural Changes**: All current wheel names, groups (`Elementary` vs. `High School`), roles (`1st Place` vs. `2nd/3rd Place`), and timer durations (40s / 20s) remain completely untouched.
> - **Word-Only Update**: Only the `slices` array inside each existing wheel is replaced with the clean, deduplicated, uppercase competition vocabulary.

---

### 1. Overview & Classification Mapping

| Existing Wheel Name | Group | Role | Timer | Assigned Vocabulary List | Word Count |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1st Grade - 1st Place** | Elementary | 1st Place | 40s | Main 1st–3rd Grade List | 20 words |
| **1st Grade - 2nd/3rd Place** | Elementary | 2nd/3rd | 20s | Tie-Breaker 1st Grade | 23 words |
| **2nd Grade - 1st Place** | Elementary | 1st Place | 40s | Main 1st–3rd Grade List | 20 words |
| **2nd Grade - 2nd/3rd Place** | Elementary | 2nd/3rd | 20s | Tie-Breaker 2nd Grade | 18 words |
| **3rd Grade - 1st Place** | Elementary | 1st Place | 40s | Main 1st–3rd Grade List | 20 words |
| **3rd Grade - 2nd/3rd Place** | Elementary | 2nd/3rd | 20s | Tie-Breaker 3rd Grade | 22 words |
| **4th Grade - 1st Place** | Elementary | 1st Place | 40s | Main 4th–6th Grade List | 30 words |
| **4th Grade - 2nd/3rd Place** | Elementary | 2nd/3rd | 20s | Tie-Breaker 4th Grade | 23 words |
| **5th Grade - 1st Place** | Elementary | 1st Place | 40s | Main 4th–6th Grade List | 30 words |
| **5th Grade - 2nd/3rd Place** | Elementary | 2nd/3rd | 20s | Tie-Breaker 5th Grade | 20 words |
| **6th Grade - 1st Place** | Elementary | 1st Place | 40s | Main 4th–6th Grade List | 30 words |
| **6th Grade - 2nd/3rd Place** | Elementary | 2nd/3rd | 20s | Tie-Breaker 6th Grade | 18 words |
| **High School - 1st Place** | High School | 1st Place | 40s | Main High School List | 40 words |
| **High School - 2nd/3rd Place**| High School | 2nd/3rd | 20s | Tie-Breaker High School (deduped) | 33 words |

---

### 2. Verified Word Lists

1. **Main 1st to 3rd Grade (20 words)**:
   `ANIMAL`, `WINDOW`, `PENCIL`, `ORANGE`, `YELLOW`, `FATHER`, `MOTHER`, `SISTER`, `BROTHER`, `SUMMER`, `WINTER`, `FLOWER`, `DOCTOR`, `MARKET`, `STREET`, `GARDEN`, `SUNDAY`, `MONDAY`, `DINNER`, `MORNING`
2. **Main 4th to 6th Grade (30 words)**:
   `AFTERNOON`, `BREAKFAST`, `BEAUTIFUL`, `COMPUTER`, `HOSPITAL`, `MOUNTAIN`, `SANDWICH`, `ELEPHANT`, `DINOSAUR`, `UMBRELLA`, `VACATION`, `LANGUAGE`, `MAGAZINE`, `QUESTION`, `NEIGHBOR`, `MEDICINE`, `TOMORROW`, `YESTERDAY`, `REMEMBER`, `SURPRISE`, `TELEPHONE`, `FURNITURE`, `IMPORTANT`, `CHOCOLATE`, `DIRECTION`, `VEGETABLE`, `DELICIOUS`, `RESTAURANT`, `STRAWBERRY`, `UNIVERSITY`
3. **Main High School (40 words)**:
   `FORBID`, `BROADCAST`, `FORESEE`, `MISLEAD`, `MISTAKE`, `MISUNDERSTAND`, `OVERCOME`, `OVERDO`, `OVEREAT`, `OVERHEAR`, `OVERSLEEP`, `OVERTHROW`, `PROOFREAD`, `REBUILD`, `REMAKE`, `RESELL`, `RETHINK`, `REWIND`, `REWRITE`, `SHRINK`, `SPREAD`, `SPRING`, `STRIDE`, `STRING`, `STRIVE`, `THRIVE`, `UNDERGO`, `UNDERSTAND`, `UNDERTAKE`, `WITHDRAW`, `WITHHOLD`, `WITHSTAND`, `UPHOLD`, `OVERPAY`, `MISSPELL`, `PARTAKE`, `OUTGROW`, `OUTSELL`, `OUTSHINE`, `SUNBURN`
4. **Tie-Breaker 1st Grade (23 words)**:
   `STAR`, `MOON`, `SUN`, `TREE`, `FLOWER`, `MOUSE`, `CAT`, `BOY`, `GIRL`, `BOOK`, `MICE`, `EYES`, `MOTHER`, `FATHER`, `BROTHER`, `SISTER`, `SON`, `DAUGHTER`, `AUNT`, `UNCLE`, `PET`, `GRANDFATHER`, `GRANDMOTHER`
5. **Tie-Breaker 2nd Grade (18 words)**:
   `WRITE`, `SING`, `CLAP`, `DRAW`, `PICTURE`, `EAT`, `BREAKFAST`, `SHOWER`, `TAKE`, `DAY`, `MOTHER`, `FATHER`, `GRADUATION`, `BIRTHDAY`, `CHRISTMAS`, `GIFTS`, `MONTHS`, `DATE`
6. **Tie-Breaker 3rd Grade (22 words)**:
   `YOUR`, `ITS`, `OUR`, `THEIR`, `MINE`, `THOSE`, `THESE`, `WHOSE`, `DUST`, `FLOOR`, `MOP`, `SWEEP`, `WASH`, `DISHES`, `VACUUM`, `IRON`, `MAKE`, `BEDS`, `CLOTHES`, `DUSTER`, `BROOM`, `WEEKLY`
7. **Tie-Breaker 4th Grade (23 words)**:
   `GOOD`, `MORNING`, `AFTERNOON`, `EVENING`, `LATER`, `NIGHT`, `NICE`, `MEET`, `FIRST`, `SECOND`, `NAME`, `WINDOW`, `BACKPACK`, `PAPER`, `SHEET`, `PENCIL`, `TEACHER`, `CALENDAR`, `BOOK`, `T-SHIRT`, `DESK`, `EARTH`, `GLOBE`
8. **Tie-Breaker 5th Grade (20 words)**:
   `MORNING`, `AFTERNOON`, `EVENING`, `NIGHT`, `NAME`, `DAY`, `AGE`, `BIRTHDAY`, `JANUARY`, `FEBRUARY`, `MARCH`, `APRIL`, `MAY`, `JUNE`, `JULY`, `AUGUST`, `SEPTEMBER`, `OCTOBER`, `NOVEMBER`, `DECEMBER`
9. **Tie-Breaker 6th Grade (18 words)**:
   `ORDINARY`, `HUNDRED`, `THOUSAND`, `MILLION`, `PREPOSITION`, `IDENTIFICATION`, `BIOGRAPHY`, `COLOR WHEEL`, `LEISURE`, `INTERESTS`, `CHESS`, `HOUSEWORK`, `IRONING`, `ROUTINE`, `FREE TIME`, `FRACTION`, `DECIMAL`, `PERCENTAGE`
10. **Tie-Breaker High School (33 words, deduplicated)**:
    `BECOME`, `BEGIN`, `BREAK`, `BRING`, `BUILD`, `CATCH`, `CHOOSE`, `DREAM`, `DRINK`, `DRIVE`, `FORGET`, `FORGIVE`, `FREEZE`, `HOLD`, `LEARN`, `LEAVE`, `LEND`, `LYING`, `MAN`, `OVERTAKE`, `PAY`, `READ`, `RING`, `SHAKE`, `SHINE`, `SHOOT`, `SLEEP`, `SPEAK`, `SPEND`, `WRITE`, `STRIKE`, `SWEAR`, `RUN`

---

### 3. Implementation Steps

1. Update `src/utils/defaultData.ts` with these exact word arrays and populate each corresponding wheel slice array using `createSlicesFromWords`.
2. Clear and update active state and server persistence file (`data/wheels.json` and client cache) so the updated lists load immediately on the canvas and in the presentation deck.
3. Verify compilation and dev server restart.
