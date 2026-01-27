/**
 * Generate detailed hint explanations based on the hint payload
 * Similar to tutorial explanations but for live hints
 *
 * Each explanation is designed to teach the user WHY the technique works,
 * not just WHAT to do.
 */

import type { SolverHintStep } from '@sudobility/sudojo_client';

// Technique IDs (matching TECHNIQUE_TITLE_TO_ID)
const TECHNIQUE_IDS: Record<string, number> = {
  'Full House': 1,
  'Hidden Single': 2,
  'Naked Single': 3,
  'Hidden Pair': 4,
  'Naked Pair': 5,
  'Locked Candidates': 6,
  'Hidden Triple': 7,
  'Naked Triple': 8,
  'Hidden Quad': 9,
  'Naked Quad': 10,
  'X-Wing': 11,
  'Swordfish': 12,
  'Jellyfish': 13,
  'Squirmbag': 14,
  'XY-Wing': 15,
  'XYZ-Wing': 16,
  'WXYZ-Wing': 17,
  'Finned X-Wing': 18,
  'Finned Swordfish': 19,
  'Finned Jellyfish': 20,
  'Finned Squirmbag': 21,
  'Almost Locked Sets': 22,
  'ALS-Chain': 23,
};

// Cell notation (R1C1 format)
function cellName(row: number, col: number): string {
  return `R${row + 1}C${col + 1}`;
}

// Format a list of cells
function cellList(cells: Array<{ row: number; col: number }>): string {
  return cells.map(c => cellName(c.row, c.col)).join(', ');
}

// Format digit(s) - only valid Sudoku digits 1-9
function formatDigit(d: string | number): string {
  const s = String(d);
  return s >= '1' && s <= '9' ? s : '?';
}

// Format multiple digits as set - only valid Sudoku digits 1-9
function formatDigits(digits: string | string[]): string {
  const arr = Array.isArray(digits)
    ? digits.filter(d => d >= '1' && d <= '9')
    : digits.split('').filter(d => d >= '1' && d <= '9');
  if (arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  return `{${arr.sort().join(', ')}}`;
}

// Extract first valid Sudoku digit (1-9) from a string
function getFirstValidDigit(digits: string | undefined): string {
  if (!digits) return '?';
  for (const d of digits) {
    if (d >= '1' && d <= '9') return d;
  }
  return '?';
}

// Extract all valid Sudoku digits (1-9) from a string
function getValidDigits(digits: string | undefined): string[] {
  if (!digits) return [];
  return digits.split('').filter(d => d >= '1' && d <= '9');
}

// Get block number (1-9) from row/col
function getBlock(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3) + 1;
}

// Determine the common house for cells
function findCommonHouse(cells: Array<{ row: number; col: number }>): { type: 'row' | 'col' | 'block'; index: number; name: string } | null {
  if (cells.length < 2) return null;

  const sameRow = cells.every(c => c.row === cells[0].row);
  if (sameRow) {
    return { type: 'row', index: cells[0].row, name: `Row ${cells[0].row + 1}` };
  }

  const sameCol = cells.every(c => c.col === cells[0].col);
  if (sameCol) {
    return { type: 'col', index: cells[0].col, name: `Column ${cells[0].col + 1}` };
  }

  const sameBlock = cells.every(c => getBlock(c.row, c.col) === getBlock(cells[0].row, cells[0].col));
  if (sameBlock) {
    const block = getBlock(cells[0].row, cells[0].col);
    return { type: 'block', index: block, name: `Block ${block}` };
  }

  return null;
}

// Extract cells that have select action (digit placement)
// Note: select: "0" means no selection (placeholder), only 1-9 are valid digits
function getSelectCells(hint: SolverHintStep): Array<{ row: number; col: number; digit: string }> {
  return hint.cells
    .filter(c => c.actions.select && c.actions.select !== '' && c.actions.select !== '0')
    .map(c => ({ row: c.row, col: c.column, digit: c.actions.select }));
}

// Extract cells that have remove action (eliminations)
// Note: Filter out cells where remove only contains "0" (placeholder)
function getRemoveCells(hint: SolverHintStep): Array<{ row: number; col: number; digits: string }> {
  return hint.cells
    .filter(c => c.actions.remove && c.actions.remove !== '' && getValidDigits(c.actions.remove).length > 0)
    .map(c => ({ row: c.row, col: c.column, digits: c.actions.remove }));
}

