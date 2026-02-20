# Tennis Match-Making Logic Refactoring Guide

## Overview
This document maps the original 125+ functions from `index.html` to the new clean, modular TypeScript structure.

## New Structure

```
lib/
├── types.ts                          # Core type definitions
├── utils/
│   ├── grade-utils.ts               # Grade conversion & comparison
│   ├── court-utils.ts               # Court filtering & sorting
│   └── player-utils.ts              # Player filtering & selection
└── match-generation/
    ├── index.ts                     # Main orchestrator
    ├── player-rotation.ts           # AB-smart rotation algorithm
    ├── perfect-16.ts                # Perfect 16 special scenario
    ├── same-sex-matches.ts          # Same-sex doubles generation
    └── mixed-matches.ts             # Mixed doubles generation
```

## Key Consolidations

### 1. Grade Management (was ~10 functions)
**Original functions:**
- `translateGrade()`
- `reverseTranslateGrade()`
- `getGradeDifference()`
- `hasLargeGradeGap()`
- `isPlayingDown()`
- etc.

**Now in:** `lib/utils/grade-utils.ts`
- Clean, focused utilities
- Type-safe with Grade type (1-5)
- Easy to test

### 2. Court Management (was ~8 functions)
**Original functions:**
- `isHardCourt()`
- `getCourtSurface()`
- `shouldCourtComeBefore()`
- `canPlayerPlayOnCourt()`
- `updateAvailableCourtsDisplay()`
- etc.

**Now in:** `lib/utils/court-utils.ts`
- Pure functions (no DOM manipulation)
- Separated logic from UI

### 3. Player Selection (was ~15 functions)
**Original functions:**
- `getAvailablePlayersForSet()`
- `filterPlayersByGender()`
- `sortByArrivalOrder()`
- `calculateSitOutCount()`
- `selectPlayersToSitOut()`
- `autoSelectSitOffPlayers()`
- etc.

**Now in:** `lib/utils/player-utils.ts`
- Consolidated sit-out logic
- Clear player filtering
- Reusable across components

### 4. Player Rotation (was ~6 functions)
**Original functions:**
- `splitAB()`
- `rotateRight()`
- `interleaveAB()`
- `mixABSmart()`

**Now in:** `lib/match-generation/player-rotation.ts`
- Core rotation algorithm preserved
- Added clear documentation
- Type-safe implementation

### 5. Perfect 16 (was ~3 functions)
**Original functions:**
- `detectPerfect16Scenario()`
- `getPerfect16Schedule()`
- `generatePerfect16Matches()`

**Now in:** `lib/match-generation/perfect-16.ts`
- Isolated special case logic
- Easy to maintain schedules
- Clear detection rules

### 6. Match Generation (was ~30+ functions)
**Original functions:**
- `generateMatches()`
- `generateSameSexMatches()`
- `generateMixedMatches()`
- `creates2Mvs2F()`
- `balanceTeamsIfNeeded()`
- `balanceIndividualMatches()`
- `attemptCompetitivenessSwap()`
- `autoFixPlusMinusImbalances()`
- `autoFixRepeatPartnerships()`
- `autoFixRepeatOpponents()`
- etc.

**Now in:** `lib/match-generation/`
- Separated by match type
- Main orchestrator in `index.ts`
- Each algorithm in its own file

## Removed/Deprecated Functions

### DOM Manipulation (~40 functions)
These will move to React/Next.js components:
- `updateAvailableCourtsDisplay()`
- `addPlayerRow()`
- `updateSitOffCalculation()`
- `displayResults()`
- `showSaveIndicator()`
- `openSetsModal()`
- etc.

### Storage Functions (~5 functions)
Will be replaced by Supabase:
- `saveDataToStorage()`
- `loadDataFromStorage()`
- `restoreDataFromSave()`
- `clearSavedData()`

### Excel/Download Functions (~8 functions)
Will be reimplemented as needed:
- `downloadExcel()`
- `createPlayerSummarySheet()`
- `exportInputFiles()`
- `importExcelFile()`

### Autocomplete/UI Functions (~15 functions)
Will move to React components:
- `handleNameInput()`
- `handleNameKeydown()`
- `selectPlayer()`
- `hideSuggestions()`
- etc.

### Manual Match Setup (~10 functions)
Will be reimplemented in UI:
- `toggleManualSetup()`
- `addManualMatch()`
- `clearManualSetup()`
- `addPlayerToTeam()`
- etc.

## Usage Examples

### Generate Matches
```typescript
import { generateMatches } from './lib/match-generation'

const result = generateMatches({
  players: eventPlayers,
  courts: selectedCourts,
  setNumber: 1,
  format: 'Same-Sex',
  manualMatches: [],
})

console.log(result.matches)
console.log(result.warnings)
```

### Check Player Availability
```typescript
import { getAvailablePlayersForSet } from './lib/utils/player-utils'

const available = getAvailablePlayersForSet(allPlayers, 3)
```

### Rotate Players
```typescript
import { rotatePlayersForSet } from './lib/match-generation/player-rotation'

const rotated = rotatePlayersForSet(players, setNumber)
```

### Grade Utilities
```typescript
import { translateGrade, hasLargeGradeGap } from './lib/utils/grade-utils'

const display = translateGrade(5) // "2"
const hasGap = hasLargeGradeGap(5, 2) // true (grade 2 vs grade 3)
```

## Next Steps

### Phase 1: Core Logic ✅
- [x] Extract and consolidate match generation logic
- [x] Create type-safe utilities
- [x] Document algorithms

### Phase 2: Database Integration
- [ ] Implement Supabase queries
- [ ] Create API routes for match generation
- [ ] Add player history tracking
- [ ] Implement sit-out tracking

### Phase 3: UI Components
- [ ] Create court selection component
- [ ] Build player roster table
- [ ] Implement match display
- [ ] Add manual match setup UI

### Phase 4: Advanced Features
- [ ] Repeat partner/opponent detection
- [ ] Grade balancing optimization
- [ ] Plus/minus player handling
- [ ] Real-time updates

## Testing Strategy

Each module should have unit tests:

```typescript
// Example: grade-utils.test.ts
describe('translateGrade', () => {
  it('converts grade 5 to "2"', () => {
    expect(translateGrade(5)).toBe('2')
  })
})

// Example: player-rotation.test.ts
describe('mixABSmart', () => {
  it('rotates players correctly for set 1', () => {
    const players = [p1, p2, p3, p4]
    const rotated = mixABSmart(players, 1)
    expect(rotated).toEqual([p1, p3, p2, p4])
  })
})
```

## Benefits of Refactoring

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Pure functions easy to test
3. **Type Safety**: TypeScript catches errors at compile time
4. **Reusability**: Utilities can be used across components
5. **Documentation**: Self-documenting code with clear names
6. **Performance**: No unnecessary DOM manipulation in logic
7. **Scalability**: Easy to add new features

## Migration Path

1. Keep `index.html` as reference
2. Build new Next.js app using refactored logic
3. Test each module independently
4. Gradually replace old code with new
5. Maintain feature parity
6. Add new features once stable
