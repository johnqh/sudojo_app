# Plan: Technique Examples Database Table

## Overview
Create a `technique_examples` table in sudojo_api to store board states with a bitfield of all applicable techniques. This data will be used for technique tutorials, providing real puzzle examples that demonstrate each solving technique.

## Requirements
- Store board states (81 digits) with applicable techniques as bitfield
- Build the table by running boards through `/hint` endpoint repeatedly
- Target: ~20 examples per technique
- Track ALL applicable techniques at each board state, not just the primary one

---

## Phase 1: Define Technique Bitfield

### Existing: `boards.techniques` Field

The `boards` table already has a `techniques` field that stores a **bitfield** with the OR of all techniques used to solve the board. This same bitfield format will be used in the new `technique_examples` table.

### File: `sudojo_types/src/index.ts`

Add technique enum and bitfield definitions based on `sudojo_solver/SudokuEngine/SudokuDefines.h`:

```typescript
// =============================================================================
// Technique Bitfield (matches SudokuDefines.h enum SudokuTechnique)
// =============================================================================

export enum TechniqueId {
  FULL_HOUSE = 1,
  HIDDEN_SINGLE = 2,
  NAKED_SINGLE = 3,
  HIDDEN_PAIR = 4,
  NAKED_PAIR = 5,
  LOCKED_CANDIDATES = 6,
  HIDDEN_TRIPLE = 7,
  NAKED_TRIPLE = 8,
  HIDDEN_QUAD = 9,
  NAKED_QUAD = 10,
  X_WING = 11,
  SWORDFISH = 12,
  JELLYFISH = 13,
  XY_WING = 14,
  FINNED_X_WING = 15,
  SQUIRMBAG = 16,
  FINNED_SWORDFISH = 17,
  FINNED_JELLYFISH = 18,
  XYZ_WING = 19,
  WXYZ_WING = 20,
  ALMOST_LOCKED_SETS = 21,
  FINNED_SQUIRMBAG = 22,
  ALS_CHAIN = 23,
}

// Map technique title strings (from solver API) to TechniqueId
export const TECHNIQUE_TITLE_TO_ID: Record<string, TechniqueId> = {
  'Full House': TechniqueId.FULL_HOUSE,
  'Hidden Single': TechniqueId.HIDDEN_SINGLE,
  'Naked Single': TechniqueId.NAKED_SINGLE,
  'Hidden Pair': TechniqueId.HIDDEN_PAIR,
  'Naked Pair': TechniqueId.NAKED_PAIR,
  'Locked Candidates': TechniqueId.LOCKED_CANDIDATES,
  'Hidden Triple': TechniqueId.HIDDEN_TRIPLE,
  'Naked Triple': TechniqueId.NAKED_TRIPLE,
  'Hidden Quad': TechniqueId.HIDDEN_QUAD,
  'Naked Quad': TechniqueId.NAKED_QUAD,
  'X-Wing': TechniqueId.X_WING,
  'Swordfish': TechniqueId.SWORDFISH,
  'Jellyfish': TechniqueId.JELLYFISH,
  'XY-Wing': TechniqueId.XY_WING,
  'Finned X-Wing': TechniqueId.FINNED_X_WING,
  'Squirmbag': TechniqueId.SQUIRMBAG,
  'Finned Swordfish': TechniqueId.FINNED_SWORDFISH,
  'Finned Jellyfish': TechniqueId.FINNED_JELLYFISH,
  'XYZ-Wing': TechniqueId.XYZ_WING,
  'WXYZ-Wing': TechniqueId.WXYZ_WING,
  'Almost Locked Sets': TechniqueId.ALMOST_LOCKED_SETS,
  'Finned Squirmbag': TechniqueId.FINNED_SQUIRMBAG,
  'ALS-Chain': TechniqueId.ALS_CHAIN,
};

// Bitfield utilities
export function techniqueToBit(techniqueId: TechniqueId): number {
  return 1 << (techniqueId - 1); // Shift by (id - 1) so FULL_HOUSE (1) = bit 0
}

export function hasTechnique(bitfield: number, techniqueId: TechniqueId): boolean {
  return (bitfield & techniqueToBit(techniqueId)) !== 0;
}

export function addTechnique(bitfield: number, techniqueId: TechniqueId): number {
  return bitfield | techniqueToBit(techniqueId);
}
```