// Extract cells that have highlight action (pattern cells)
// Note: Filter out cells where highlight only contains "0" (placeholder)
function getHighlightCells(hint: SolverHintStep): Array<{ row: number; col: number; digits: string }> {
  return hint.cells
    .filter(c => c.actions.highlight && c.actions.highlight !== '' && getValidDigits(c.actions.highlight).length > 0)
    .map(c => ({ row: c.row, col: c.column, digits: c.actions.highlight }));
}

/**
 * Generate detailed explanation for a hint
 */
export function generateDetailedExplanation(hint: SolverHintStep): string {
  const techniqueId = TECHNIQUE_IDS[hint.title];
  const selectCells = getSelectCells(hint);
  const removeCells = getRemoveCells(hint);
  const highlightCells = getHighlightCells(hint);

  // Technique-specific explanations
  switch (techniqueId) {
    case 1: // Full House
      return explainFullHouse(hint, selectCells);

    case 2: // Hidden Single
      return explainHiddenSingle(hint, selectCells);

    case 3: // Naked Single
      return explainNakedSingle(hint, selectCells);

    case 4: // Hidden Pair
      return explainHiddenPair(hint, highlightCells, removeCells);

    case 5: // Naked Pair
      return explainNakedPair(hint, highlightCells, removeCells);

    case 6: // Locked Candidates
      return explainLockedCandidates(hint, highlightCells, removeCells);

    case 7: // Hidden Triple
      return explainHiddenTriple(hint, highlightCells, removeCells);

    case 8: // Naked Triple
      return explainNakedTriple(hint, highlightCells, removeCells);

    case 9: // Hidden Quad
      return explainHiddenQuad(hint, highlightCells, removeCells);

    case 10: // Naked Quad
      return explainNakedQuad(hint, highlightCells, removeCells);

    case 11: // X-Wing
      return explainXWing(hint, highlightCells, removeCells);

    case 12: // Swordfish
      return explainSwordfish(hint, highlightCells, removeCells);

    case 13: // Jellyfish
      return explainJellyfish(hint, highlightCells, removeCells);

    case 14: // Squirmbag
      return explainSquirmbag(hint, highlightCells, removeCells);

    case 15: // XY-Wing
      return explainXYWing(hint, highlightCells, removeCells);

    case 16: // XYZ-Wing
      return explainXYZWing(hint, highlightCells, removeCells);

    case 17: // WXYZ-Wing
      return explainWXYZWing(hint, highlightCells, removeCells);

    case 18: // Finned X-Wing
      return explainFinnedXWing(hint, highlightCells, removeCells);

    case 19: // Finned Swordfish
      return explainFinnedSwordfish(hint, highlightCells, removeCells);

    case 20: // Finned Jellyfish
      return explainFinnedJellyfish(hint, highlightCells, removeCells);

    case 21: // Finned Squirmbag
      return explainFinnedSquirmbag(hint, highlightCells, removeCells);

    case 22: // Almost Locked Sets
      return explainAlmostLockedSets(hint, highlightCells, removeCells);

    case 23: // ALS-Chain
      return explainALSChain(hint, highlightCells, removeCells);

    default:
      // Generic explanation with action details
      return generateGenericExplanation(hint, selectCells, removeCells);
  }
}

/**
 * Full House: The last empty cell in a house.
 * When 8 of 9 cells in a row, column, or block are filled, the 9th cell
 * must contain the only missing digit.
 */
function explainFullHouse(
  hint: SolverHintStep,
  selectCells: Array<{ row: number; col: number; digit: string }>
): string {
  if (selectCells.length !== 1) return hint.text;

  const cell = selectCells[0];
  const digit = formatDigit(cell.digit);

  // Determine which house is full
  const area = hint.areas?.[0];
  let houseName = '';
  if (area) {
    if (area.type === 'row') houseName = `Row ${area.index + 1}`;
    else if (area.type === 'column') houseName = `Column ${area.index + 1}`;
    else if (area.type === 'block') houseName = `Block ${area.index + 1}`;
  }

  if (houseName) {
    return `${houseName} has 8 cells filled, leaving only ${cellName(cell.row, cell.col)} empty. ` +
      `The missing digit is ${digit} — place it here.`;
  }

  return `Cell ${cellName(cell.row, cell.col)} is the only empty cell in its house. ` +
    `Place ${digit} here.`;
}

/**
 * Hidden Single: A digit that can only go in one cell within a house.
 * Even though the cell may have multiple candidates, within its row, column,
 * or block, this is the ONLY cell where this specific digit can go.
 */
