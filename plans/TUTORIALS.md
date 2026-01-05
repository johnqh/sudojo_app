# Plan: Generate Comprehensive Technique Content with Images

## Overview
Generate detailed tutorial content for all 24 Sudoku techniques, including sample SVG images.

## Status
- **Image approach**: SVG Generator (approved)
- **SVG Generator**: `src/utils/sudokuSvgGenerator.ts` ✅
- **Preview page**: `/dev/technique-images` ✅
- **Example data**: `src/data/techniqueExamples.ts` (4 examples done)

## Current State
- **24 techniques** with HTML files in `/public/help/`
- **8 techniques missing images**: Jellyfish, Squirmbag, Hidden Quad, Hidden Triple, Naked Quad, ALS Chain, Finned Jellyfish, Finned Squirmbag
- **Content quality varies**: Some brief, some have errors (e.g., X-Wing has duplicate paragraph)

## Deliverables
1. Comprehensive tutorial HTML for each technique
2. SVG images showing technique examples

---

## Image Generation

### SVG Generator
**File**: `src/utils/sudokuSvgGenerator.ts`

```typescript
interface SvgGeneratorOptions {
  puzzle: string;           // 81-char board (0 = empty)
  userInput?: string;       // 81-char user entries
  pencilmarks?: string;     // Comma-delimited pencilmarks
  highlights?: {
    cells?: { row: number; col: number; fill: string }[];
    candidates?: { row: number; col: number; digit: number; color: string }[];
    rows?: { index: number; color: string }[];
    cols?: { index: number; color: string }[];
  };
  size?: number;            // SVG size (default 400)
  showPencilmarks?: boolean;
  darkMode?: boolean;
}

function generateSudokuSvg(options: SvgGeneratorOptions): string
```

### Technique Example Data
**File**: `src/data/techniqueExamples.ts`

```typescript
interface TechniqueExample {
  id: string;
  technique: string;
  puzzle: string;           // 81-char board state
  solution: string;         // 81-char solution
  pencilmarks?: string;     // For advanced techniques
  highlights: {
    cells?: { row: number; col: number; color: 'blue' | 'green' | 'yellow' | 'red' }[];
    candidates?: { row: number; col: number; digit: number; action: 'highlight' | 'eliminate' }[];
  };
  description: string;
}
```

---

## Content Structure

### Tutorial Template
Each technique tutorial will include:

1. **Title & Difficulty** - Name and skill level
2. **Overview** - What the technique does (1-2 sentences)
3. **Prerequisites** - Required knowledge (links to other techniques)
4. **How It Works** - Step-by-step explanation
5. **Visual Example** - SVG diagram with annotations
6. **Step-by-Step Walkthrough** - Detailed analysis of the example
7. **Tips & Common Mistakes** - Practical advice
8. **Practice** - Encourage using the app's levels

### Technique List (24 total)

**Beginner (6)**:
- Full House
- Naked Single
- Hidden Single
- Naked Pair
- Hidden Pair
- Locked Candidates

**Intermediate (9)**:
- Naked Triple
- Hidden Triple
- Naked Quad
- Hidden Quad
- X-Wing
- Swordfish
- Jellyfish
- Squirmbag
- XY-Wing

**Advanced (9)**:
- XYZ-Wing
- WXYZ-Wing
- Finned X-Wing
- Finned Swordfish
- Finned Jellyfish
- Finned Squirmbag
- Almost Locked Sets
- ALS-Chain

---

## Remaining Steps

### Step 1: Define all technique examples ⏳
Expand `src/data/techniqueExamples.ts` with puzzle data for all 24 techniques:
- Each example includes: puzzle, pencilmarks, highlights, description
- Need accurate puzzle states that demonstrate each technique

### Step 2: Generate SVG images ⏳
Using the preview page at `/dev/technique-images`:
- Generate SVG for each technique
- Save to `/public/help/` as `{technique_name}_1.svg`
- Convert to PNG if needed for HTML compatibility

### Step 3: Write comprehensive tutorials ⏳
Update each HTML file in `/public/help/`:

| # | File | Status | Notes |
|---|------|--------|-------|
| 1 | Full_House.html | ⏳ | |
| 2 | Naked_Single.html | ⏳ | |
| 3 | Hidden_Single.html | ⏳ | |
| 4 | Naked_Pair.html | ⏳ | |
| 5 | Hidden_Pair.html | ⏳ | |
| 6 | locked_set.html | ⏳ | |
| 7 | Naked_Triple.html | ⏳ | |
| 8 | Hidden_Triple.html | ⏳ | |
| 9 | Naked_Quad.html | ⏳ | Rename from Nakded_Quad.html |
| 10 | Hidden_Quad.html | ⏳ | Add image |
| 11 | X-Wing.html | ⏳ | Fix duplicate paragraph |
| 12 | Swordfish.html | ⏳ | |
| 13 | Jellyfish.html | ⏳ | Add image |
| 14 | Squirmbag.html | ⏳ | Add image |
| 15 | XY-Wing.html | ⏳ | |
| 16 | XYZ-Wing.html | ⏳ | |
| 17 | WXYZ-Wing.html | ⏳ | |
| 18 | Finned_X-Wing.html | ⏳ | |
| 19 | Finned_Swordfish.html | ⏳ | |
| 20 | Finned_Jellyfish.html | ⏳ | Add image |
| 21 | Finned_Squirmbag.html | ⏳ | Add image |
| 22 | Almost_Locked_Sets.html | ⏳ | |
| 23 | ALS-Chain.html | ⏳ | Add image |

---

## Files

### Created:
- ✅ `src/utils/sudokuSvgGenerator.ts` - SVG generator utility
- ✅ `src/pages/TechniqueImageGenerator.tsx` - Preview/download page
- ✅ `src/data/techniqueExamples.ts` - Example puzzle data

### Modified:
- ✅ `src/App.tsx` - Added dev route `/dev/technique-images`

### To Modify:
- ⏳ 23 HTML files in `/public/help/` - Comprehensive tutorials
- ⏳ Rename `Nakded_Quad.html` → `Naked_Quad.html`