---

## Phase 2: Create Database Table

### File: `sudojo_api/src/db/schema.ts`

Add the `technique_examples` table:

```typescript
export const techniqueExamples = pgTable("technique_examples", {
  uuid: uuid("uuid").primaryKey().defaultRandom(),
  // Board state (current position, not original puzzle)
  board: varchar("board", { length: 81 }).notNull(),
  // Pencilmarks at this state (comma-delimited, e.g., "123,45,,,9,...")
  pencilmarks: text("pencilmarks"),
  // Solution for reference
  solution: varchar("solution", { length: 81 }).notNull(),
  // Bitfield of ALL techniques applicable at this board state
  techniques_bitfield: integer("techniques_bitfield").notNull(),
  // Primary technique (the one solver would use first)
  primary_technique: integer("primary_technique").notNull(),
  // Hint data (JSON with areas, cells, description)
  hint_data: text("hint_data"),
  // Source board UUID (optional, for reference)
  source_board_uuid: uuid("source_board_uuid").references(() => boards.uuid, {
    onDelete: "set null",
  }),
  created_at: timestamp("created_at").defaultNow(),
});
```

### Migration
Run Drizzle migration after adding the schema.

---

## Phase 3: Types for API

### File: `sudojo_types/src/index.ts`

Add types for the new table:

```typescript
export interface TechniqueExample {
  uuid: string;
  board: string;
  pencilmarks: string | null;
  solution: string;
  techniques_bitfield: number;
  primary_technique: number;
  hint_data: string | null;
  source_board_uuid: string | null;
  created_at: Date | null;
}

export interface TechniqueExampleCreateRequest {
  board: string;
  pencilmarks: Optional<string>;
  solution: string;
  techniques_bitfield: number;
  primary_technique: number;
  hint_data: Optional<string>;
  source_board_uuid: Optional<string | null>;
}
```

---

## Phase 4: Populate `boards.techniques` Bitfield

### File: `sudojo_api/scripts/populate-board-techniques.ts`

Script to populate the `techniques` bitfield for all boards. This must run first before populating examples.

```typescript
/**
 * Populate boards.techniques bitfield
 *
 * For each board where techniques = 0:
 * 1. Repeatedly call /hint endpoint until solved
 * 2. Collect all techniques used (OR into bitfield)
 * 3. Update the board record with the techniques bitfield
 *
 * Eventually, all boards should have a non-zero techniques field.
 */

import { db } from "../db";
import { boards } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { TECHNIQUE_TITLE_TO_ID, techniqueToBit } from "@sudobility/sudojo_types";

const SOLVER_URL = process.env.SOLVER_URL;

async function populateBoardTechniques() {
  // Get all boards with techniques = 0
  const unprocessedBoards = await db
    .select()
    .from(boards)
    .where(eq(boards.techniques, 0));

  console.log(`Found ${unprocessedBoards.length} boards to process`);

  for (const board of unprocessedBoards) {
    let currentBoard = board.board;
    let pencilmarks = '';
    let techniquesBitfield = 0;

    // Solve step by step, collecting all techniques used
    while (currentBoard.includes('0')) {
      // Call /hint endpoint
      const response = await fetch(
        `${SOLVER_URL}/api/solve?original=${board.board}&user=${currentBoard}&autopencilmarks=true&pencilmarks=${pencilmarks}`
      );
      const result = await response.json();

      if (!result.success || !result.data?.hints?.steps?.length) break;

      const step = result.data.hints.steps[0];
      const techniqueId = TECHNIQUE_TITLE_TO_ID[step.title];

      if (techniqueId) {
        // OR the technique into the bitfield
        techniquesBitfield |= techniqueToBit(techniqueId);
      }

      // Apply the hint to progress (update currentBoard and pencilmarks)
      currentBoard = applyHint(currentBoard, step);
      pencilmarks = result.data.board.board.pencilmarks?.pencilmarks || '';
    }

    // Update the board record with the techniques bitfield
    if (techniquesBitfield > 0) {
      await db
        .update(boards)
        .set({ techniques: techniquesBitfield })
        .where(eq(boards.uuid, board.uuid));

      console.log(`Updated board ${board.uuid}: techniques = ${techniquesBitfield}`);
    }
  }

  console.log('Done populating board techniques');
}

function applyHint(board: string, step: any): string {
  // Apply cell selections from the hint
  let result = board.split('');
  for (const cell of step.cells) {
    if (cell.actions.select && cell.actions.select !== '0') {
      const index = cell.row * 9 + cell.column;
      result[index] = cell.actions.select;
    }
  }
  return result.join('');
}

populateBoardTechniques();
```