function explainHiddenSingle(
  hint: SolverHintStep,
  selectCells: Array<{ row: number; col: number; digit: string }>
): string {
  if (selectCells.length !== 1) return hint.text;

  const cell = selectCells[0];
  const digit = formatDigit(cell.digit);

  // Determine which house
  const area = hint.areas?.[0];
  let houseName: string;
  if (area) {
    houseName = area.type === 'row' ? `Row ${area.index + 1}` :
                area.type === 'column' ? `Column ${area.index + 1}` :
                `Block ${area.index + 1}`;
  } else {
    houseName = `Block ${getBlock(cell.row, cell.col)}`;
  }

  return `In ${houseName}, digit ${digit} can only go in one cell: ${cellName(cell.row, cell.col)}. ` +
    `Even though this cell may have other candidates, ${digit} has no other place in ${houseName.toLowerCase()}. ` +
    `Place ${digit} here.`;
}

/**
 * Naked Single: A cell with only one candidate remaining.
 * All other digits 1-9 have been eliminated by the cell's row, column, and block.
 */
function explainNakedSingle(
  hint: SolverHintStep,
  selectCells: Array<{ row: number; col: number; digit: string }>
): string {
  if (selectCells.length !== 1) return hint.text;

  const cell = selectCells[0];
  const digit = formatDigit(cell.digit);

  return `Cell ${cellName(cell.row, cell.col)} has only one candidate left: ${digit}. ` +
    `All other digits are eliminated by numbers already placed in its row, column, and block. ` +
    `Place ${digit} here.`;
}

/**
 * Hidden Pair: Two digits that can only appear in exactly two cells within a house.
 * These digits are "hidden" among other candidates in those cells.
 * Since these 2 digits MUST go in these 2 cells, all OTHER candidates can be
 * eliminated from these cells.
 */
function explainHiddenPair(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 2) return hint.text;

  const cells = highlightCells.slice(0, 2).map(c => ({ row: c.row, col: c.col }));
  const house = findCommonHouse(cells);
  const houseName = house?.name || 'their house';

  // Get the hidden digits from highlight
  const hiddenDigits = new Set<string>();
  highlightCells.slice(0, 2).forEach(c => {
    for (const d of getValidDigits(c.digits)) hiddenDigits.add(d);
  });
  const pairDigits = formatDigits(Array.from(hiddenDigits));

  // Get eliminations (other candidates in the pair cells)
  const eliminations = removeCells.filter(c =>
    cells.some(hc => hc.row === c.row && hc.col === c.col)
  );

  let explanation = `In ${houseName}, digits ${pairDigits} can ONLY appear in ${cellList(cells)}. `;
  explanation += `These form a Hidden Pair — the pair is "hidden" among other candidates. `;
  explanation += `Since ${pairDigits} must occupy these 2 cells, `;

  if (eliminations.length > 0) {
    const elimDigits = new Set<string>();
    eliminations.forEach(e => {
      for (const d of getValidDigits(e.digits)) elimDigits.add(d);
    });
    explanation += `eliminate the other candidates ${formatDigits(Array.from(elimDigits))} from these cells.`;
  } else {
    explanation += `other candidates can be eliminated.`;
  }

  return explanation;
}

/**
 * Naked Pair: Two cells in a house that contain exactly the same two candidates.
 * Since these 2 digits must go in these 2 cells (in some order), they can be
 * eliminated from all OTHER cells in the same house.
 */
function explainNakedPair(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 2) return hint.text;

  const cells = highlightCells.slice(0, 2).map(c => ({ row: c.row, col: c.col }));
  const house = findCommonHouse(cells);
  const houseName = house?.name || 'their shared house';

  const pairDigits = formatDigits(getValidDigits(highlightCells[0]?.digits));

  let explanation = `Cells ${cellList(cells)} both contain exactly ${pairDigits} as their only candidates. `;
  explanation += `This is a Naked Pair — the pair is "naked" because these cells show only these digits. `;
  explanation += `Since ${pairDigits} must go in these cells, `;

  if (removeCells.length > 0) {
    const elimCells = removeCells
      .filter(c => !cells.some(pc => pc.row === c.row && pc.col === c.col))
      .map(c => ({ row: c.row, col: c.col }));
    if (elimCells.length > 0) {
      explanation += `eliminate ${pairDigits} from other cells in ${houseName.toLowerCase()}: ${cellList(elimCells)}.`;
    } else {
      explanation += `they can be eliminated from other cells in the house.`;
    }
  }

  return explanation;
}

/**
 * Locked Candidates (Pointing/Claiming):
 * Type 1 (Pointing): Within a block, if a digit can only appear in cells that are
 *   all in the same row/column, eliminate that digit from other cells in that row/column.
 * Type 2 (Claiming): Within a row/column, if a digit can only appear in cells that are
 *   all in the same block, eliminate that digit from other cells in that block.
 */
