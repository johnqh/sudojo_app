# Practice Feature Implementation Plan

**Status: IMPLEMENTED**

## Overview
Allow users to practice a specific technique by playing sudoku boards that are set up to use that technique as the next logical step.

## Design Decisions (from clarification)
- **DB Reference**: Use technique UUID (foreign key to techniques table)
- **Hints**: Allow hints during practice (same as normal gameplay)
- **Timer/Celebration**: Show timer and celebration animation when completed
- **Generation Limit**: Max 100 solver attempts per example before skipping
- **Board State**: Store exact state with user input merged into original puzzle (appears as fresh game)
- **Pencilmarks**: Include solver pencilmarks so technique is visible
- **Admin Controls**: Include "Delete All Practices" option

---

## 1. Database Schema

**File**: `sudojo_api/src/db/schema.ts`

```typescript
export const techniquePractices = pgTable("technique_practices", {
  uuid: uuid("uuid").primaryKey().defaultRandom(),
  technique_uuid: uuid("technique_uuid").references(() => techniques.uuid, {
    onDelete: "cascade",
  }),
  board: varchar("board", { length: 81 }).notNull(),  // Merged state (looks like fresh puzzle)
  pencilmarks: text("pencilmarks"),                    // Comma-delimited from solver
  solution: varchar("solution", { length: 81 }).notNull(),
  hint_data: text("hint_data"),                        // JSON hint for reference
  source_example_uuid: uuid("source_example_uuid").references(() => techniqueExamples.uuid, {
    onDelete: "set null",
  }),
  created_at: timestamp("created_at").defaultNow(),
});
```

---

## 2. Types

**File**: `sudojo_types/src/index.ts`

```typescript
export interface TechniquePractice {
  uuid: string;
  technique_uuid: string | null;
  board: string;
  pencilmarks: string | null;
  solution: string;
  hint_data: string | null;
  source_example_uuid: string | null;
  created_at: Date | null;
}

export interface TechniquePracticeCreateRequest {
  technique_uuid: string;
  board: string;
  pencilmarks: Optional<string>;
  solution: string;
  hint_data: Optional<string>;
  source_example_uuid: Optional<string | null>;
}

export interface TechniquePracticeCountItem {
  technique_uuid: string;
  technique_title: string;
  count: number;
}
```

---

## 3. Backend Endpoints

**File**: `sudojo_api/src/routes/practices.ts` (new file)

### Endpoints:
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/techniques/:uuid/practices/random` | Public | Get random practice for technique |
| GET | `/techniques/practices/counts` | Public | Get practice counts per technique |
| POST | `/practices` | Admin | Create new practice |
| DELETE | `/practices?confirm=true` | Admin | Delete all practices |

### Implementation Notes:
- Random selection uses `ORDER BY RANDOM() LIMIT 1`
- Counts endpoint joins with techniques table to get titles
- Register in `routes/index.ts`

**File**: `sudojo_api/src/schemas/index.ts`

Add validation schema for practice creation.

---

## 4. Client Library

**File**: `sudojo_client/src/network/sudojo-client.ts`

Add methods:
- `getRandomPractice(token, techniqueUuid)`
- `getPracticeCounts(token)`
- `createPractice(token, data)`
- `deleteAllPractices(token)`

**File**: `sudojo_client/src/hooks/use-sudojo-practices.ts` (new file)

Add React Query hooks:
- `useSudojoRandomPractice`
- `useSudojoPracticeCounts`

---

## 5. Admin Frontend

**File**: `sudojo_app/src/pages/AdminPage.tsx`

### Changes:
1. Add to sections array:
   ```typescript
   { id: 'practices', label: 'Practices', description: 'Technique practice management' }
   ```

2. Add state:
   ```typescript
   const [practiceCounts, setPracticeCounts] = useState<TechniquePracticeCountItem[]>([]);
   const [isGeneratingPractices, setIsGeneratingPractices] = useState(false);
   const [generatePracticesProgress, setGeneratePracticesProgress] = useState('');
   ```

3. Add Practices section UI:
   - List techniques with practice counts (X/20 format)
   - "Generate Practices" button at bottom
   - "Delete All" button with confirmation
   - Progress indicator during generation

### Generation Logic:
```
For each technique with < 20 practices:
  1. Fetch examples where primary_technique matches
  2. For each example (until have 20 practices):
     a. Load example board with pencilmarks
     b. Call /solver/solve (up to 100 times)
     c. After each solve, check if hint technique matches target
     d. If match: merge user input into board, save to technique_practices
     e. If 100 attempts with no match: skip to next example