---

## Phase 5: Populate `technique_examples` Table

### File: `sudojo_api/scripts/populate-examples.ts`

Script to populate the examples table using boards that already have techniques populated:

```typescript
/**
 * Populate technique_examples table
 *
 * Prerequisites: Run populate-board-techniques.ts first so boards have techniques bitfield set.
 *
 * Algorithm:
 * 1. Start with the most difficult (rarest) techniques - they're hardest to find
 * 2. Query boards that have the target technique bit set
 * 3. For each board, run /hint repeatedly through the ENTIRE solve:
 *    - Each hint returns a technique
 *    - If we need more examples of that technique (< 20), store it
 *    - One board solve can yield examples for MULTIPLE techniques
 * 4. After each board, recount examples for all techniques
 * 5. Repeat until all techniques have 20 records
 */

import { db } from "../db";
import { boards, techniqueExamples } from "../db/schema";
import { sql, eq } from "drizzle-orm";
import { TechniqueId, TECHNIQUE_TITLE_TO_ID, techniqueToBit } from "@sudobility/sudojo_types";

const SOLVER_URL = process.env.SOLVER_URL;
const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_ACCESS_TOKEN = process.env.API_ACCESS_TOKEN;
const TARGET_COUNT = 20;

// Techniques ordered by difficulty (hardest first - these are rarest)
const TECHNIQUES_BY_DIFFICULTY = [
  TechniqueId.ALS_CHAIN,           // 23
  TechniqueId.FINNED_SQUIRMBAG,    // 22
  TechniqueId.ALMOST_LOCKED_SETS,  // 21
  TechniqueId.WXYZ_WING,           // 20
  TechniqueId.XYZ_WING,            // 19
  TechniqueId.FINNED_JELLYFISH,    // 18
  TechniqueId.FINNED_SWORDFISH,    // 17
  TechniqueId.SQUIRMBAG,           // 16
  TechniqueId.FINNED_X_WING,       // 15
  TechniqueId.XY_WING,             // 14
  TechniqueId.JELLYFISH,           // 13
  TechniqueId.SWORDFISH,           // 12
  TechniqueId.X_WING,              // 11
  TechniqueId.NAKED_QUAD,          // 10
  TechniqueId.HIDDEN_QUAD,         // 9
  TechniqueId.NAKED_TRIPLE,        // 8
  TechniqueId.HIDDEN_TRIPLE,       // 7
  TechniqueId.LOCKED_CANDIDATES,   // 6
  TechniqueId.NAKED_PAIR,          // 5
  TechniqueId.HIDDEN_PAIR,         // 4
  TechniqueId.NAKED_SINGLE,        // 3
  TechniqueId.HIDDEN_SINGLE,       // 2
  TechniqueId.FULL_HOUSE,          // 1
];

async function getExampleCounts(): Promise<Record<number, number>> {
  const counts: Record<number, number> = {};
  for (let i = 1; i <= 23; i++) counts[i] = 0;

  // Query existing counts from technique_examples table
  const result = await db
    .select({
      technique: techniqueExamples.primary_technique,
      count: sql<number>`count(*)::int`,
    })
    .from(techniqueExamples)
    .groupBy(techniqueExamples.primary_technique);

  for (const row of result) {
    counts[row.technique] = row.count;
  }
  return counts;
}

function allTechniquesComplete(counts: Record<number, number>): boolean {
  return Object.values(counts).every(count => count >= TARGET_COUNT);
}

async function populateExamples() {
  let counts = await getExampleCounts();
  console.log('Initial counts:', counts);

  // Process techniques from hardest to easiest
  for (const targetTechnique of TECHNIQUES_BY_DIFFICULTY) {
    if (allTechniquesComplete(counts)) {
      console.log('All techniques have 20 examples!');
      break;
    }

    // Skip if this technique already has enough
    if (counts[targetTechnique] >= TARGET_COUNT) continue;

    console.log(`\nLooking for technique ${targetTechnique}...`);

    // Find boards that use this technique
    const boardsWithTechnique = await db
      .select()
      .from(boards)
      .where(sql`(${boards.techniques} & ${techniqueToBit(targetTechnique)}) != 0`)
      .limit(50);

    console.log(`Found ${boardsWithTechnique.length} boards with technique ${targetTechnique}`);

    for (const board of boardsWithTechnique) {
      // Solve this board step by step
      let currentBoard = board.board;
      let pencilmarks = '';

      while (currentBoard.includes('0')) {
        // Get next hint
        const response = await fetch(
          `${SOLVER_URL}/api/solve?original=${board.board}&user=${currentBoard}&autopencilmarks=true`
        );
        const result = await response.json();

        if (!result.success || !result.data?.hints?.steps?.length) break;

        const step = result.data.hints.steps[0];
        const stepTechniqueId = TECHNIQUE_TITLE_TO_ID[step.title];

        // Store example if we need more of this technique
        if (stepTechniqueId && counts[stepTechniqueId] < TARGET_COUNT) {
          await fetch(`${API_URL}/api/v1/examples`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
              board: currentBoard,
              pencilmarks: result.data.board.board.pencilmarks?.pencilmarks || '',
              solution: board.solution,
              techniques_bitfield: techniqueToBit(stepTechniqueId),
              primary_technique: stepTechniqueId,
              hint_data: JSON.stringify(step),
              source_board_uuid: board.uuid,
            }),
          });

          counts[stepTechniqueId]++;
          console.log(`  Added example for technique ${stepTechniqueId} (now ${counts[stepTechniqueId]}/${TARGET_COUNT})`);
        }

        // Apply hint to progress
        currentBoard = applyHint(currentBoard, step);
      }

      // After each board, check if we're done
      if (allTechniquesComplete(counts)) break;
    }

    // Refresh counts from DB after processing boards for this technique
    counts = await getExampleCounts();
    console.log('Updated counts:', counts);
  }

  console.log('\nFinal counts:', counts);
}

function applyHint(board: string, step: any): string {
  let result = board.split('');
  for (const cell of step.cells) {
    if (cell.actions.select && cell.actions.select !== '0') {
      const index = cell.row * 9 + cell.column;
      result[index] = cell.actions.select;
    }
  }
  return result.join('');
}

populateExamples();
```