function explainLockedCandidates(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 2) return hint.text;

  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const lockedDigit = formatDigit(getFirstValidDigit(highlightCells[0]?.digits));

  // Check alignment
  const sameRow = cells.every(c => c.row === cells[0].row);
  const sameCol = cells.every(c => c.col === cells[0].col);
  const sameBlock = cells.every(c => getBlock(c.row, c.col) === getBlock(cells[0].row, cells[0].col));

  const block = getBlock(cells[0].row, cells[0].col);
  const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));

  // Determine if this is Pointing (block → line) or Claiming (line → block)
  // by checking where eliminations occur
  const elimInSameBlock = elimCells.every(c => getBlock(c.row, c.col) === block);

  let explanation = '';

  if (sameBlock && (sameRow || sameCol)) {
    // Cells are in same block AND same line
    if (elimInSameBlock) {
      // Type 2: Claiming - eliminating from block
      const lineName = sameRow ? `Row ${cells[0].row + 1}` : `Column ${cells[0].col + 1}`;
      explanation = `In ${lineName}, digit ${lockedDigit} can only appear in Block ${block} (cells ${cellList(cells)}). `;
      explanation += `This "claims" ${lockedDigit} for this line within the block. `;
      if (elimCells.length > 0) {
        explanation += `Eliminate ${lockedDigit} from other cells in Block ${block}: ${cellList(elimCells)}.`;
      }
    } else {
      // Type 1: Pointing - eliminating from line
      const lineName = sameRow ? `Row ${cells[0].row + 1}` : `Column ${cells[0].col + 1}`;
      explanation = `In Block ${block}, digit ${lockedDigit} can only appear in ${lineName} (cells ${cellList(cells)}). `;
      explanation += `This "points" to ${lockedDigit} being restricted to this line. `;
      if (elimCells.length > 0) {
        explanation += `Eliminate ${lockedDigit} from ${cellList(elimCells)} in ${lineName} outside Block ${block}.`;
      }
    }
  } else if (sameRow) {
    explanation = `Digit ${lockedDigit} is locked to Row ${cells[0].row + 1} in these cells: ${cellList(cells)}. `;
    if (elimCells.length > 0) {
      explanation += `Eliminate ${lockedDigit} from ${cellList(elimCells)}.`;
    }
  } else if (sameCol) {
    explanation = `Digit ${lockedDigit} is locked to Column ${cells[0].col + 1} in these cells: ${cellList(cells)}. `;
    if (elimCells.length > 0) {
      explanation += `Eliminate ${lockedDigit} from ${cellList(elimCells)}.`;
    }
  } else {
    explanation = `Locked Candidates pattern for digit ${lockedDigit}. `;
    if (elimCells.length > 0) {
      explanation += `Eliminate ${lockedDigit} from ${cellList(elimCells)}.`;
    }
  }

  return explanation;
}

/**
 * Hidden Triple: Three digits that can only appear in exactly three cells within a house.
 * All other candidates can be eliminated from these three cells.
 */
function explainHiddenTriple(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 3) return hint.text;

  const cells = highlightCells.slice(0, 3).map(c => ({ row: c.row, col: c.col }));
  const house = findCommonHouse(cells);
  const houseName = house?.name || 'their house';

  const hiddenDigits = new Set<string>();
  highlightCells.slice(0, 3).forEach(c => {
    for (const d of getValidDigits(c.digits)) hiddenDigits.add(d);
  });
  const tripleDigits = formatDigits(Array.from(hiddenDigits));

  let explanation = `In ${houseName}, digits ${tripleDigits} can ONLY appear in cells ${cellList(cells)}. `;
  explanation += `This is a Hidden Triple — these 3 digits are "hidden" among other candidates. `;
  explanation += `Since ${tripleDigits} must occupy these 3 cells, `;

  if (removeCells.length > 0) {
    const elimDigits = new Set<string>();
    removeCells.filter(c => cells.some(hc => hc.row === c.row && hc.col === c.col))
      .forEach(e => { for (const d of getValidDigits(e.digits)) elimDigits.add(d); });
    if (elimDigits.size > 0) {
      explanation += `eliminate the other candidates ${formatDigits(Array.from(elimDigits))} from these cells.`;
    } else {
      explanation += `other candidates can be eliminated.`;
    }
  } else {
    explanation += `other candidates can be eliminated.`;
  }

  return explanation;
}

/**
 * Naked Triple: Three cells in a house that together contain only three candidates total.
 * Note: Each cell doesn't need all 3 digits — they just collectively have only these 3.
 * These digits can be eliminated from other cells in the house.
 */