```

---

## 6. User Frontend - Technique Page CTA

**File**: `sudojo_app/src/pages/TechniquesPage.tsx`

Add "Start Practice" button in detail content (React, not HTML):

```typescript
// After belt badge, before HTML content
<Button
  variant="outline"
  size="sm"
  onClick={() => navigate(`/practice/${selectedTechnique.uuid}`)}
>
  {t('techniques.startPractice', 'Start Practice')}
</Button>
```

---

## 7. User Frontend - Practice Page

**File**: `sudojo_app/src/pages/PracticePage.tsx` (new file)

### Route:
- Path: `/:lang/practice/:techniqueId`
- Add lazy import in `App.tsx`

### Features:
- Fetch random practice from `/techniques/:uuid/practices/random`
- Use `SudokuGame` component with:
  - `puzzle`: practice.board (merged state)
  - `solution`: practice.solution
  - `initialPencilmarks`: practice.pencilmarks (pre-populated)
  - Timer and celebration enabled
  - Hints enabled (handles 402 via HintAccessPanel)
- **NO persistence to currentGame** - practice is ephemeral
- "Next Practice" button on completion (fetches new random practice)

### Subscription Error Handling:
- Use same pattern as `LevelPlayPage`
- Show `SubscriptionPaywall` component for 402 errors
- Show `HintAccessPanel` for hint subscription errors

### Key Difference from Normal Game:
- Do NOT use `useGamePlay()` hook
- Do NOT call `startGame()` or `updateProgress()`
- Progress is not saved to localStorage

---

## 8. Files to Create

| File | Purpose |
|------|---------|
| `sudojo_api/src/routes/practices.ts` | API endpoints |
| `sudojo_app/src/pages/PracticePage.tsx` | Practice page component |
| `sudojo_lib/src/hooks/usePracticeGame.ts` | Hook for fetching practice |
| `sudojo_client/src/hooks/use-sudojo-practices.ts` | React Query hooks |

## 9. Files to Modify

| File | Changes |
|------|---------|
| `sudojo_api/src/db/schema.ts` | Add techniquePractices table |
| `sudojo_api/src/schemas/index.ts` | Add practice validation schemas |
| `sudojo_api/src/routes/index.ts` | Register practices router |
| `sudojo_types/src/index.ts` | Add TechniquePractice types |
| `sudojo_app/src/App.tsx` | Add practice route |
| `sudojo_app/src/pages/TechniquesPage.tsx` | Add "Start Practice" CTA |
| `sudojo_app/src/pages/AdminPage.tsx` | Add Practices section |
| `sudojo_client/src/network/sudojo-client.ts` | Add practice API methods |
| `sudojo_client/src/index.ts` | Export new hooks |

---

## 10. Verification

### Backend:
1. Run database migration to create `technique_practices` table
2. Test endpoints with curl/Postman:
   - `GET /api/v1/techniques/practices/counts` returns technique list with counts
   - `POST /api/v1/practices` creates practice (admin token required)
   - `GET /api/v1/techniques/{uuid}/practices/random` returns random practice

### Admin:
1. Navigate to Admin > Practices
2. Verify technique list shows with counts
3. Click "Generate Practices" - verify progress updates
4. Verify practices are created (counts increase)
5. Test "Delete All" clears practices

### User:
1. Navigate to Techniques > select a technique
2. Verify "Start Practice" button appears (React, not in HTML)
3. Click button - navigates to Practice page
4. Verify board loads with pre-populated pencilmarks
5. Play through puzzle - verify hints work, timer runs
6. Complete puzzle - verify celebration, "Next Practice" button
7. Verify main game is NOT affected (check Play page still has previous game)
8. Test 402 handling - verify subscription paywall appears when needed