---

## Phase 6: CRUD API Endpoints

### File: `sudojo_api/src/routes/examples.ts`

Full CRUD endpoints for technique examples (used by population script and admin):

```typescript
import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { techniqueExamples } from "../db/schema";
import { successResponse, errorResponse } from "@sudobility/sudojo_types";

const router = new Hono();

// =============================================================================
// API Key Middleware (for POST/PUT/DELETE)
// =============================================================================
const API_ACCESS_TOKEN = process.env.API_ACCESS_TOKEN;

const requireApiKey = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!API_ACCESS_TOKEN || token !== API_ACCESS_TOKEN) {
    return c.json(errorResponse("Unauthorized"), 401);
  }

  await next();
};

// =============================================================================
// GET /api/v1/examples
// List examples, optionally filtered by technique
// =============================================================================
router.get("/", async (c) => {
  const technique = c.req.query("technique");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");

  if (!technique) {
    // Return counts per technique
    const counts = await db
      .select({
        technique: techniqueExamples.primary_technique,
        count: sql<number>`count(*)`,
      })
      .from(techniqueExamples)
      .groupBy(techniqueExamples.primary_technique);

    return c.json(successResponse(counts));
  }

  const techniqueId = parseInt(technique);

  // Get examples where this technique is applicable (check bitfield)
  const examples = await db
    .select()
    .from(techniqueExamples)
    .where(
      sql`(${techniqueExamples.techniques_bitfield} & ${1 << (techniqueId - 1)}) != 0`
    )
    .limit(limit)
    .offset(offset);

  return c.json(successResponse(examples));
});

// =============================================================================
// GET /api/v1/examples/:uuid
// Get a single example by UUID
// =============================================================================
router.get("/:uuid", async (c) => {
  const { uuid } = c.req.param();

  const [example] = await db
    .select()
    .from(techniqueExamples)
    .where(eq(techniqueExamples.uuid, uuid))
    .limit(1);

  if (!example) {
    return c.json(errorResponse("Example not found"), 404);
  }

  return c.json(successResponse(example));
});

// =============================================================================
// POST /api/v1/examples (requires API key)
// Create a new example (used by population script)
// =============================================================================
router.post("/", requireApiKey, async (c) => {
  const body = await c.req.json();

  const {
    board,
    pencilmarks,
    solution,
    techniques_bitfield,
    primary_technique,
    hint_data,
    source_board_uuid,
  } = body;

  // Validate required fields
  if (!board || !solution || techniques_bitfield === undefined || !primary_technique) {
    return c.json(errorResponse("Missing required fields"), 400);
  }

  const [example] = await db
    .insert(techniqueExamples)
    .values({
      board,
      pencilmarks: pencilmarks || null,
      solution,
      techniques_bitfield,
      primary_technique,
      hint_data: hint_data || null,
      source_board_uuid: source_board_uuid || null,
    })
    .returning();

  return c.json(successResponse(example), 201);
});

// =============================================================================
// PUT /api/v1/examples/:uuid (requires API key)
// Update an existing example
// =============================================================================
router.put("/:uuid", requireApiKey, async (c) => {
  const { uuid } = c.req.param();
  const body = await c.req.json();

  const {
    board,
    pencilmarks,
    solution,
    techniques_bitfield,
    primary_technique,
    hint_data,
    source_board_uuid,
  } = body;

  // Check if exists
  const [existing] = await db
    .select()
    .from(techniqueExamples)
    .where(eq(techniqueExamples.uuid, uuid))
    .limit(1);

  if (!existing) {
    return c.json(errorResponse("Example not found"), 404);
  }

  const [updated] = await db
    .update(techniqueExamples)
    .set({
      board: board ?? existing.board,
      pencilmarks: pencilmarks !== undefined ? pencilmarks : existing.pencilmarks,
      solution: solution ?? existing.solution,
      techniques_bitfield: techniques_bitfield ?? existing.techniques_bitfield,
      primary_technique: primary_technique ?? existing.primary_technique,
      hint_data: hint_data !== undefined ? hint_data : existing.hint_data,
      source_board_uuid: source_board_uuid !== undefined ? source_board_uuid : existing.source_board_uuid,
    })
    .where(eq(techniqueExamples.uuid, uuid))
    .returning();

  return c.json(successResponse(updated));
});

// =============================================================================
// DELETE /api/v1/examples/:uuid (requires API key)
// Delete an example
// =============================================================================
router.delete("/:uuid", requireApiKey, async (c) => {
  const { uuid } = c.req.param();

  const [deleted] = await db
    .delete(techniqueExamples)
    .where(eq(techniqueExamples.uuid, uuid))
    .returning();

  if (!deleted) {
    return c.json(errorResponse("Example not found"), 404);
  }

  return c.json(successResponse({ deleted: true }));
});

// =============================================================================
// DELETE /api/v1/examples (requires API key)
// Delete all examples (for repopulation)
// =============================================================================
router.delete("/", requireApiKey, async (c) => {
  const confirm = c.req.query("confirm");

  if (confirm !== "true") {
    return c.json(errorResponse("Add ?confirm=true to delete all"), 400);
  }

  await db.delete(techniqueExamples);

  return c.json(successResponse({ deleted: true }));
});

export default router;
```