function explainNakedTriple(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 3) return hint.text;

  const cells = highlightCells.slice(0, 3).map(c => ({ row: c.row, col: c.col }));
  const house = findCommonHouse(cells);
  const houseName = house?.name || 'their house';

  const nakedDigits = new Set<string>();
  highlightCells.slice(0, 3).forEach(c => {
    for (const d of getValidDigits(c.digits)) nakedDigits.add(d);
  });
  const tripleDigits = formatDigits(Array.from(nakedDigits));

  let explanation = `Cells ${cellList(cells)} together contain only the candidates ${tripleDigits}. `;
  explanation += `This is a Naked Triple — these 3 cells share only 3 digits between them. `;
  explanation += `Since ${tripleDigits} must go in these cells, `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.filter(c => !cells.some(nc => nc.row === c.row && nc.col === c.col));
    if (elimCells.length > 0) {
      explanation += `eliminate ${tripleDigits} from other cells in ${houseName.toLowerCase()}: ${cellList(elimCells.map(c => ({ row: c.row, col: c.col })))}.`;
    } else {
      explanation += `they can be eliminated from other cells.`;
    }
  } else {
    explanation += `they can be eliminated from other cells.`;
  }

  return explanation;
}

/**
 * Hidden Quad: Four digits that can only appear in exactly four cells within a house.
 */
function explainHiddenQuad(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 4) return hint.text;

  const cells = highlightCells.slice(0, 4).map(c => ({ row: c.row, col: c.col }));
  const house = findCommonHouse(cells);
  const houseName = house?.name || 'their house';

  const hiddenDigits = new Set<string>();
  highlightCells.slice(0, 4).forEach(c => {
    for (const d of getValidDigits(c.digits)) hiddenDigits.add(d);
  });
  const quadDigits = formatDigits(Array.from(hiddenDigits));

  let explanation = `In ${houseName}, digits ${quadDigits} can ONLY appear in cells ${cellList(cells)}. `;
  explanation += `This is a Hidden Quad — 4 digits restricted to 4 cells. `;

  if (removeCells.length > 0) {
    const elimDigits = new Set<string>();
    removeCells.filter(c => cells.some(hc => hc.row === c.row && hc.col === c.col))
      .forEach(e => { for (const d of getValidDigits(e.digits)) elimDigits.add(d); });
    if (elimDigits.size > 0) {
      explanation += `Eliminate the other candidates ${formatDigits(Array.from(elimDigits))} from these cells.`;
    }
  }

  return explanation;
}

/**
 * Naked Quad: Four cells in a house that together contain only four candidates total.
 */
function explainNakedQuad(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 4) return hint.text;

  const cells = highlightCells.slice(0, 4).map(c => ({ row: c.row, col: c.col }));
  const house = findCommonHouse(cells);
  const houseName = house?.name || 'their house';

  const nakedDigits = new Set<string>();
  highlightCells.slice(0, 4).forEach(c => {
    for (const d of getValidDigits(c.digits)) nakedDigits.add(d);
  });
  const quadDigits = formatDigits(Array.from(nakedDigits));

  let explanation = `Cells ${cellList(cells)} together contain only the candidates ${quadDigits}. `;
  explanation += `This is a Naked Quad — 4 cells sharing only 4 digits. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.filter(c => !cells.some(nc => nc.row === c.row && nc.col === c.col));
    if (elimCells.length > 0) {
      explanation += `Eliminate ${quadDigits} from other cells in ${houseName.toLowerCase()}: ${cellList(elimCells.map(c => ({ row: c.row, col: c.col })))}.`;
    }
  }

  return explanation;
}

/**
 * X-Wing: A 2x2 fish pattern.
 * When a digit appears in exactly 2 cells in each of 2 rows, and those cells
 * align in the same 2 columns, the digit is eliminated from other cells in those columns.
 * (Or vice versa: 2 columns → eliminate from rows)
 */
function explainXWing(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 4) return hint.text;

  const digit = formatDigit(getFirstValidDigit(highlightCells[0]?.digits));
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort((a, b) => a - b);
  const cols = [...new Set(cells.map(c => c.col))].sort((a, b) => a - b);
  const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));

  // Determine if row-based or column-based by checking elimination pattern
  const elimInCols = elimCells.length > 0 && elimCells.every(c => cols.includes(c.col));

  let explanation = '';
  if (elimInCols || rows.length === 2) {
    // Row-based X-Wing: pattern in rows, eliminate from columns
    explanation = `X-Wing found for digit ${digit}. `;
    explanation += `In Rows ${rows.map(r => r + 1).join(' and ')}, digit ${digit} appears only in Columns ${cols.map(c => c + 1).join(' and ')}. `;
    explanation += `This forms a rectangle where ${digit} must occupy two opposite corners. `;
  } else {
    // Column-based X-Wing: pattern in columns, eliminate from rows
    explanation = `X-Wing found for digit ${digit}. `;
    explanation += `In Columns ${cols.map(c => c + 1).join(' and ')}, digit ${digit} appears only in Rows ${rows.map(r => r + 1).join(' and ')}. `;
    explanation += `This forms a rectangle where ${digit} must occupy two opposite corners. `;
  }

  if (elimCells.length > 0) {
    explanation += `Eliminate ${digit} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

