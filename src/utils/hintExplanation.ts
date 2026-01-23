/**
 * Generate detailed hint explanations based on the hint payload
 * Similar to tutorial explanations but for live hints
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

// Format digit(s)
function formatDigit(d: string | number): string {
  return String(d);
}

// Format multiple digits as set
function formatDigits(digits: string | string[]): string {
  const arr = Array.isArray(digits) ? digits : digits.split('').filter(d => d.match(/\d/));
  if (arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  return `{${arr.sort().join(', ')}}`;
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
function getSelectCells(hint: SolverHintStep): Array<{ row: number; col: number; digit: string }> {
  return hint.cells
    .filter(c => c.actions.select && c.actions.select !== '')
    .map(c => ({ row: c.row, col: c.column, digit: c.actions.select }));
}

// Extract cells that have remove action (eliminations)
function getRemoveCells(hint: SolverHintStep): Array<{ row: number; col: number; digits: string }> {
  return hint.cells
    .filter(c => c.actions.remove && c.actions.remove !== '')
    .map(c => ({ row: c.row, col: c.column, digits: c.actions.remove }));
}

// Extract cells that have highlight action (pattern cells)
function getHighlightCells(hint: SolverHintStep): Array<{ row: number; col: number; digits: string }> {
  return hint.cells
    .filter(c => c.actions.highlight && c.actions.highlight !== '')
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
      return explainHiddenSingle(hint, selectCells, highlightCells);

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
      return generateGenericExplanation(hint, selectCells, removeCells, highlightCells);
  }
}

// Full House: One cell left in a house
function explainFullHouse(
  hint: SolverHintStep,
  selectCells: Array<{ row: number; col: number; digit: string }>
): string {
  if (selectCells.length !== 1) return hint.text;

  const cell = selectCells[0];
  const digit = cell.digit;

  // Determine which house is full
  const area = hint.areas?.[0];
  let houseName = '';
  if (area) {
    if (area.type === 'row') houseName = `Row ${area.index + 1}`;
    else if (area.type === 'column') houseName = `Column ${area.index + 1}`;
    else if (area.type === 'block') houseName = `Block ${area.index + 1}`;
  }

  if (houseName) {
    return `${houseName} has 8 cells filled. The only empty cell is ${cellName(cell.row, cell.col)}. ` +
      `The missing digit is ${formatDigit(digit)} — place it here.`;
  }

  return `Cell ${cellName(cell.row, cell.col)} is the only empty cell in its house. ` +
    `Place ${formatDigit(digit)} here.`;
}

// Hidden Single: One place for a digit in a house
function explainHiddenSingle(
  hint: SolverHintStep,
  selectCells: Array<{ row: number; col: number; digit: string }>,
  _highlightCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (selectCells.length !== 1) return hint.text;

  const cell = selectCells[0];
  const digit = cell.digit;
  const block = getBlock(cell.row, cell.col);

  // Determine which house
  const area = hint.areas?.[0];
  let houseName = area
    ? (area.type === 'row' ? `Row ${area.index + 1}` : area.type === 'column' ? `Column ${area.index + 1}` : `Block ${area.index + 1}`)
    : `Block ${block}`;

  return `In ${houseName}, the digit ${formatDigit(digit)} can only go in cell ${cellName(cell.row, cell.col)}. ` +
    `This is a Hidden Single — place ${formatDigit(digit)} here.`;
}

// Naked Single: Only one candidate in a cell
function explainNakedSingle(
  hint: SolverHintStep,
  selectCells: Array<{ row: number; col: number; digit: string }>
): string {
  if (selectCells.length !== 1) return hint.text;

  const cell = selectCells[0];
  const digit = cell.digit;

  return `Cell ${cellName(cell.row, cell.col)} has only one possible candidate: ${formatDigit(digit)}. ` +
    `All other digits are eliminated by its row, column, and block. Place ${formatDigit(digit)} here.`;
}

// Hidden Pair: Two digits in exactly two cells
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
  highlightCells.forEach(c => {
    for (const d of c.digits) {
      hiddenDigits.add(d);
    }
  });

  const eliminations = removeCells.filter(c =>
    cells.some(hc => hc.row === c.row && hc.col === c.col)
  );

  let explanation = `In ${houseName}, cells ${cellList(cells)} are the only places for digits ${formatDigits(Array.from(hiddenDigits))}. `;
  explanation += `This is a Hidden Pair. `;

  if (eliminations.length > 0) {
    const elimDigits = new Set<string>();
    eliminations.forEach(e => {
      for (const d of e.digits) elimDigits.add(d);
    });
    explanation += `Eliminate ${formatDigits(Array.from(elimDigits))} from these cells.`;
  }

  return explanation;
}

// Naked Pair: Two cells with exactly the same two candidates
function explainNakedPair(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 2) return hint.text;

  const cells = highlightCells.slice(0, 2).map(c => ({ row: c.row, col: c.col }));
  const house = findCommonHouse(cells);
  const houseName = house?.name || 'their shared house';

  // Get the pair digits
  const pairDigits = highlightCells[0]?.digits || '';

  let explanation = `Cells ${cellList(cells)} both contain exactly ${formatDigits(pairDigits)}. `;
  explanation += `This is a Naked Pair in ${houseName}. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.filter(c =>
      !cells.some(pc => pc.row === c.row && pc.col === c.col)
    );
    if (elimCells.length > 0) {
      explanation += `Eliminate ${formatDigits(pairDigits)} from ${cellList(elimCells.map(c => ({ row: c.row, col: c.col })))}.`;
    }
  }

  return explanation;
}

// Locked Candidates
function explainLockedCandidates(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 2) return hint.text;

  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const block = getBlock(cells[0].row, cells[0].col);

  // Determine alignment
  const sameRow = cells.every(c => c.row === cells[0].row);
  const sameCol = cells.every(c => c.col === cells[0].col);

  // Get the locked digit
  const lockedDigit = highlightCells[0]?.digits?.[0] || '?';

  let explanation = '';
  if (sameRow) {
    explanation = `In Block ${block}, digit ${formatDigit(lockedDigit)} only appears in Row ${cells[0].row + 1} (cells ${cellList(cells)}). `;
    if (removeCells.length > 0) {
      const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
      explanation += `Eliminate ${formatDigit(lockedDigit)} from ${cellList(elimCells)} in Row ${cells[0].row + 1} outside Block ${block}.`;
    }
  } else if (sameCol) {
    explanation = `In Block ${block}, digit ${formatDigit(lockedDigit)} only appears in Column ${cells[0].col + 1} (cells ${cellList(cells)}). `;
    if (removeCells.length > 0) {
      const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
      explanation += `Eliminate ${formatDigit(lockedDigit)} from ${cellList(elimCells)} in Column ${cells[0].col + 1} outside Block ${block}.`;
    }
  } else {
    explanation = `The highlighted cells show Locked Candidates for digit ${formatDigit(lockedDigit)}.`;
  }

  return explanation;
}

// Hidden Triple
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
    for (const d of c.digits) hiddenDigits.add(d);
  });

  let explanation = `In ${houseName}, cells ${cellList(cells)} are the only places for digits ${formatDigits(Array.from(hiddenDigits))}. `;
  explanation += `This is a Hidden Triple. `;

  if (removeCells.length > 0) {
    const elimDigits = new Set<string>();
    removeCells.filter(c => cells.some(hc => hc.row === c.row && hc.col === c.col))
      .forEach(e => { for (const d of e.digits) elimDigits.add(d); });
    if (elimDigits.size > 0) {
      explanation += `Eliminate ${formatDigits(Array.from(elimDigits))} from these cells.`;
    }
  }

  return explanation;
}

// Naked Triple
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
    for (const d of c.digits) nakedDigits.add(d);
  });

  let explanation = `In ${houseName}, cells ${cellList(cells)} together contain only ${formatDigits(Array.from(nakedDigits))}. `;
  explanation += `This is a Naked Triple. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.filter(c => !cells.some(nc => nc.row === c.row && nc.col === c.col));
    if (elimCells.length > 0) {
      explanation += `Eliminate ${formatDigits(Array.from(nakedDigits))} from ${cellList(elimCells.map(c => ({ row: c.row, col: c.col })))}.`;
    }
  }

  return explanation;
}

// Hidden Quad
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
    for (const d of c.digits) hiddenDigits.add(d);
  });

  let explanation = `In ${houseName}, cells ${cellList(cells)} are the only places for digits ${formatDigits(Array.from(hiddenDigits))}. `;
  explanation += `This is a Hidden Quad. `;

  if (removeCells.length > 0) {
    const elimDigits = new Set<string>();
    removeCells.filter(c => cells.some(hc => hc.row === c.row && hc.col === c.col))
      .forEach(e => { for (const d of e.digits) elimDigits.add(d); });
    if (elimDigits.size > 0) {
      explanation += `Eliminate ${formatDigits(Array.from(elimDigits))} from these cells.`;
    }
  }

  return explanation;
}

// Naked Quad
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
    for (const d of c.digits) nakedDigits.add(d);
  });

  let explanation = `In ${houseName}, cells ${cellList(cells)} together contain only ${formatDigits(Array.from(nakedDigits))}. `;
  explanation += `This is a Naked Quad. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.filter(c => !cells.some(nc => nc.row === c.row && nc.col === c.col));
    if (elimCells.length > 0) {
      explanation += `Eliminate ${formatDigits(Array.from(nakedDigits))} from ${cellList(elimCells.map(c => ({ row: c.row, col: c.col })))}.`;
    }
  }

  return explanation;
}

// X-Wing
function explainXWing(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 4) return hint.text;

  const digit = highlightCells[0]?.digits?.[0] || '?';
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));

  // Get the rows and columns
  const rows = [...new Set(cells.map(c => c.row))].sort();
  const cols = [...new Set(cells.map(c => c.col))].sort();

  let explanation = `Digit ${formatDigit(digit)} forms an X-Wing pattern. `;
  explanation += `In Rows ${rows.map(r => r + 1).join(' and ')}, this digit only appears in Columns ${cols.map(c => c + 1).join(' and ')}. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminate ${formatDigit(digit)} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

// Swordfish
function explainSwordfish(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 6) return hint.text;

  const digit = highlightCells[0]?.digits?.[0] || '?';
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort();
  const cols = [...new Set(cells.map(c => c.col))].sort();

  let explanation = `Digit ${formatDigit(digit)} forms a Swordfish pattern across 3 rows and 3 columns. `;
  explanation += `Rows: ${rows.map(r => r + 1).join(', ')}. Columns: ${cols.map(c => c + 1).join(', ')}. `;

  if (removeCells.length > 0) {
    explanation += `Eliminate ${formatDigit(digit)} from cells in these columns outside the pattern rows.`;
  }

  return explanation;
}

// Jellyfish
function explainJellyfish(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 8) return hint.text;

  const digit = highlightCells[0]?.digits?.[0] || '?';

  let explanation = `Digit ${formatDigit(digit)} forms a Jellyfish pattern across 4 rows and 4 columns. `;

  if (removeCells.length > 0) {
    explanation += `Eliminate ${formatDigit(digit)} from the affected cells outside the pattern.`;
  }

  return explanation;
}

// XY-Wing
function explainXYWing(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 3) return hint.text;

  const cells = highlightCells.slice(0, 3);

  let explanation = `XY-Wing pattern found. The pivot cell and two wing cells form a pattern. `;
  explanation += `Cells: ${cellList(cells.map(c => ({ row: c.row, col: c.col })))}. `;

  if (removeCells.length > 0) {
    const zDigit = removeCells[0]?.digits?.[0] || '?';
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `The Z candidate ${formatDigit(zDigit)} can be eliminated from ${cellList(elimCells)}.`;
  }

  return explanation;
}

// XYZ-Wing
function explainXYZWing(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 3) return hint.text;

  const cells = highlightCells.slice(0, 3);

  let explanation = `XYZ-Wing pattern found. The pivot has 3 candidates, wings have 2 each. `;
  explanation += `Cells: ${cellList(cells.map(c => ({ row: c.row, col: c.col })))}. `;

  if (removeCells.length > 0) {
    const zDigit = removeCells[0]?.digits?.[0] || '?';
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminate ${formatDigit(zDigit)} from cells that see all three pattern cells: ${cellList(elimCells)}.`;
  }

  return explanation;
}

// WXYZ-Wing
function explainWXYZWing(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 4) return hint.text;

  const cells = highlightCells.slice(0, 4);

  let explanation = `WXYZ-Wing pattern found with 4 cells and 4 candidates. `;
  explanation += `Cells: ${cellList(cells.map(c => ({ row: c.row, col: c.col })))}. `;

  if (removeCells.length > 0) {
    const elimDigit = removeCells[0]?.digits?.[0] || '?';
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminate ${formatDigit(elimDigit)} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

// Squirmbag (5-fish pattern)
function explainSquirmbag(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 10) return hint.text;

  const digit = highlightCells[0]?.digits?.[0] || '?';
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort();
  const cols = [...new Set(cells.map(c => c.col))].sort();

  let explanation = `Digit ${formatDigit(digit)} forms a Squirmbag (5-fish) pattern. `;
  explanation += `This advanced pattern spans 5 rows (${rows.map(r => r + 1).join(', ')}) and 5 columns (${cols.map(c => c + 1).join(', ')}). `;
  explanation += `In these rows, digit ${formatDigit(digit)} only appears in these specific columns. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminate ${formatDigit(digit)} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

// Finned X-Wing
function explainFinnedXWing(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 4) return hint.text;

  const digit = highlightCells[0]?.digits?.[0] || '?';
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort();
  const cols = [...new Set(cells.map(c => c.col))].sort();

  let explanation = `Finned X-Wing found for digit ${formatDigit(digit)}. `;
  explanation += `This is an X-Wing pattern in Rows ${rows.map(r => r + 1).join(' and ')} with an extra "fin" candidate. `;
  explanation += `The base pattern uses Columns ${cols.slice(0, 2).map(c => c + 1).join(' and ')}. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `The fin restricts eliminations to cells that see both the fin and the pattern. `;
    explanation += `Eliminate ${formatDigit(digit)} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

// Finned Swordfish
function explainFinnedSwordfish(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 6) return hint.text;

  const digit = highlightCells[0]?.digits?.[0] || '?';
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort();
  const cols = [...new Set(cells.map(c => c.col))].sort();

  let explanation = `Finned Swordfish found for digit ${formatDigit(digit)}. `;
  explanation += `This is a Swordfish pattern across Rows ${rows.map(r => r + 1).join(', ')} with an extra "fin" candidate. `;
  explanation += `The base pattern uses Columns ${cols.slice(0, 3).map(c => c + 1).join(', ')}. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminations are limited to cells that see both the fin and the pattern. `;
    explanation += `Eliminate ${formatDigit(digit)} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

// Finned Jellyfish
function explainFinnedJellyfish(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 8) return hint.text;

  const digit = highlightCells[0]?.digits?.[0] || '?';
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort();
  const cols = [...new Set(cells.map(c => c.col))].sort();

  let explanation = `Finned Jellyfish found for digit ${formatDigit(digit)}. `;
  explanation += `This is a Jellyfish pattern across Rows ${rows.map(r => r + 1).join(', ')} with an extra "fin" candidate. `;
  explanation += `The base pattern uses Columns ${cols.slice(0, 4).map(c => c + 1).join(', ')}. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminations are restricted to cells seeing both the fin and the pattern. `;
    explanation += `Eliminate ${formatDigit(digit)} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

// Finned Squirmbag
function explainFinnedSquirmbag(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 10) return hint.text;

  const digit = highlightCells[0]?.digits?.[0] || '?';
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const rows = [...new Set(cells.map(c => c.row))].sort();
  const cols = [...new Set(cells.map(c => c.col))].sort();

  let explanation = `Finned Squirmbag found for digit ${formatDigit(digit)}. `;
  explanation += `This advanced pattern is a 5-fish across Rows ${rows.map(r => r + 1).join(', ')} with an extra "fin" candidate. `;
  explanation += `The base pattern uses Columns ${cols.slice(0, 5).map(c => c + 1).join(', ')}. `;

  if (removeCells.length > 0) {
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminations are limited to cells that see both the fin and the pattern. `;
    explanation += `Eliminate ${formatDigit(digit)} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

// Almost Locked Sets (ALS)
function explainAlmostLockedSets(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 2) return hint.text;

  const cells = highlightCells.map(c => ({ row: c.row, col: c.col }));
  const house = findCommonHouse(cells);
  const houseName = house?.name || 'their shared house';

  // Collect all digits in the ALS
  const alsDigits = new Set<string>();
  highlightCells.forEach(c => {
    for (const d of c.digits) alsDigits.add(d);
  });

  let explanation = `Almost Locked Set (ALS) found in ${houseName}. `;
  explanation += `Cells ${cellList(cells)} contain ${highlightCells.length} cells with ${alsDigits.size} candidates ${formatDigits(Array.from(alsDigits))}. `;
  explanation += `An ALS has N cells with N+1 candidates, meaning if any candidate is eliminated, the remaining N candidates are locked to those N cells. `;

  if (removeCells.length > 0) {
    const elimDigits = new Set<string>();
    removeCells.forEach(c => {
      for (const d of c.digits) elimDigits.add(d);
    });
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminate ${formatDigits(Array.from(elimDigits))} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

// ALS-Chain (ALS-XZ, Doubly-linked ALS)
function explainALSChain(
  hint: SolverHintStep,
  highlightCells: Array<{ row: number; col: number; digits: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>
): string {
  if (highlightCells.length < 4) return hint.text;

  // Group cells by their block/house to identify the two ALS
  const cells = highlightCells.map(c => ({ row: c.row, col: c.col, digits: c.digits }));

  // Collect all digits
  const allDigits = new Set<string>();
  highlightCells.forEach(c => {
    for (const d of c.digits) allDigits.add(d);
  });

  let explanation = `ALS-Chain (ALS-XZ) pattern found. `;
  explanation += `Two Almost Locked Sets are connected by a restricted common candidate (RCC). `;
  explanation += `The pattern involves cells ${cellList(cells)} with candidates ${formatDigits(Array.from(allDigits))}. `;
  explanation += `When two ALS share a restricted common, any candidate that sees all instances of that digit in both ALS can be eliminated. `;

  if (removeCells.length > 0) {
    const elimDigits = new Set<string>();
    removeCells.forEach(c => {
      for (const d of c.digits) elimDigits.add(d);
    });
    const elimCells = removeCells.map(c => ({ row: c.row, col: c.col }));
    explanation += `Eliminate ${formatDigits(Array.from(elimDigits))} from ${cellList(elimCells)}.`;
  }

  return explanation;
}

// Generic explanation for unknown or unsupported techniques
function generateGenericExplanation(
  hint: SolverHintStep,
  selectCells: Array<{ row: number; col: number; digit: string }>,
  removeCells: Array<{ row: number; col: number; digits: string }>,
  _highlightCells: Array<{ row: number; col: number; digits: string }>
): string {
  const parts: string[] = [];

  // Start with original text
  parts.push(hint.text);

  // Add details about actions
  if (selectCells.length > 0) {
    const placements = selectCells.map(c => `${cellName(c.row, c.col)}=${c.digit}`);
    parts.push(`Place: ${placements.join(', ')}.`);
  }

  if (removeCells.length > 0) {
    const eliminations = removeCells.map(c => `${cellName(c.row, c.col)}: remove ${formatDigits(c.digits)}`);
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
      return `Place ${c.digit} in ${cellName(c.row, c.col)}`;
    }
    return `Place digits in ${selectCells.length} cells`;
  }

  if (removeCells.length > 0) {
    const allDigits = new Set<string>();
    removeCells.forEach(c => {
      for (const d of c.digits) allDigits.add(d);
    });
    return `Eliminate ${formatDigits(Array.from(allDigits))} from ${removeCells.length} cell${removeCells.length > 1 ? 's' : ''}`;
  }

  return 'Apply the technique';
}