### Register Route in `sudojo_api/src/routes/index.ts`:

```typescript
import examplesRouter from "./examples";

// Add to routes
app.route("/api/v1/examples", examplesRouter);
```

---

## Execution Steps

### Step 1: Update sudojo_types
1. Add `TechniqueId` enum
2. Add `TECHNIQUE_TITLE_TO_ID` mapping
3. Add bitfield utility functions
4. Add `TechniqueExample` types
5. Build and publish package

### Step 2: Update sudojo_api schema
1. Add `techniqueExamples` table to `schema.ts`
2. Run `npx drizzle-kit generate`
3. Run migration

### Step 3: Create examples API endpoints
1. Create `src/routes/examples.ts` with CRUD endpoints
2. Register route in `src/routes/index.ts`
3. API required before population scripts can POST

### Step 4: Create board techniques script
1. Create `scripts/populate-board-techniques.ts`
2. Add npm script: `"populate:board-techniques": "bun run scripts/populate-board-techniques.ts"`

### Step 5: Run board techniques population
1. Ensure solver service is running
2. Run: `npm run populate:board-techniques`
3. All boards will have non-zero `techniques` bitfield when done

### Step 6: Create examples population script
1. Create `scripts/populate-examples.ts`
2. Add npm script: `"populate:examples": "bun run scripts/populate-examples.ts"`