/**
 * Swordfish: A 3x3 fish pattern.
 * In 3 rows, if a digit appears in only 2-3 cells each, and those cells collectively
 * span exactly 3 columns, eliminate from other cells in those columns.
 */
function explainSwordfish(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 6) return hint.text;

  const digit = formatDigit(getFirstValidDigit(highlightCells[0]?.digits));
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort((a, b) => a - b);
  const cols = [...new Set(cells.map(c => c.col))].sort((a, b) => a - b);
  const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));

  let explanation = `Swordfish found for digit ${digit}. `;
  explanation += `In Rows ${rows.map(r => r + 1).join(', ')}, digit ${digit} is restricted to Columns ${cols.map(c => c + 1).join(', ')}. `;
  explanation += `This 3×3 fish pattern means ${digit} must appear once per row in these columns. `;

  if (elimCells.length > 0) {
    explanation += `Eliminate ${digit} from other cells in these columns: ${cellList(elimCells)}.`;
  }

  return explanation;
}

/**
 * Jellyfish: A 4x4 fish pattern.
 */
function explainJellyfish(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 8) return hint.text;

  const digit = formatDigit(getFirstValidDigit(highlightCells[0]?.digits));
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort((a, b) => a - b);
  const cols = [...new Set(cells.map(c => c.col))].sort((a, b) => a - b);
  const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));

  let explanation = `Jellyfish found for digit ${digit}. `;
  explanation += `In Rows ${rows.map(r => r + 1).join(', ')}, digit ${digit} is restricted to Columns ${cols.map(c => c + 1).join(', ')}. `;
  explanation += `This 4×4 fish pattern locks ${digit} within these intersections. `;

  if (elimCells.length > 0) {
    explanation += `Eliminate ${digit} from other cells in these columns: ${cellList(elimCells)}.`;
  }

  return explanation;
}

/**
 * Squirmbag: A 5x5 fish pattern (rarely seen in practice).
 */
function explainSquirmbag(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 10) return hint.text;

  const digit = formatDigit(getFirstValidDigit(highlightCells[0]?.digits));
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort((a, b) => a - b);
  const cols = [...new Set(cells.map(c => c.col))].sort((a, b) => a - b);
  const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));

  let explanation = `Squirmbag (5-fish) found for digit ${digit}. `;
  explanation += `Across Rows ${rows.map(r => r + 1).join(', ')}, digit ${digit} is confined to Columns ${cols.map(c => c + 1).join(', ')}. `;
  explanation += `This rare 5×5 fish pattern restricts ${digit} to these intersections. `;

  if (elimCells.length > 0) {
    explanation += `Eliminate ${digit} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

/**
 * XY-Wing: Three cells forming a bent pattern with bivalve cells.
 * - Pivot cell has candidates XY
 * - Wing 1 (sees pivot) has candidates XZ
 * - Wing 2 (sees pivot) has candidates YZ
 * The common digit Z appears in both wings. If pivot=X → Wing1=Z.
 * If pivot=Y → Wing2=Z. Either way, Z is forced in one wing.
 * Eliminate Z from cells that see BOTH wings.
 */
function explainXYWing(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 3) return hint.text;

  const cells = highlightCells.slice(0, 3).map(c => ({ row: c.row, col: c.col, digits: getValidDigits(c.digits) }));

  // Try to identify pivot (has 2 candidates) and wings
  // Pivot connects to both wings; wings share a common digit Z
  let explanation = `XY-Wing pattern found. `;

  // Find the common digit (Z) that appears in eliminations
  const zDigit = removeCells.length > 0 ? formatDigit(getFirstValidDigit(removeCells[0]?.digits)) : '?';

  explanation += `Three cells form a "bent triple": ${cellList(cells)}. `;
  explanation += `The pivot cell sees both wing cells, and each wing contains the digit ${zDigit}. `;
  explanation += `If the pivot takes one value, one wing gets ${zDigit}. If it takes the other, the other wing gets ${zDigit}. `;
  explanation += `Either way, ${zDigit} must appear in one of the wings. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminate ${zDigit} from cells that see both wings: ${cellList(elimCells)}.`;
  }

  return explanation;
}

/**
 * XYZ-Wing: Similar to XY-Wing but pivot has 3 candidates (XYZ).
 * - Pivot has XYZ
 * - Wing 1 has XZ
 * - Wing 2 has YZ
 * Z is common to all three cells. Eliminate Z from cells that see ALL THREE pattern cells.
 */
function explainXYZWing(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 3) return hint.text;

  const cells = highlightCells.slice(0, 3).map(c => ({ row: c.row, col: c.col }));
  const zDigit = removeCells.length > 0 ? formatDigit(getFirstValidDigit(removeCells[0]?.digits)) : '?';

  let explanation = `XYZ-Wing pattern found. `;
  explanation += `The pivot cell has 3 candidates (XYZ), and two wing cells each have 2 candidates. `;
  explanation += `Cells: ${cellList(cells)}. `;
  explanation += `The digit ${zDigit} appears in all three pattern cells. `;
  explanation += `One of these cells MUST contain ${zDigit}. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminate ${zDigit} from cells that see all three: ${cellList(elimCells)}.`;
  }

  return explanation;
}

/**
 * WXYZ-Wing: Four cells with four candidates total (WXYZ).
 * The "restricted common" digit can be eliminated from cells that see all its instances.
 */
function explainWXYZWing(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 4) return hint.text;

  const cells = highlightCells.slice(0, 4).map(c => ({ row: c.row, col: c.col }));
  const elimDigit = removeCells.length > 0 ? formatDigit(getFirstValidDigit(removeCells[0]?.digits)) : '?';

  // Collect all candidates
  const allDigits = new Set<string>();
  highlightCells.slice(0, 4).forEach(c => {
    for (const d of getValidDigits(c.digits)) allDigits.add(d);
  });

  let explanation = `WXYZ-Wing pattern found. `;
  explanation += `Four cells ${cellList(cells)} contain exactly 4 candidates: ${formatDigits(Array.from(allDigits))}. `;
  explanation += `One of these cells must contain ${elimDigit}. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminate ${elimDigit} from cells that see all instances of ${elimDigit} in the pattern: ${cellList(elimCells)}.`;
  }

  return explanation;
}

/**
 * Finned Fish patterns (X-Wing, Swordfish, Jellyfish, Squirmbag):
 * A "fin" is an extra candidate that breaks the perfect fish pattern.
 * Eliminations are restricted to cells that see both the base pattern AND the fin.
 */
function explainFinnedXWing(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 4) return hint.text;

  const digit = formatDigit(getFirstValidDigit(highlightCells[0]?.digits));
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort((a, b) => a - b);
  const cols = [...new Set(cells.map(c => c.col))].sort((a, b) => a - b);
  const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));

  let explanation = `Finned X-Wing for digit ${digit}. `;
  explanation += `An X-Wing pattern exists in Rows ${rows.map(r => r + 1).join(' and ')}, Columns ${cols.slice(0, 2).map(c => c + 1).join(' and ')}, `;
  explanation += `but with an extra "fin" candidate that breaks the perfect rectangle. `;
  explanation += `The fin limits eliminations to cells that see both the pattern and the fin. `;

  if (elimCells.length > 0) {
    explanation += `Eliminate ${digit} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

function explainFinnedSwordfish(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 6) return hint.text;

  const digit = formatDigit(getFirstValidDigit(highlightCells[0]?.digits));
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort((a, b) => a - b);
  const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));

  let explanation = `Finned Swordfish for digit ${digit}. `;
  explanation += `A Swordfish pattern exists across Rows ${rows.map(r => r + 1).join(', ')}, `;
  explanation += `but with an extra "fin" that restricts eliminations. `;
  explanation += `Only cells seeing both the pattern and fin can have ${digit} eliminated. `;

  if (elimCells.length > 0) {
    explanation += `Eliminate ${digit} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

function explainFinnedJellyfish(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 8) return hint.text;

  const digit = formatDigit(getFirstValidDigit(highlightCells[0]?.digits));
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort((a, b) => a - b);
  const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));

  let explanation = `Finned Jellyfish for digit ${digit}. `;
  explanation += `A Jellyfish pattern exists across Rows ${rows.map(r => r + 1).join(', ')}, `;
  explanation += `with an extra "fin" candidate. `;

  if (elimCells.length > 0) {
    explanation += `Eliminate ${digit} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

function explainFinnedSquirmbag(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 10) return hint.text;

  const digit = formatDigit(getFirstValidDigit(highlightCells[0]?.digits));
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort((a, b) => a - b);
  const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));

  let explanation = `Finned Squirmbag (5-fish) for digit ${digit}. `;
  explanation += `A rare 5-fish pattern across Rows ${rows.map(r => r + 1).join(', ')}, with a fin. `;

  if (elimCells.length > 0) {
    explanation += `Eliminate ${digit} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

/**
 * Almost Locked Sets (ALS):
 * N cells in a house containing exactly N+1 candidates.
 * If any candidate is eliminated, the remaining N become a locked set.
 */
function explainAlmostLockedSets(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 2) return hint.text;

  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const house = findCommonHouse(cells);
  const houseName = house?.name || 'their shared house';

  const alsDigits = new Set<string>();
  highlightCells.forEach(c => {
    for (const d of getValidDigits(c.digits)) alsDigits.add(d);
  });

  const n = highlightCells.length;
  const nPlus1 = alsDigits.size;

  let explanation = `Almost Locked Set (ALS) in ${houseName}. `;
  explanation += `Cells ${cellList(cells)} (${n} cells) contain ${nPlus1} candidates: ${formatDigits(Array.from(alsDigits))}. `;
  explanation += `Since there's one "extra" candidate, if ANY digit is removed externally, `;
  explanation += `the remaining ${n} candidates lock into these ${n} cells. `;

  if (removeCells.length > 0) {
    const elimDigits = new Set<string>();
    removeCells.forEach(c => {
      for (const d of getValidDigits(c.digits)) elimDigits.add(d);
    });
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminate ${formatDigits(Array.from(elimDigits))} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

/**
 * ALS-Chain (ALS-XZ):
 * Two ALS connected by a Restricted Common Candidate (RCC).
 * The RCC can only be true in one of the ALS.
 * Any digit that sees all its instances in both ALS can be eliminated.
 */
function explainALSChain(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 4) return hint.text;

  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));

  const allDigits = new Set<string>();
  highlightCells.forEach(c => {
    for (const d of getValidDigits(c.digits)) allDigits.add(d);
  });

  let explanation = `ALS-XZ (ALS-Chain) pattern. `;
  explanation += `Two Almost Locked Sets share a Restricted Common Candidate (RCC). `;
  explanation += `Pattern cells: ${cellList(cells)}. `;
  explanation += `The RCC can only be true in one ALS, which forces the other ALS to become fully locked. `;

  if (removeCells.length > 0) {
    const elimDigits = new Set<string>();
    removeCells.forEach(c => {
      for (const d of getValidDigits(c.digits)) elimDigits.add(d);
    });
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminate ${formatDigits(Array.from(elimDigits))} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

/**
 * Generic explanation for unknown or unsupported techniques.
 */
function generateGenericExplanation(
  hint: SolverHintStep,
  selectCells: Array<{ row: number; col: number; digit: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  const parts: string[] = [];

  // Start with original text from solver
  parts.push(hint.text);

  // Add details about actions
  if (selectCells.length > 0) {
    const placements = selectCells.map(c => `${formatDigit(c.digit)} in ${cellName(c.row, c.col)}`);
    parts.push(`Place: ${placements.join(', ')}.`);
  }

  if (removeCells.length > 0) {
    const eliminations = removeCells.map(c => `${formatDigits(c.digits)} from ${cellName(c.row, c.col)}`);
    if (eliminations.length <= 5) {
      parts.push(`Eliminate: ${eliminations.join('; ')}.`);
    } else {
      parts.push(`Eliminate candidates from ${removeCells.length} cells.`);
    }
  }

  return parts.join(' ');
}

/**
 * Get a summary of the hint action (what to do)
 */
export function getHintActionSummary(hint: SolverHintStep): string {
  const selectCells = getSelectCells(hint);
  const removeCells = getRemoveCells(hint);

  if (selectCells.length > 0) {
    if (selectCells.length === 1) {
      const c = selectCells[0];
      return `Place ${formatDigit(c.digit)} in ${cellName(c.row, c.col)}`;
    }
    return `Place digits in ${selectCells.length} cells`;
  }

  if (removeCells.length > 0) {
    const allDigits = new Set<string>();
    removeCells.forEach(c => {
      for (const d of getValidDigits(c.digits)) allDigits.add(d);
    });
    return `Eliminate ${formatDigits(Array.from(allDigits))} from ${removeCells.length} cell${removeCells.length > 1 ? 's' : ''}`;
  }

  return 'Apply the technique';
}