### Step 7: Run examples population
1. Ensure solver service is running
2. Set `API_ACCESS_TOKEN` environment variable
3. Run: `npm run populate:examples`
4. Monitor progress (~480 examples total = 24 techniques × 20)

---

## Files to Create/Modify

### Create

- `sudojo_api/src/routes/examples.ts` - CRUD API endpoints
- `sudojo_api/scripts/populate-board-techniques.ts` - Populate boards.techniques bitfield
- `sudojo_api/scripts/populate-examples.ts` - Populate technique_examples table

### Modify

- `sudojo_types/src/index.ts` - Add TechniqueId enum, bitfield utilities, types
- `sudojo_api/src/db/schema.ts` - Add techniqueExamples table
- `sudojo_api/src/routes/index.ts` - Register examples route
- `sudojo_api/package.json` - Add populate scripts

---

## Technique Reference

| ID | Technique | Bit |
|----|-----------|-----|
| 1 | Full House | 0x000001 |
| 2 | Hidden Single | 0x000002 |
| 3 | Naked Single | 0x000004 |
| 4 | Hidden Pair | 0x000008 |
| 5 | Naked Pair | 0x000010 |
| 6 | Locked Candidates | 0x000020 |
| 7 | Hidden Triple | 0x000040 |
| 8 | Naked Triple | 0x000080 |
| 9 | Hidden Quad | 0x000100 |
| 10 | Naked Quad | 0x000200 |
| 11 | X-Wing | 0x000400 |
| 12 | Swordfish | 0x000800 |
| 13 | Jellyfish | 0x001000 |
| 14 | XY-Wing | 0x002000 |
| 15 | Finned X-Wing | 0x004000 |
| 16 | Squirmbag | 0x008000 |
| 17 | Finned Swordfish | 0x010000 |
| 18 | Finned Jellyfish | 0x020000 |
| 19 | XYZ-Wing | 0x040000 |
| 20 | WXYZ-Wing | 0x080000 |
| 21 | Almost Locked Sets | 0x100000 |
| 22 | Finned Squirmbag | 0x200000 |
| 23 | ALS-Chain | 0x400000 |

---

## Notes

- The solver returns technique names in `hints.steps[].title`
- Use `TECHNIQUE_TITLE_TO_ID` to convert to numeric IDs
- Bitfield allows a single column to track multiple applicable techniques
- 23 bits needed for all techniques (fits in 32-bit integer)
- Population script may take time for rare techniques (Finned Squirmbag, ALS-Chain)
