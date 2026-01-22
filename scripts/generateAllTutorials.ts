/**
 * Generate comprehensive tutorials (HTML + SVG) from saved examples
 * This ensures HTML text and SVG images use the same example data
 * with detailed, technique-specific explanations
 *
 * Run with: bun scripts/generateAllTutorials.ts
 */

import { generateSudokuSvg, type SvgGeneratorOptions, type CandidateHighlight } from '../src/utils/sudokuSvgGenerator';
import * as fs from 'fs';
import * as path from 'path';

interface HintCell {
  row: number;
  column: number;
  color: string;
  fill: boolean;
  actions: {
    select: string;
    unselect: string;
    add: string;
    remove: string;
    highlight: string;
  };
}

interface HintData {
  title: string;
  text: string;
  areas: Array<{ type: string; color: string; index: number }>;
  cells: HintCell[];
}

interface ExampleData {
  uuid: string;
  board: string;
  pencilmarks: string;
  solution: string;
  hint_data: string;
  primary_technique: number;
}

// Helper to get cell notation
function cellNotation(row: number, col: number): string {
  return `R${row + 1}C${col + 1}`;
}

// Formatting helpers using CSS classes (defined in index.css with !important to override legacy rules)
function fmtCell(row: number, col: number): string {
  return `<span class="fmt-cell">${cellNotation(row, col)}</span>`;
}

function fmtCellName(name: string): string {
  return `<span class="fmt-cell">${name}</span>`;
}

function fmtDigit(d: string | number): string {
  return `<span class="fmt-digit">${d}</span>`;
}

function fmtDigits(digits: string[] | string): string {
  const arr = Array.isArray(digits) ? digits : digits.split('').filter(d => d.match(/\d/));
  return `<span class="fmt-digit">{${arr.join(', ')}}</span>`;
}

function fmtEliminate(d: string | number): string {
  return `<span class="fmt-eliminate">${d}</span>`;
}

function fmtEliminateDigits(digits: string[] | string): string {
  const arr = Array.isArray(digits) ? digits : digits.split('').filter(d => d.match(/\d/));
  return `<span class="fmt-eliminate">{${arr.join(', ')}}</span>`;
}

function fmtHouse(house: string): string {
  return `<span class="fmt-house">${house}</span>`;
}

function fmtAction(text: string): string {
  return `<span class="fmt-action">${text}</span>`;
}

function fmtResult(text: string): string {
  return `<span class="fmt-result">${text}</span>`;
}

// Helper to get block number (1-9) from row/col
function getBlock(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3) + 1;
}

// Parse pencilmarks string into array
function parsePencilmarks(pencilmarks: string): string[] {
  return pencilmarks.split(',');
}

// Get pencilmarks for a specific cell
function getCellPencilmarks(pencilmarks: string, row: number, col: number): string {
  const parts = parsePencilmarks(pencilmarks);
  const idx = row * 9 + col;
  return parts[idx] || '';
}

// Get all cells in a row
function getRowCells(row: number): Array<{row: number; col: number}> {
  const cells = [];
  for (let col = 0; col < 9; col++) {
    cells.push({ row, col });
  }
  return cells;
}

// Get all cells in a column
function getColCells(col: number): Array<{row: number; col: number}> {
  const cells = [];
  for (let row = 0; row < 9; row++) {
    cells.push({ row, col });
  }
  return cells;
}

// Get all cells in a block
function getBlockCells(blockNum: number): Array<{row: number; col: number}> {
  const startRow = Math.floor((blockNum - 1) / 3) * 3;
  const startCol = ((blockNum - 1) % 3) * 3;
  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      cells.push({ row: startRow + r, col: startCol + c });
    }
  }
  return cells;
}

// Find which digit is missing in a row (for Full House)
function findMissingInRow(board: string, row: number): string {
  const present = new Set<string>();
  for (let col = 0; col < 9; col++) {
    const d = board[row * 9 + col];
    if (d !== '0') present.add(d);
  }
  for (let d = 1; d <= 9; d++) {
    if (!present.has(String(d))) return String(d);
  }
  return '';
}

// Find which digit is missing in a column
function findMissingInCol(board: string, col: number): string {
  const present = new Set<string>();
  for (let row = 0; row < 9; row++) {
    const d = board[row * 9 + col];
    if (d !== '0') present.add(d);
  }
  for (let d = 1; d <= 9; d++) {
    if (!present.has(String(d))) return String(d);
  }
  return '';
}

// Find which digit is missing in a block
function findMissingInBlock(board: string, blockNum: number): string {
  const present = new Set<string>();
  const cells = getBlockCells(blockNum);
  for (const { row, col } of cells) {
    const d = board[row * 9 + col];
    if (d !== '0') present.add(d);
  }
  for (let d = 1; d <= 9; d++) {
    if (!present.has(String(d))) return String(d);
  }
  return '';
}

// Count filled cells in a row
function countFilledInRow(board: string, row: number): number {
  let count = 0;
  for (let col = 0; col < 9; col++) {
    if (board[row * 9 + col] !== '0') count++;
  }
  return count;
}

// Count filled cells in a column
function countFilledInCol(board: string, col: number): number {
  let count = 0;
  for (let row = 0; row < 9; row++) {
    if (board[row * 9 + col] !== '0') count++;
  }
  return count;
}

// Count filled cells in a block
function countFilledInBlock(board: string, blockNum: number): number {
  let count = 0;
  const cells = getBlockCells(blockNum);
  for (const { row, col } of cells) {
    if (board[row * 9 + col] !== '0') count++;
  }
  return count;
}

// Analyze cells to find which digits they share exclusively
function analyzeHiddenSet(
  pencilmarks: string,
  highlightedCells: Array<{row: number; col: number}>,
  houseType: 'row' | 'col' | 'block',
  houseIndex: number
): { hiddenDigits: string[]; otherCandidates: string[] } {
  // Get all cells in the house
  let houseCells: Array<{row: number; col: number}>;
  if (houseType === 'row') {
    houseCells = getRowCells(houseIndex);
  } else if (houseType === 'col') {
    houseCells = getColCells(houseIndex);
  } else {
    houseCells = getBlockCells(houseIndex);
  }

  // Get pencilmarks for highlighted cells
  const highlightedPm = new Set<string>();
  const highlightedSet = new Set(highlightedCells.map(c => `${c.row},${c.col}`));

  for (const cell of highlightedCells) {
    const pm = getCellPencilmarks(pencilmarks, cell.row, cell.col);
    for (const d of pm) {
      highlightedPm.add(d);
    }
  }

  // Find digits that appear ONLY in highlighted cells within the house
  const hiddenDigits: string[] = [];
  const otherCandidates: string[] = [];

  for (const digit of highlightedPm) {
    let onlyInHighlighted = true;
    for (const cell of houseCells) {
      if (highlightedSet.has(`${cell.row},${cell.col}`)) continue;
      const pm = getCellPencilmarks(pencilmarks, cell.row, cell.col);
      if (pm.includes(digit)) {
        onlyInHighlighted = false;
        break;
      }
    }
    if (onlyInHighlighted) {
      hiddenDigits.push(digit);
    }
  }

  // Other candidates = digits in highlighted cells that aren't hidden
  for (const digit of highlightedPm) {
    if (!hiddenDigits.includes(digit)) {
      otherCandidates.push(digit);
    }
  }

  return {
    hiddenDigits: hiddenDigits.sort(),
    otherCandidates: otherCandidates.sort()
  };
}

// Analyze cells to find naked set digits
function analyzeNakedSet(
  pencilmarks: string,
  highlightedCells: Array<{row: number; col: number}>
): { nakedDigits: string[]; allCandidates: Map<string, string> } {
  const allDigits = new Set<string>();
  const cellCandidates = new Map<string, string>();

  for (const cell of highlightedCells) {
    const pm = getCellPencilmarks(pencilmarks, cell.row, cell.col);
    cellCandidates.set(cellNotation(cell.row, cell.col), pm);
    for (const d of pm) {
      allDigits.add(d);
    }
  }

  return {
    nakedDigits: Array.from(allDigits).sort(),
    allCandidates: cellCandidates
  };
}

// Determine which house contains all highlighted cells
function findCommonHouse(cells: Array<{row: number; col: number}>): { type: 'row' | 'col' | 'block'; index: number } | null {
  if (cells.length === 0) return null;

  // Check row
  if (cells.every(c => c.row === cells[0].row)) {
    return { type: 'row', index: cells[0].row };
  }

  // Check column
  if (cells.every(c => c.col === cells[0].col)) {
    return { type: 'col', index: cells[0].col };
  }

  // Check block
  const block = getBlock(cells[0].row, cells[0].col);
  if (cells.every(c => getBlock(c.row, c.col) === block)) {
    return { type: 'block', index: block };
  }

  return null;
}

interface TechniqueInfo {
  name: string;
  file: string;
  level: number; // 1-9 for belt colors
  overview: string;
  howItWorks: string;
  tips: string;
  getSpecificExplanation: (cells: HintCell[], board: string, pencilmarks: string, solution: string) => string;
}

// Belt colors mapping (matching sudojo_types BELT_COLORS)
const BELT_COLORS: Record<number, { name: string; hex: string }> = {
  1: { name: 'White', hex: '#FFFFFF' },
  2: { name: 'Yellow', hex: '#FFEB3B' },
  3: { name: 'Orange', hex: '#FF9800' },
  4: { name: 'Green', hex: '#4CAF50' },
  5: { name: 'Blue', hex: '#2196F3' },
  6: { name: 'Purple', hex: '#9C27B0' },
  7: { name: 'Brown', hex: '#795548' },
  8: { name: 'Red', hex: '#F44336' },
  9: { name: 'Black', hex: '#212121' },
};

// Belt icon SVG paths (from sudojo_types)
const BELT_ICON_PATHS = [
  'M192.044,46.054c0,0-1.475,4.952,0.21,7.375c1.686,2.423,24.86,1.791,24.86,1.791L205.845,45L192.044,46.054z',
  'M9.831,23.198c0,0,119.181,32.087,233.779,32.087c114.598,0,214.679-51.187,218.5-53.479c3.819-2.292,12.987,38.963,0.765,48.131c-12.225,9.168-80.983,48.896-216.208,48.896c-135.226,0-233.015-21.392-239.892-29.032C-0.101,62.161-0.101,31.602,9.831,23.198z',
  'M252.014,126.336c0,0-22.156-6.112-28.268-21.392c-6.111-15.279,58.827-29.795,58.827-29.795l-6.112,31.324L252.014,126.336z',
  'M195.479,102.652c0,0,30.56,21.392,35.143,19.1c4.584-2.292,58.827-36.671,58.827-36.671L243.61,51.465l-50.423,38.2L195.479,102.652z',
  'M22.818,152.312c0,0,125.293-76.398,200.928-106.958c75.635-30.56,30.56,29.031,30.56,29.031s-78.69,38.199-110.778,57.299s-81.746,50.424-87.858,51.188C49.558,183.635,22.818,152.312,22.818,152.312z',
  'M255.967,27.303c0,0-5.29-1.851-14.146,8.46c-8.857,10.312,15.07,8.197,15.07,8.197L255.967,27.303z',
  'M232.15,28.546c0,0,94.734,49.659,127.586,60.355c32.851,10.696,113.832,46.603,116.889,55.771s-27.503,30.559-27.503,30.559s-23.685-21.391-54.243-34.379c-30.56-12.987-83.274-34.379-112.306-48.131c-29.031-13.751-89.387-47.367-89.387-47.367L232.15,28.546z',
  'M255.834,27.782c0,0-2.292,92.442-4.584,97.026c-2.293,4.584,42.783-12.987,43.546-18.335c0.765-5.349,6.877-50.423,2.293-55.007S260.417,25.49,255.834,27.782z',
];
const BELT_ICON_VIEWBOX = '0 0 478.619 184.676';

// Generate belt icon SVG
function generateBeltIconSvg(fill: string, width = 60, height = 24): string {
  const stroke = fill.toLowerCase() === '#212121' || fill.toLowerCase() === '#000000'
    ? '#FFFFFF'
    : '#000000';

  const paths = BELT_ICON_PATHS.map(
    (d) => `<path fill="${fill}" stroke="${stroke}" stroke-width="4" d="${d}"/>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BELT_ICON_VIEWBOX}" width="${width}" height="${height}">${paths}</svg>`;
}

// Generate all belt icon SVGs and save them to the output directory
function generateBeltIcons(outputDir: string): void {
  console.log('Generating belt icons...');
  for (let level = 1; level <= 9; level++) {
    const belt = BELT_COLORS[level];
    const svg = generateBeltIconSvg(belt.hex);
    const filepath = path.join(outputDir, `belt_${level}.svg`);
    fs.writeFileSync(filepath, svg);
  }
  console.log('  ✓ Generated 9 belt icons\n');
}

const TECHNIQUES: Record<number, TechniqueInfo> = {
  1: {
    name: 'Full House',
    file: 'Full_House',
    level: 1, // White Belt
    overview: 'Full House is the most fundamental Sudoku solving technique. It applies when a house (row, column, or block) has exactly eight cells filled, leaving only one empty cell. The missing digit is the only possibility for that cell.',
    howItWorks: `<ol>
<li>Look for any row, column, or 3x3 block that has exactly 8 cells already filled.</li>
<li>Count which digits from 1-9 are already present in that house.</li>
<li>The one missing digit is the solution for the empty cell.</li>
</ol>`,
    tips: `<ul>
<li>Always scan the board for Full House opportunities first - they're the easiest wins.</li>
<li>Full Houses often appear after you've placed several digits using other techniques.</li>
<li>Check all three house types: rows, columns, and blocks.</li>
</ul>`,
    getSpecificExplanation: (cells, board, _pm, solution) => {
      if (cells.length !== 1) return 'Examine the highlighted cell to find the Full House.';
      const cell = cells[0];
      const row = cell.row;
      const col = cell.column;
      const block = getBlock(row, col);

      // Find the answer from solution
      const answer = solution[row * 9 + col];

      // Determine which house has 8 filled
      const rowFilled = countFilledInRow(board, row);
      const colFilled = countFilledInCol(board, col);
      const blockFilled = countFilledInBlock(board, block);

      let explanation = '';
      if (rowFilled === 8) {
        explanation = `${fmtHouse(`Row ${row + 1}`)} has 8 cells filled. The only empty cell is ${fmtCell(row, col)}.`;
      } else if (colFilled === 8) {
        explanation = `${fmtHouse(`Column ${col + 1}`)} has 8 cells filled. The only empty cell is ${fmtCell(row, col)}.`;
      } else if (blockFilled === 8) {
        explanation = `${fmtHouse(`Block ${block}`)} has 8 cells filled. The only empty cell is ${fmtCell(row, col)}.`;
      } else {
        explanation = `One of the houses containing ${fmtCell(row, col)} has 8 cells filled.`;
      }

      if (answer && answer !== '0') {
        explanation += ` The missing digit is ${fmtDigit(answer)} — ${fmtResult('place it here')}.`;
      }

      return explanation;
    },
  },
  2: {
    name: 'Hidden Single',
    file: 'Hidden_Single',
    level: 2, // Yellow Belt
    overview: 'A Hidden Single occurs when a digit can only go in one cell within a house (row, column, or block), even though that cell may have other candidates. The digit is "hidden" among other possibilities but is forced by the constraint of its house.',
    howItWorks: `<ol>
<li>For each house (row, column, or block), examine each digit 1-9.</li>
<li>Count how many cells in that house can contain each digit.</li>
<li>If a digit can only go in one cell within that house, place it there.</li>
<li>The cell may have multiple candidates, but within the house, only one cell can hold that specific digit.</li>
</ol>`,
    tips: `<ul>
<li>Blocks often reveal Hidden Singles more easily than rows or columns.</li>
<li>Focus on digits that appear frequently elsewhere in the puzzle.</li>
<li>Hidden Singles become more apparent after eliminations from other techniques.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, solution) => {
      if (cells.length !== 1) return 'Look for a digit that can only go in one place within a house.';
      const cell = cells[0];
      const row = cell.row;
      const col = cell.column;
      const block = getBlock(row, col);
      const pm = getCellPencilmarks(pencilmarks, row, col);
      const answer = solution[row * 9 + col];

      let explanation = `Cell ${fmtCell(row, col)} `;
      if (pm) {
        explanation += `has candidates ${fmtDigits(pm)}. `;
      }

      if (answer && answer !== '0') {
        explanation += `Within ${fmtHouse(`Block ${block}`)} (or Row ${row + 1}/Column ${col + 1}), the digit ${fmtDigit(answer)} can only go in this cell — it's a ${fmtResult('Hidden Single')}.`;
      } else {
        explanation += `One digit can only go in this cell within its house — it's a ${fmtResult('Hidden Single')}.`;
      }

      return explanation;
    },
  },
  3: {
    name: 'Naked Single',
    file: 'Naked_Single',
    level: 1, // White Belt
    overview: 'A Naked Single is the simplest pencilmark technique. When a cell has only one candidate remaining (after all eliminations from its row, column, and block), that candidate must be the solution.',
    howItWorks: `<ol>
<li>Enable pencilmarks to see all candidates for each cell.</li>
<li>Look for any cell that has only one candidate remaining.</li>
<li>That candidate is the solution for the cell.</li>
</ol>`,
    tips: `<ul>
<li>Pencilmarks are essential for spotting Naked Singles.</li>
<li>After placing any digit, check its row, column, and block for new Naked Singles.</li>
<li>In easy puzzles, Naked Singles can chain together quickly.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, solution) => {
      if (cells.length !== 1) return 'Find a cell with only one possible candidate.';
      const cell = cells[0];
      const row = cell.row;
      const col = cell.column;
      const pm = getCellPencilmarks(pencilmarks, row, col);
      const answer = solution[row * 9 + col];

      if (pm && pm.length === 1) {
        return `Cell ${fmtCell(row, col)} has only one candidate: ${fmtDigit(pm)}. All other digits are eliminated by the row, column, and block constraints, so ${fmtDigit(pm)} ${fmtResult('must be the answer')}.`;
      } else if (answer && answer !== '0') {
        return `Cell ${fmtCell(row, col)} has only one possible candidate: ${fmtDigit(answer)}. This is the only digit not already present in its row, column, and block.`;
      }
      return `Cell ${fmtCell(row, col)} has only one candidate remaining after all eliminations.`;
    },
  },
  4: {
    name: 'Hidden Pair',
    file: 'Hidden_Pair',
    level: 4, // Green Belt
    overview: 'A Hidden Pair occurs when two candidates appear in exactly two cells within a house, even though those cells may contain other candidates. Since those two digits must go in those two cells, all other candidates can be eliminated from them.',
    howItWorks: `<ol>
<li>Within a house, find two digits that appear as candidates in exactly the same two cells.</li>
<li>These two cells are the only places for those two digits within the house.</li>
<li>Eliminate all other candidates from those two cells, leaving only the pair.</li>
</ol>`,
    tips: `<ul>
<li>Look for digits that appear rarely (2-3 times) within a house.</li>
<li>After finding a Hidden Pair, check if it creates Naked Singles.</li>
<li>Hidden Pairs are often easier to spot in blocks than in rows/columns.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      if (cells.length !== 2) return 'Find two cells that are the only places for two specific digits.';

      const c1 = { row: cells[0].row, col: cells[0].column };
      const c2 = { row: cells[1].row, col: cells[1].column };
      const pm1 = getCellPencilmarks(pencilmarks, c1.row, c1.col);
      const pm2 = getCellPencilmarks(pencilmarks, c2.row, c2.col);

      const house = findCommonHouse([c1, c2]);
      const houseType = house ? (house.type === 'row' ? `Row ${house.index + 1}` : house.type === 'col' ? `Column ${house.index + 1}` : `Block ${house.index}`) : 'their house';

      const analysis = house ? analyzeHiddenSet(pencilmarks, [c1, c2], house.type, house.index) : { hiddenDigits: [], otherCandidates: [] };

      let explanation = `In ${fmtHouse(houseType)}, cells ${fmtCell(c1.row, c1.col)} and ${fmtCell(c2.row, c2.col)} `;

      if (analysis.hiddenDigits.length === 2) {
        explanation += `are the only cells that can contain ${fmtDigits(analysis.hiddenDigits)}. `;
        explanation += `These two digits form a ${fmtResult('Hidden Pair')}. `;
        if (analysis.otherCandidates.length > 0) {
          explanation += `${fmtAction('Eliminate')} the other candidates ${fmtEliminateDigits(analysis.otherCandidates)} from these cells.`;
        }
      } else {
        explanation += `contain a ${fmtResult('Hidden Pair')}. The two hidden digits can only exist in these two cells within the house. `;
        explanation += `Current candidates: ${fmtCell(c1.row, c1.col)}=${fmtDigits(pm1)}, ${fmtCell(c2.row, c2.col)}=${fmtDigits(pm2)}.`;
      }

      return explanation;
    },
  },
  5: {
    name: 'Naked Pair',
    file: 'Naked_Pair',
    level: 3, // Orange Belt
    overview: 'A Naked Pair consists of two cells in the same house that contain exactly the same two candidates and nothing else. Since those two digits must occupy those two cells, they can be eliminated from all other cells in the house.',
    howItWorks: `<ol>
<li>Find two cells in the same house that contain exactly the same two candidates.</li>
<li>These two cells will contain those two digits (though we don't know which goes where).</li>
<li>Eliminate both candidates from all other cells in that house.</li>
</ol>`,
    tips: `<ul>
<li>Naked Pairs are easier to spot than Hidden Pairs because the cells have exactly two candidates.</li>
<li>Look for cells with only 2 candidates and check if another cell matches.</li>
<li>Naked Pairs often lead to chain reactions of eliminations.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      if (cells.length !== 2) return 'Find two cells with the same two candidates.';

      const c1 = { row: cells[0].row, col: cells[0].column };
      const c2 = { row: cells[1].row, col: cells[1].column };
      const pm1 = getCellPencilmarks(pencilmarks, c1.row, c1.col);

      const house = findCommonHouse([c1, c2]);
      const houseType = house ? (house.type === 'row' ? `Row ${house.index + 1}` : house.type === 'col' ? `Column ${house.index + 1}` : `Block ${house.index}`) : 'their shared house';

      return `Cells ${fmtCell(c1.row, c1.col)} and ${fmtCell(c2.row, c2.col)} both contain exactly ${fmtDigits(pm1)}. This is a ${fmtResult('Naked Pair')} in ${fmtHouse(houseType)}. Since these two digits must go in these two cells, ${fmtAction('eliminate')} ${fmtEliminateDigits(pm1)} from all other cells in ${houseType}.`;
    },
  },
  6: {
    name: 'Locked Candidates',
    file: 'Locked_Candidates',
    level: 3, // Orange Belt
    overview: 'Locked Candidates occurs when candidates in a block are restricted to a single row or column. This allows elimination of that candidate from the rest of that row or column outside the block.',
    howItWorks: `<ol>
<li><strong>Type 1 (Pointing):</strong> When a candidate in a block exists only in one row/column, eliminate it from that row/column outside the block.</li>
<li><strong>Type 2 (Claiming):</strong> When a candidate in a row/column exists only within one block, eliminate it from other cells in that block.</li>
</ol>`,
    tips: `<ul>
<li>Scan each block looking for candidates aligned in a single row or column.</li>
<li>This technique is very common and should be checked regularly.</li>
<li>Locked Candidates often unlock more complex patterns.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      if (cells.length < 2) return 'Look for candidates restricted to one row/column within a block.';

      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const sameRow = cellList.every(c => c.row === cellList[0].row);
      const sameCol = cellList.every(c => c.col === cellList[0].col);
      const block = getBlock(cellList[0].row, cellList[0].col);

      // Find common candidates
      const commonCandidates = new Set<string>();
      const firstPm = getCellPencilmarks(pencilmarks, cellList[0].row, cellList[0].col);
      for (const d of firstPm) {
        if (cellList.every(c => getCellPencilmarks(pencilmarks, c.row, c.col).includes(d))) {
          commonCandidates.add(d);
        }
      }
      const candidateArr = Array.from(commonCandidates).sort();
      const cellNames = cellList.map(c => fmtCell(c.row, c.col)).join(', ');

      if (sameRow) {
        return `In ${fmtHouse(`Block ${block}`)}, the candidate ${fmtDigit(candidateArr.join(', ') || '?')} only appears in ${fmtHouse(`Row ${cellList[0].row + 1}`)} (cells ${cellNames}). ${fmtAction('Eliminate')} ${fmtEliminate(candidateArr.join(', ') || '?')} from all other cells in Row ${cellList[0].row + 1} outside Block ${block}.`;
      } else if (sameCol) {
        return `In ${fmtHouse(`Block ${block}`)}, the candidate ${fmtDigit(candidateArr.join(', ') || '?')} only appears in ${fmtHouse(`Column ${cellList[0].col + 1}`)} (cells ${cellNames}). ${fmtAction('Eliminate')} ${fmtEliminate(candidateArr.join(', ') || '?')} from all other cells in Column ${cellList[0].col + 1} outside Block ${block}.`;
      }

      return `The highlighted cells (${cellNames}) show ${fmtResult('Locked Candidates')}. A candidate is restricted to these cells within their block, allowing eliminations in the intersecting line.`;
    },
  },
  7: {
    name: 'Hidden Triple',
    file: 'Hidden_Triple',
    level: 5, // Blue Belt
    overview: 'A Hidden Triple extends the Hidden Pair concept to three cells and three candidates. When three candidates appear only in three cells within a house, all other candidates can be eliminated from those cells.',
    howItWorks: `<ol>
<li>Within a house, find three digits that appear only in the same three cells.</li>
<li>Those three cells must contain those three digits.</li>
<li>Eliminate all other candidates from those three cells.</li>
</ol>`,
    tips: `<ul>
<li>Hidden Triples are harder to spot than Hidden Pairs - look for three rarely-occurring digits.</li>
<li>Not all three cells need to contain all three candidates.</li>
<li>Use a systematic approach: check each combination of three digits.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      if (cells.length !== 3) return 'Find three cells that exclusively contain three specific digits within a house.';

      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const house = findCommonHouse(cellList);
      const houseType = house ? (house.type === 'row' ? `Row ${house.index + 1}` : house.type === 'col' ? `Column ${house.index + 1}` : `Block ${house.index}`) : 'their house';

      const analysis = house ? analyzeHiddenSet(pencilmarks, cellList, house.type, house.index) : { hiddenDigits: [], otherCandidates: [] };

      const cellNames = cellList.map(c => fmtCell(c.row, c.col)).join(', ');

      if (analysis.hiddenDigits.length === 3) {
        let explanation = `In ${fmtHouse(houseType)}, cells ${cellNames} are the only cells that can contain ${fmtDigits(analysis.hiddenDigits)}. `;
        explanation += `These three digits form a ${fmtResult('Hidden Triple')}. `;
        if (analysis.otherCandidates.length > 0) {
          explanation += `${fmtAction('Eliminate')} the other candidates ${fmtEliminateDigits(analysis.otherCandidates)} from these cells.`;
        }
        return explanation;
      }

      const cellCandidates = cellList.map(c => `${fmtCell(c.row, c.col)}=${fmtDigits(getCellPencilmarks(pencilmarks, c.row, c.col))}`).join(', ');
      return `In ${fmtHouse(houseType)}, cells ${cellNames} contain a ${fmtResult('Hidden Triple')}. Current candidates: ${cellCandidates}. Three digits can only exist in these three cells, so all other candidates can be eliminated.`;
    },
  },
  8: {
    name: 'Naked Triple',
    file: 'Naked_Triple',
    level: 5, // Blue Belt
    overview: 'A Naked Triple consists of three cells in a house that together contain exactly three candidates. These three digits must go in these three cells, so they can be eliminated elsewhere in the house.',
    howItWorks: `<ol>
<li>Find three cells in a house where the union of their candidates contains exactly three digits.</li>
<li>Each cell must have a subset of these three candidates (2 or 3 of them).</li>
<li>Eliminate these three candidates from all other cells in the house.</li>
</ol>`,
    tips: `<ul>
<li>Naked Triples don't require all three candidates in each cell.</li>
<li>Look for cells with 2-3 candidates that share digits.</li>
<li>Example: cells with {1,2}, {2,3}, and {1,3} form a Naked Triple.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      if (cells.length !== 3) return 'Find three cells whose combined candidates total exactly three digits.';

      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const house = findCommonHouse(cellList);
      const houseType = house ? (house.type === 'row' ? `Row ${house.index + 1}` : house.type === 'col' ? `Column ${house.index + 1}` : `Block ${house.index}`) : 'their house';

      const analysis = analyzeNakedSet(pencilmarks, cellList);
      const cellCandidates = Array.from(analysis.allCandidates.entries()).map(([cell, pm]) => `${fmtCellName(cell)}=${fmtDigits(pm)}`).join(', ');

      return `In ${fmtHouse(houseType)}, cells ${cellCandidates} together contain only ${fmtDigits(analysis.nakedDigits)}. This is a ${fmtResult('Naked Triple')} — these three digits must occupy these three cells. ${fmtAction('Eliminate')} ${fmtEliminateDigits(analysis.nakedDigits)} from all other cells in ${houseType}.`;
    },
  },
  9: {
    name: 'Hidden Quad',
    file: 'Hidden_Quad',
    level: 7, // Brown Belt
    overview: 'A Hidden Quad is the four-cell extension of Hidden Pairs and Triples. When four candidates appear exclusively in four cells within a house, all other candidates can be eliminated from those cells.',
    howItWorks: `<ol>
<li>Within a house, identify four digits that appear only within the same four cells.</li>
<li>These four cells must contain these four digits.</li>
<li>Eliminate all other candidates from these four cells.</li>
</ol>`,
    tips: `<ul>
<li>Hidden Quads are quite rare - don't spend too much time looking initially.</li>
<li>They often appear in puzzles designed to require advanced techniques.</li>
<li>Software or systematic checking helps identify them reliably.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      if (cells.length !== 4) return 'Find four cells that exclusively contain four specific digits.';

      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const house = findCommonHouse(cellList);
      const houseType = house ? (house.type === 'row' ? `Row ${house.index + 1}` : house.type === 'col' ? `Column ${house.index + 1}` : `Block ${house.index}`) : 'their house';

      const analysis = house ? analyzeHiddenSet(pencilmarks, cellList, house.type, house.index) : { hiddenDigits: [], otherCandidates: [] };

      const cellNames = cellList.map(c => fmtCell(c.row, c.col)).join(', ');

      if (analysis.hiddenDigits.length === 4) {
        let explanation = `In ${fmtHouse(houseType)}, cells ${cellNames} are the only cells that can contain ${fmtDigits(analysis.hiddenDigits)}. `;
        explanation += `These four digits form a ${fmtResult('Hidden Quad')}. `;
        if (analysis.otherCandidates.length > 0) {
          explanation += `${fmtAction('Eliminate')} the other candidates ${fmtEliminateDigits(analysis.otherCandidates)} from these cells, leaving only the quad digits.`;
        }
        return explanation;
      }

      const cellCandidates = cellList.map(c => `${fmtCell(c.row, c.col)}=${fmtDigits(getCellPencilmarks(pencilmarks, c.row, c.col))}`).join(', ');
      return `In ${fmtHouse(houseType)}, cells ${cellNames} contain a ${fmtResult('Hidden Quad')}. Current candidates: ${cellCandidates}. Four specific digits can only exist in these four cells, so all other candidates should be eliminated from them.`;
    },
  },
  10: {
    name: 'Naked Quad',
    file: 'Naked_Quad',
    level: 6, // Purple Belt
    overview: 'A Naked Quad consists of four cells in a house that together contain exactly four candidates. These four digits must occupy these four cells, allowing elimination from other cells.',
    howItWorks: `<ol>
<li>Find four cells in a house whose combined candidates total exactly four digits.</li>
<li>Each cell must contain only subsets of these four candidates.</li>
<li>Eliminate these four candidates from all other cells in the house.</li>
</ol>`,
    tips: `<ul>
<li>Naked Quads are uncommon but not as rare as Hidden Quads.</li>
<li>Look for groups of cells with 2-4 candidates that only use four digits combined.</li>
<li>Quads are harder to spot visually - use pencilmark highlighting if available.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      if (cells.length !== 4) return 'Find four cells whose combined candidates total exactly four digits.';

      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const house = findCommonHouse(cellList);
      const houseType = house ? (house.type === 'row' ? `Row ${house.index + 1}` : house.type === 'col' ? `Column ${house.index + 1}` : `Block ${house.index}`) : 'their house';

      const analysis = analyzeNakedSet(pencilmarks, cellList);
      const cellCandidates = Array.from(analysis.allCandidates.entries()).map(([cell, pm]) => `${fmtCellName(cell)}=${fmtDigits(pm)}`).join(', ');

      return `In ${fmtHouse(houseType)}, cells ${cellCandidates} together contain only ${fmtDigits(analysis.nakedDigits)}. This is a ${fmtResult('Naked Quad')} — these four digits must occupy these four cells. ${fmtAction('Eliminate')} ${fmtEliminateDigits(analysis.nakedDigits)} from all other cells in ${houseType}.`;
    },
  },
  11: {
    name: 'X-Wing',
    file: 'X-Wing',
    level: 6, // Purple Belt
    overview: 'X-Wing is a fish pattern using two rows and two columns. When a candidate appears in exactly two cells in two different rows, and these four cells share the same two columns, the candidate can be eliminated from other cells in those columns.',
    howItWorks: `<ol>
<li>Find a candidate that appears in exactly two cells in a row.</li>
<li>Find another row where the same candidate appears in exactly two cells in the same columns.</li>
<li>These four cells form a rectangle. The candidate must be in two diagonal corners.</li>
<li>Eliminate the candidate from other cells in those two columns.</li>
</ol>`,
    tips: `<ul>
<li>X-Wings work on rows (eliminating from columns) or columns (eliminating from rows).</li>
<li>Look for candidates with exactly 2 occurrences per row/column.</li>
<li>The pattern forms a rectangle - visualize the 'X' shape.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const rows = [...new Set(cellList.map(c => c.row))].sort((a, b) => a - b);
      const cols = [...new Set(cellList.map(c => c.col))].sort((a, b) => a - b);

      // Find common candidate
      const candidates = new Set<string>();
      for (const cell of cellList) {
        const pm = getCellPencilmarks(pencilmarks, cell.row, cell.col);
        for (const d of pm) candidates.add(d);
      }
      // Find digit that appears in all cells
      let commonDigit = '';
      for (const d of candidates) {
        if (cellList.every(c => getCellPencilmarks(pencilmarks, c.row, c.col).includes(d))) {
          commonDigit = d;
          break;
        }
      }

      const rowStr = rows.map(r => r + 1).join(' and ');
      const colStr = cols.map(c => c + 1).join(' and ');

      if (commonDigit) {
        return `An ${fmtResult('X-Wing')} on candidate ${fmtDigit(commonDigit)}: In ${fmtHouse(`Rows ${rowStr}`)}, the digit ${fmtDigit(commonDigit)} can only appear in ${fmtHouse(`Columns ${colStr}`)}. This forms a rectangle where ${fmtDigit(commonDigit)} must occupy two diagonal corners. ${fmtAction('Eliminate')} ${fmtEliminate(commonDigit)} from all other cells in Columns ${colStr}.`;
      }

      return `An ${fmtResult('X-Wing')} pattern exists in ${fmtHouse(`Rows ${rowStr}`)} and ${fmtHouse(`Columns ${colStr}`)}. A candidate appears in exactly two cells per row, aligned in the same two columns. ${fmtAction('Eliminate')} this candidate from other cells in Columns ${colStr}.`;
    },
  },
  12: {
    name: 'Swordfish',
    file: 'Swordfish',
    level: 7, // Brown Belt
    overview: 'Swordfish extends X-Wing to three rows and three columns. When a candidate appears 2-3 times in each of three rows, and all occurrences fall within the same three columns, eliminations can be made.',
    howItWorks: `<ol>
<li>Find three rows where a candidate appears in at most 3 cells each, all within the same 3 columns.</li>
<li>The candidate must appear at least once in each row and column of the pattern.</li>
<li>Eliminate the candidate from other cells in those three columns.</li>
</ol>`,
    tips: `<ul>
<li>Swordfish requires careful tracking of candidate positions.</li>
<li>Look for candidates that are restricted to few columns across multiple rows.</li>
<li>Pencilmark highlighting greatly helps in spotting this pattern.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const rows = [...new Set(cellList.map(c => c.row))].sort((a, b) => a - b);
      const cols = [...new Set(cellList.map(c => c.col))].sort((a, b) => a - b);

      // Find common candidate
      const candidates = new Set<string>();
      for (const cell of cellList) {
        const pm = getCellPencilmarks(pencilmarks, cell.row, cell.col);
        for (const d of pm) candidates.add(d);
      }
      let commonDigit = '';
      for (const d of candidates) {
        if (cellList.filter(c => getCellPencilmarks(pencilmarks, c.row, c.col).includes(d)).length >= cells.length * 0.7) {
          commonDigit = d;
          break;
        }
      }

      const rowStr = rows.map(r => r + 1).join(', ');
      const colStr = cols.map(c => c + 1).join(', ');

      if (commonDigit) {
        return `A ${fmtResult('Swordfish')} on candidate ${fmtDigit(commonDigit)}: In ${fmtHouse(`Rows ${rowStr}`)}, the digit ${fmtDigit(commonDigit)} is restricted to ${fmtHouse(`Columns ${colStr}`)}. The fish pattern means ${fmtAction('eliminate')} ${fmtEliminate(commonDigit)} from all other cells in Columns ${colStr}.`;
      }

      return `A ${fmtResult('Swordfish')} pattern in ${fmtHouse(`Rows ${rowStr}`)} and ${fmtHouse(`Columns ${colStr}`)}. A candidate is restricted to these three columns across three rows. ${fmtAction('Eliminate')} this candidate from other cells in Columns ${colStr}.`;
    },
  },
  13: {
    name: 'Jellyfish',
    file: 'Jellyfish',
    level: 8, // Red Belt
    overview: 'Jellyfish is the four-row, four-column extension of fish patterns. When a candidate in four rows is restricted to the same four columns, it can be eliminated from other cells in those columns.',
    howItWorks: `<ol>
<li>Find four rows where a candidate appears, with all occurrences in the same four columns.</li>
<li>Each row must have 2-4 occurrences of the candidate within these columns.</li>
<li>Eliminate the candidate from other cells in those four columns.</li>
</ol>`,
    tips: `<ul>
<li>Jellyfish are quite rare - master X-Wing and Swordfish first.</li>
<li>Computer assistance is helpful for finding Jellyfish reliably.</li>
<li>The pattern may not use all 16 intersection cells.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, _pencilmarks, _solution) => {
      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const rows = [...new Set(cellList.map(c => c.row))].sort((a, b) => a - b);
      const cols = [...new Set(cellList.map(c => c.col))].sort((a, b) => a - b);

      const rowStr = rows.map(r => r + 1).join(', ');
      const colStr = cols.map(c => c + 1).join(', ');

      return `A ${fmtResult('Jellyfish')} pattern in ${fmtHouse(`Rows ${rowStr}`)} and ${fmtHouse(`Columns ${colStr}`)}. A candidate is restricted to these ${cols.length} columns across ${rows.length} rows. ${fmtAction('Eliminate')} this candidate from all other cells in Columns ${colStr}.`;
    },
  },
  14: {
    name: 'XY-Wing',
    file: 'XY-Wing',
    level: 6, // Purple Belt
    overview: 'XY-Wing uses three bi-value cells arranged so each pair shares a candidate. The pivot cell sees both wing cells, and the common candidate of the wings can be eliminated from cells that see both wings.',
    howItWorks: `<ol>
<li>Find a pivot cell with candidates {X,Y} that sees two wing cells.</li>
<li>One wing has candidates {X,Z}, the other has {Y,Z}.</li>
<li>If pivot is X, one wing is Z. If pivot is Y, the other wing is Z.</li>
<li>Eliminate Z from any cell that sees both wings.</li>
</ol>`,
    tips: `<ul>
<li>All three cells must be bi-value (exactly 2 candidates).</li>
<li>The pivot 'sees' both wings; wings may or may not see each other.</li>
<li>Look for bi-value cells and check if they form the XY-YZ-XZ pattern.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      if (cells.length !== 3) return 'Find three bi-value cells forming an XY-Wing pattern.';

      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const cellInfo = cellList.map(c => {
        const pm = getCellPencilmarks(pencilmarks, c.row, c.col);
        return { cell: cellNotation(c.row, c.col), row: c.row, col: c.col, pm: pm.split('').sort() };
      });

      // Try to identify pivot and wings
      const allDigits = new Set<string>();
      cellInfo.forEach(c => c.pm.forEach(d => allDigits.add(d)));

      // Find Z (appears in 2 cells)
      let zDigit = '';
      for (const d of allDigits) {
        if (cellInfo.filter(c => c.pm.includes(d)).length === 2) {
          zDigit = d;
          break;
        }
      }

      const formattedCells = cellInfo.map(c => `${fmtCell(c.row, c.col)}=${fmtDigits(c.pm)}`).join(', ');

      if (zDigit) {
        const wings = cellInfo.filter(c => c.pm.includes(zDigit));
        return `${fmtResult('XY-Wing')} pattern: ${formattedCells}. The common digit ${fmtDigit(zDigit)} appears in both wing cells (${wings.map(w => fmtCell(w.row, w.col)).join(' and ')}). ${fmtAction('Eliminate')} ${fmtEliminate(zDigit)} from any cell that sees both wings.`;
      }

      return `${fmtResult('XY-Wing')} pattern: ${formattedCells}. The pivot cell sees both wings. ${fmtAction('Eliminate')} the digit shared by both wings from any cell that sees both wings.`;
    },
  },
  15: {
    name: 'Finned X-Wing',
    file: 'Finned_X-Wing',
    level: 8, // Red Belt
    overview: 'A Finned X-Wing is an X-Wing with extra candidates (the "fin") in one of the base rows/columns. The fin restricts eliminations to cells that see both the fin and the normal elimination zone.',
    howItWorks: `<ol>
<li>Find an X-Wing pattern where one row has extra occurrences of the candidate.</li>
<li>These extra cells are the "fin".</li>
<li>Eliminations occur only in cells that see both the X-Wing column and the fin.</li>
</ol>`,
    tips: `<ul>
<li>The fin must be in the same block as one of the proper X-Wing cells.</li>
<li>Finned fish reduce the elimination zone but still allow some progress.</li>
<li>These appear when you almost have a perfect fish pattern.</li>
</ul>`,
    getSpecificExplanation: (_cells, _board, _pm, _solution) => {
      return `A ${fmtResult('Finned X-Wing')} pattern with extra candidates forming the "fin". Eliminations are restricted to cells that see both the fin's block and the cover columns. The fin breaks the perfect X-Wing but still allows limited eliminations.`;
    },
  },
  16: {
    name: 'Squirmbag',
    file: 'Squirmbag',
    level: 9, // Black Belt
    overview: 'Squirmbag (or Sixfish) is a five-row, five-column fish pattern. It\'s extremely rare and only appears in very difficult puzzles.',
    howItWorks: `<ol>
<li>Find five rows where a candidate is restricted to the same five columns.</li>
<li>Each row must have the candidate in 2-5 cells within these columns.</li>
<li>Eliminate the candidate from other cells in those five columns.</li>
</ol>`,
    tips: `<ul>
<li>Squirmbags are extremely rare in hand-solvable puzzles.</li>
<li>If you find yourself looking for Squirmbags, the puzzle is very difficult.</li>
<li>Computer solvers are typically needed to reliably find these.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, _pm, _solution) => {
      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const rows = [...new Set(cellList.map(c => c.row))].sort((a, b) => a - b);
      const cols = [...new Set(cellList.map(c => c.col))].sort((a, b) => a - b);
      const rowStr = rows.map(r => r + 1).join(', ');
      const colStr = cols.map(c => c + 1).join(', ');
      return `A ${fmtResult('Squirmbag')} (5-fish) pattern in ${fmtHouse(`Rows ${rowStr}`)} restricted to ${fmtHouse(`Columns ${colStr}`)}. ${fmtAction('Eliminate')} the candidate from other cells in these columns.`;
    },
  },
  17: {
    name: 'Finned Swordfish',
    file: 'Finned_Swordfish',
    level: 8, // Red Belt
    overview: 'A Finned Swordfish is a Swordfish pattern with extra candidates forming a fin. Eliminations are limited to cells seeing both the fish and the fin.',
    howItWorks: `<ol>
<li>Find a Swordfish where one row has candidates outside the three columns.</li>
<li>The extra candidates are the fin.</li>
<li>Eliminate only from cells that see both a cover column and the fin's block.</li>
</ol>`,
    tips: `<ul>
<li>Finned Swordfish are rare but appear in hard puzzles.</li>
<li>The fin must share a block with one of the proper Swordfish cells.</li>
</ul>`,
    getSpecificExplanation: (_cells, _board, _pm, _solution) => {
      return `A ${fmtResult('Finned Swordfish')} pattern. The fin restricts eliminations to cells that see both the cover columns and the fin's block.`;
    },
  },
  18: {
    name: 'Finned Jellyfish',
    file: 'Finned_Jellyfish',
    level: 9, // Black Belt
    overview: 'A Finned Jellyfish is a Jellyfish pattern with a fin. Eliminations are restricted to cells seeing both the fish columns and the fin.',
    howItWorks: `<ol>
<li>Find a Jellyfish where one row has candidates outside the four columns.</li>
<li>These extra cells form the fin.</li>
<li>Eliminations occur only where cells see both the cover units and the fin.</li>
</ol>`,
    tips: `<ul>
<li>Finned Jellyfish are extremely rare.</li>
<li>Only pursue these after exhausting all simpler techniques.</li>
</ul>`,
    getSpecificExplanation: (_cells, _board, _pm, _solution) => {
      return `A ${fmtResult('Finned Jellyfish')} pattern. Eliminations are restricted to cells seeing both the cover columns and the fin.`;
    },
  },
  19: {
    name: 'XYZ-Wing',
    file: 'XYZ-Wing',
    level: 7, // Brown Belt
    overview: 'XYZ-Wing extends XY-Wing by having the pivot cell contain three candidates. The pivot has {X,Y,Z}, while wings have {X,Z} and {Y,Z}. Z can be eliminated from cells seeing all three.',
    howItWorks: `<ol>
<li>Find a pivot cell with candidates {X,Y,Z}.</li>
<li>Find two wings: one with {X,Z}, another with {Y,Z}.</li>
<li>The pivot sees both wings.</li>
<li>Eliminate Z from cells that see all three cells.</li>
</ol>`,
    tips: `<ul>
<li>The pivot has 3 candidates; wings have 2 each.</li>
<li>Eliminations are limited to cells seeing all three pattern cells.</li>
<li>This is often more restrictive than XY-Wing but still useful.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      if (cells.length !== 3) return 'Find a pivot with 3 candidates and two wings with 2 candidates each.';

      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const cellInfo = cellList.map(c => {
        const pm = getCellPencilmarks(pencilmarks, c.row, c.col);
        return { cell: cellNotation(c.row, c.col), row: c.row, col: c.col, pm: pm.split('').sort(), len: pm.length };
      });

      // Find pivot (3 candidates) and wings (2 each)
      const pivot = cellInfo.find(c => c.len === 3);

      // Find Z (common to all three)
      const allDigits = new Set<string>();
      cellInfo.forEach(c => c.pm.forEach(d => allDigits.add(d)));
      let zDigit = '';
      for (const d of allDigits) {
        if (cellInfo.every(c => c.pm.includes(d))) {
          zDigit = d;
          break;
        }
      }

      const formattedCells = cellInfo.map(c => `${fmtCell(c.row, c.col)}=${fmtDigits(c.pm)}`).join(', ');

      if (pivot && zDigit) {
        return `${fmtResult('XYZ-Wing')} pattern: ${formattedCells}. Pivot ${fmtCell(pivot.row, pivot.col)} has three candidates. The common digit ${fmtDigit(zDigit)} appears in all three cells. ${fmtAction('Eliminate')} ${fmtEliminate(zDigit)} from any cell that sees all three cells.`;
      }

      return `${fmtResult('XYZ-Wing')} pattern: ${formattedCells}. The pivot has 3 candidates, wings have 2 each. ${fmtAction('Eliminate')} the common digit from cells seeing all three.`;
    },
  },
  20: {
    name: 'WXYZ-Wing',
    file: 'WXYZ-Wing',
    level: 8, // Red Belt
    overview: 'WXYZ-Wing uses four cells with candidates forming a restricted pattern. When properly configured, a common candidate can be eliminated from cells seeing all pattern cells.',
    howItWorks: `<ol>
<li>Find four cells whose combined candidates use exactly four digits {W,X,Y,Z}.</li>
<li>One cell (pivot) sees the other three.</li>
<li>Eliminate the restricted digit from cells seeing all four pattern cells.</li>
</ol>`,
    tips: `<ul>
<li>WXYZ-Wings have complex requirements - study examples carefully.</li>
<li>They extend the Wing family pattern to four cells.</li>
<li>These are quite rare in most puzzles.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      if (cells.length !== 4) return 'Find four cells forming a WXYZ-Wing pattern.';

      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const cellInfo = cellList.map(c => {
        const pm = getCellPencilmarks(pencilmarks, c.row, c.col);
        return { cell: cellNotation(c.row, c.col), row: c.row, col: c.col, pm: pm.split('').sort() };
      });

      const allDigits = new Set<string>();
      cellInfo.forEach(c => c.pm.forEach(d => allDigits.add(d)));

      const formattedCells = cellInfo.map(c => `${fmtCell(c.row, c.col)}=${fmtDigits(c.pm)}`).join(', ');

      return `${fmtResult('WXYZ-Wing')} pattern: ${formattedCells}. Combined candidates: ${fmtDigits(Array.from(allDigits).sort())}. ${fmtAction('Eliminate')} the restricted digit from cells seeing all four cells.`;
    },
  },
  21: {
    name: 'Almost Locked Sets',
    file: 'Almost_Locked_Sets',
    level: 9, // Black Belt
    overview: 'An Almost Locked Set (ALS) is a group of N cells containing N+1 candidates. If one candidate is removed, the remaining N candidates are locked into the N cells.',
    howItWorks: `<ol>
<li>Find a group of N cells containing exactly N+1 different candidates.</li>
<li>All cells must see each other (share a house).</li>
<li>If any candidate is removed from outside, the remaining N candidates lock.</li>
<li>Use this to chain eliminations.</li>
</ol>`,
    tips: `<ul>
<li>ALS is a building block for advanced chains and techniques.</li>
<li>Start by identifying ALS groups, then look for how they interact.</li>
<li>Common: two cells with 3 candidates, three cells with 4 candidates.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const cellInfo = cellList.map(c => {
        const pm = getCellPencilmarks(pencilmarks, c.row, c.col);
        return { cell: cellNotation(c.row, c.col), row: c.row, col: c.col, pm: pm.split('').sort() };
      });

      const allDigits = new Set<string>();
      cellInfo.forEach(c => c.pm.forEach(d => allDigits.add(d)));

      const formattedCells = cellInfo.map(c => `${fmtCell(c.row, c.col)}=${fmtDigits(c.pm)}`).join(', ');

      return `${fmtResult('Almost Locked Set')}: ${formattedCells}. These ${fmtDigit(cellList.length)} cells contain ${fmtDigit(allDigits.size)} candidates: ${fmtDigits(Array.from(allDigits).sort())}. Since N cells have N+1 candidates, removing any one digit would lock the remaining digits into these cells.`;
    },
  },
  22: {
    name: 'Finned Squirmbag',
    file: 'Finned_Squirmbag',
    level: 9, // Black Belt
    overview: 'A Finned Squirmbag is a Squirmbag (5-fish) pattern with extra candidates forming a fin. This is one of the rarest patterns in Sudoku solving.',
    howItWorks: `<ol>
<li>Find a Squirmbag where one row has candidates outside the five columns.</li>
<li>These extra cells are the fin.</li>
<li>Eliminations occur only in cells seeing both the cover columns and the fin.</li>
</ol>`,
    tips: `<ul>
<li>Finned Squirmbags are almost never needed in human-solvable puzzles.</li>
<li>This is primarily of theoretical interest.</li>
</ul>`,
    getSpecificExplanation: (_cells, _board, _pm, _solution) => {
      return `A ${fmtResult('Finned Squirmbag')} pattern. Eliminations are restricted to cells seeing both the cover columns and the fin's block.`;
    },
  },
  23: {
    name: 'ALS-Chain',
    file: 'ALS-Chain',
    level: 9, // Black Belt
    overview: 'ALS-Chain links multiple ALS groups through restricted common candidates. When ALS groups share candidates in specific ways, powerful eliminations become possible.',
    howItWorks: `<ol>
<li>Identify multiple ALS groups in the puzzle.</li>
<li>Find restricted common candidates (RCC) that link ALS groups.</li>
<li>An RCC appears in both ALS groups but all instances see each other.</li>
<li>Chain the logic to find eliminations.</li>
</ol>`,
    tips: `<ul>
<li>ALS-Chains require solid understanding of basic ALS.</li>
<li>Start with ALS-XZ (simplest chain), then progress to longer chains.</li>
<li>These are among the most powerful elimination techniques.</li>
</ul>`,
    getSpecificExplanation: (cells, _board, pencilmarks, _solution) => {
      const cellList = cells.map(c => ({ row: c.row, col: c.column }));
      const cellInfo = cellList.map(c => {
        const pm = getCellPencilmarks(pencilmarks, c.row, c.col);
        return { cell: cellNotation(c.row, c.col), row: c.row, col: c.col, pm: pm.split('').sort() };
      });

      const allDigits = new Set<string>();
      cellInfo.forEach(c => c.pm.forEach(d => allDigits.add(d)));

      return `${fmtResult('ALS-Chain')} pattern involving ${fmtDigit(cellList.length)} cells with candidates ${fmtDigits(Array.from(allDigits).sort())}. Multiple Almost Locked Sets are linked through restricted common candidates, enabling eliminations that single ALS cannot achieve.`;
    },
  },
};

const HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{NAME}} - Sudojo</title>
</head>
<body>
    <!-- Belt Level Badge -->
    <div class="belt-badge" style="display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 9999px; background: {{BELT_BG}}; border: 2px solid {{BELT_BORDER}}; margin-bottom: 20px;">
        <img src="belt_{{LEVEL}}.svg" alt="{{BELT_NAME}} Belt" style="width: 48px; height: 20px; flex-shrink: 0;" />
        <span style="font-weight: 600; font-size: 0.9rem; color: {{BELT_TEXT}};">Level {{LEVEL}} · {{BELT_NAME}} Belt</span>
    </div>

    <!-- Overview Section -->
    <div class="section" style="margin-bottom: 28px;">
        <h3 class="section-title" style="font-size: 1.1rem; font-weight: 600; color: #374151; margin: 0 0 10px 0;">Overview</h3>
        <p style="font-size: 1rem; line-height: 1.75; color: #4b5563; margin: 0;">{{OVERVIEW}}</p>
    </div>

    <!-- How It Works Section -->
    <div class="section" style="margin-bottom: 28px;">
        <h3 class="section-title" style="font-size: 1.1rem; font-weight: 600; color: #374151; margin: 0 0 10px 0;">How It Works</h3>
        <div class="how-it-works-content" style="background: #f0f9ff; border-radius: 10px; padding: 16px 20px;">
            {{HOW_IT_WORKS}}
        </div>
    </div>

    <!-- Example Section -->
    <div class="section" style="margin-bottom: 28px;">
        <h3 class="section-title" style="font-size: 1.1rem; font-weight: 600; color: #374151; margin: 0 0 10px 0;">Example</h3>
        <div class="example-content" style="background: #f8fafc; border-radius: 10px; padding: 20px;">
            <div class="example-image" style="text-align: center; margin-bottom: 16px;">
                <img src="{{IMAGE_FILE}}" alt="{{NAME}} Example" style="max-width: 100%; height: auto;">
            </div>
            <div class="explanation" style="background: white; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 0 8px 8px 0; line-height: 1.8;">
                <p style="margin: 0 0 8px 0;"><strong>Highlighted cells:</strong> <span class="fmt-cell-list" style="font-family: ui-monospace, monospace; background: #e0e7ff; padding: 2px 8px; border-radius: 4px; font-size: 0.9em;">{{CELL_LIST}}</span></p>
                <p style="margin: 0;">{{SPECIFIC_EXPLANATION}}</p>
            </div>
        </div>
    </div>

    <!-- Tips Section -->
    <div class="section" style="margin-bottom: 28px;">
        <h3 class="section-title" style="font-size: 1.1rem; font-weight: 600; color: #374151; margin: 0 0 10px 0;">Tips & Patterns</h3>
        <div class="tips-content" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; padding: 16px 20px;">
            {{TIPS}}
        </div>
    </div>

    <!-- Practice CTA -->
    <div class="practice-cta" style="text-align: center; padding: 24px 0; border-top: 1px solid #e5e7eb; margin-top: 20px;">
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 0.95rem;">Ready to practice <strong>{{NAME}}</strong>?</p>
        <a href="/" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem;">Start Practice</a>
    </div>
</body>
</html>`;

function loadExample(techniqueId: number): ExampleData | null {
  const filepath = `/tmp/sudojo_fixed_examples/technique_${techniqueId}.json`;
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(content);
    if (data.success && data.data) {
      return data.data as ExampleData;
    }
  } catch (error) {
    // File doesn't exist or is invalid
  }
  return null;
}

/**
 * Compute candidate highlights based on technique type.
 * Returns which pencilmarks to highlight (blue) and which to show as eliminated (red with strikethrough).
 */
function computeCandidateHighlights(
  techniqueId: number,
  cells: HintCell[],
  board: string,
  pencilmarks: string
): CandidateHighlight[] {
  const highlights: CandidateHighlight[] = [];
  const pmArray = pencilmarks.split(',');

  // Get pencilmarks for a cell
  const getPm = (row: number, col: number): string => pmArray[row * 9 + col] || '';

  // Helper to add a highlight
  const addHighlight = (row: number, col: number, digit: number, color: string, strikethrough = false) => {
    highlights.push({ row, col, digit, color, strikethrough });
  };

  // Helper to check if cells share a house
  const shareHouse = (cells: Array<{row: number; col: number}>): { type: 'row' | 'col' | 'block'; index: number } | null => {
    if (cells.length === 0) return null;
    if (cells.every(c => c.row === cells[0].row)) return { type: 'row', index: cells[0].row };
    if (cells.every(c => c.col === cells[0].col)) return { type: 'col', index: cells[0].col };
    const block = Math.floor(cells[0].row / 3) * 3 + Math.floor(cells[0].col / 3);
    if (cells.every(c => Math.floor(c.row / 3) * 3 + Math.floor(c.col / 3) === block)) return { type: 'block', index: block };
    return null;
  };

  // Get cells in a house
  const getHouseCells = (type: 'row' | 'col' | 'block', index: number): Array<{row: number; col: number}> => {
    const result: Array<{row: number; col: number}> = [];
    if (type === 'row') {
      for (let col = 0; col < 9; col++) result.push({ row: index, col });
    } else if (type === 'col') {
      for (let row = 0; row < 9; row++) result.push({ row, col: index });
    } else {
      const startRow = Math.floor(index / 3) * 3;
      const startCol = (index % 3) * 3;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          result.push({ row: startRow + r, col: startCol + c });
        }
      }
    }
    return result;
  };

  const cellCoords = cells.map(c => ({ row: c.row, col: c.column }));

  switch (techniqueId) {
    case 4: // Hidden Pair
    case 7: // Hidden Triple
    case 9: // Hidden Quad
    {
      // For hidden sets: highlight the hidden digits in blue, eliminate others in red
      const house = shareHouse(cellCoords);
      if (!house) break;

      // Find all candidates in highlighted cells
      const allCandidates = new Set<string>();
      for (const cell of cellCoords) {
        const pm = getPm(cell.row, cell.col);
        for (const d of pm) allCandidates.add(d);
      }

      // Find which digits are ONLY in the highlighted cells (hidden digits)
      const houseCells = getHouseCells(house.type, house.index);
      const hiddenDigits = new Set<string>();

      for (const digit of allCandidates) {
        let onlyInHighlighted = true;
        for (const houseCell of houseCells) {
          const isHighlighted = cellCoords.some(c => c.row === houseCell.row && c.col === houseCell.col);
          if (isHighlighted) continue;
          if (getPm(houseCell.row, houseCell.col).includes(digit)) {
            onlyInHighlighted = false;
            break;
          }
        }
        if (onlyInHighlighted) hiddenDigits.add(digit);
      }

      // Highlight hidden digits in blue, eliminate others in red
      for (const cell of cellCoords) {
        const pm = getPm(cell.row, cell.col);
        for (const d of pm) {
          const digit = parseInt(d, 10);
          if (hiddenDigits.has(d)) {
            addHighlight(cell.row, cell.col, digit, 'blue');
          } else {
            addHighlight(cell.row, cell.col, digit, 'red', true);
          }
        }
      }
      break;
    }

    case 5: // Naked Pair
    case 8: // Naked Triple
    case 10: // Naked Quad
    {
      // For naked sets: highlight the set digits in blue in pattern cells,
      // eliminate them (red) from other cells in the house
      const house = shareHouse(cellCoords);
      if (!house) break;

      // Get the naked set digits (union of candidates in highlighted cells)
      const nakedDigits = new Set<string>();
      for (const cell of cellCoords) {
        const pm = getPm(cell.row, cell.col);
        for (const d of pm) nakedDigits.add(d);
      }

      // Highlight the naked digits in pattern cells (blue)
      for (const cell of cellCoords) {
        const pm = getPm(cell.row, cell.col);
        for (const d of pm) {
          addHighlight(cell.row, cell.col, parseInt(d, 10), 'blue');
        }
      }

      // Eliminate naked digits from other cells in house (red)
      const houseCells = getHouseCells(house.type, house.index);
      for (const houseCell of houseCells) {
        const isPattern = cellCoords.some(c => c.row === houseCell.row && c.col === houseCell.col);
        if (isPattern) continue;
        const pm = getPm(houseCell.row, houseCell.col);
        for (const d of pm) {
          if (nakedDigits.has(d)) {
            addHighlight(houseCell.row, houseCell.col, parseInt(d, 10), 'red', true);
          }
        }
      }
      break;
    }

    case 6: // Locked Candidates
    {
      // Find the common candidate in the locked cells
      const candidates = new Set<string>();
      for (const cell of cellCoords) {
        const pm = getPm(cell.row, cell.col);
        for (const d of pm) candidates.add(d);
      }

      // Find digit that appears in all cells
      let lockedDigit = '';
      for (const d of candidates) {
        if (cellCoords.every(c => getPm(c.row, c.col).includes(d))) {
          lockedDigit = d;
          break;
        }
      }

      if (!lockedDigit) break;

      // Highlight locked digit in pattern cells (blue)
      for (const cell of cellCoords) {
        addHighlight(cell.row, cell.col, parseInt(lockedDigit, 10), 'blue');
      }

      // Determine if it's pointing (block->line) or claiming (line->block)
      const sameRow = cellCoords.every(c => c.row === cellCoords[0].row);
      const sameCol = cellCoords.every(c => c.col === cellCoords[0].col);
      const block = Math.floor(cellCoords[0].row / 3) * 3 + Math.floor(cellCoords[0].col / 3);

      if (sameRow) {
        // Eliminate from row outside block
        const row = cellCoords[0].row;
        for (let col = 0; col < 9; col++) {
          const cellBlock = Math.floor(row / 3) * 3 + Math.floor(col / 3);
          if (cellBlock === block) continue;
          if (getPm(row, col).includes(lockedDigit)) {
            addHighlight(row, col, parseInt(lockedDigit, 10), 'red', true);
          }
        }
      } else if (sameCol) {
        // Eliminate from column outside block
        const col = cellCoords[0].col;
        for (let row = 0; row < 9; row++) {
          const cellBlock = Math.floor(row / 3) * 3 + Math.floor(col / 3);
          if (cellBlock === block) continue;
          if (getPm(row, col).includes(lockedDigit)) {
            addHighlight(row, col, parseInt(lockedDigit, 10), 'red', true);
          }
        }
      }
      break;
    }

    case 11: // X-Wing
    case 12: // Swordfish
    case 13: // Jellyfish
    {
      // Find common candidate
      const candidates = new Set<string>();
      for (const cell of cellCoords) {
        const pm = getPm(cell.row, cell.col);
        for (const d of pm) candidates.add(d);
      }

      let fishDigit = '';
      for (const d of candidates) {
        if (cellCoords.filter(c => getPm(c.row, c.col).includes(d)).length >= cellCoords.length * 0.7) {
          fishDigit = d;
          break;
        }
      }

      if (!fishDigit) break;

      // Get unique rows and cols in the pattern
      const rows = [...new Set(cellCoords.map(c => c.row))];
      const cols = [...new Set(cellCoords.map(c => c.col))];

      // Highlight fish digit in pattern cells (blue)
      for (const cell of cellCoords) {
        if (getPm(cell.row, cell.col).includes(fishDigit)) {
          addHighlight(cell.row, cell.col, parseInt(fishDigit, 10), 'blue');
        }
      }

      // Eliminate from columns (if base is rows)
      for (const col of cols) {
        for (let row = 0; row < 9; row++) {
          if (rows.includes(row)) continue;
          if (getPm(row, col).includes(fishDigit)) {
            addHighlight(row, col, parseInt(fishDigit, 10), 'red', true);
          }
        }
      }
      break;
    }

    case 14: // XY-Wing
    {
      if (cells.length !== 3) break;

      // Get candidates for each cell
      const cellInfo = cellCoords.map(c => ({
        ...c,
        pm: getPm(c.row, c.col).split('').filter(d => d.match(/\d/))
      }));

      // Find Z (digit that appears in exactly 2 cells)
      const allDigits = new Set<string>();
      cellInfo.forEach(c => c.pm.forEach(d => allDigits.add(d)));

      let zDigit = '';
      for (const d of allDigits) {
        if (cellInfo.filter(c => c.pm.includes(d)).length === 2) {
          zDigit = d;
          break;
        }
      }

      if (!zDigit) break;

      // Highlight all candidates in pattern cells
      for (const cell of cellInfo) {
        for (const d of cell.pm) {
          // Z digit in wings highlighted in green (special)
          const color = d === zDigit ? 'green' : 'blue';
          addHighlight(cell.row, cell.col, parseInt(d, 10), color);
        }
      }

      // Find cells that see both wings (have Z digit)
      const wings = cellInfo.filter(c => c.pm.includes(zDigit));
      if (wings.length === 2) {
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            // Skip pattern cells
            if (cellInfo.some(c => c.row === row && c.col === col)) continue;

            // Check if sees both wings
            const seesBothWings = wings.every(wing => {
              return row === wing.row || col === wing.col ||
                (Math.floor(row / 3) === Math.floor(wing.row / 3) &&
                 Math.floor(col / 3) === Math.floor(wing.col / 3));
            });

            if (seesBothWings && getPm(row, col).includes(zDigit)) {
              addHighlight(row, col, parseInt(zDigit, 10), 'red', true);
            }
          }
        }
      }
      break;
    }

    case 19: // XYZ-Wing
    {
      if (cells.length !== 3) break;

      const cellInfo = cellCoords.map(c => ({
        ...c,
        pm: getPm(c.row, c.col).split('').filter(d => d.match(/\d/))
      }));

      // Find Z (common to all three)
      const allDigits = new Set<string>();
      cellInfo.forEach(c => c.pm.forEach(d => allDigits.add(d)));

      let zDigit = '';
      for (const d of allDigits) {
        if (cellInfo.every(c => c.pm.includes(d))) {
          zDigit = d;
          break;
        }
      }

      if (!zDigit) break;

      // Highlight all candidates in pattern cells
      for (const cell of cellInfo) {
        for (const d of cell.pm) {
          const color = d === zDigit ? 'green' : 'blue';
          addHighlight(cell.row, cell.col, parseInt(d, 10), color);
        }
      }

      // Find cells that see all three pattern cells
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (cellInfo.some(c => c.row === row && c.col === col)) continue;

          const seesAll = cellInfo.every(cell => {
            return row === cell.row || col === cell.col ||
              (Math.floor(row / 3) === Math.floor(cell.row / 3) &&
               Math.floor(col / 3) === Math.floor(cell.col / 3));
          });

          if (seesAll && getPm(row, col).includes(zDigit)) {
            addHighlight(row, col, parseInt(zDigit, 10), 'red', true);
          }
        }
      }
      break;
    }

    default:
      // For other techniques, just highlight all pencilmarks in pattern cells
      for (const cell of cellCoords) {
        const pm = getPm(cell.row, cell.col);
        for (const d of pm) {
          addHighlight(cell.row, cell.col, parseInt(d, 10), 'blue');
        }
      }
  }

  return highlights;
}

function generateSvgForExample(example: ExampleData): string {
  const hintData: HintData = JSON.parse(example.hint_data || '{}');

  const cellHighlights = (hintData.cells || []).map(cell => ({
    row: cell.row,
    col: cell.column,
    fill: cell.color || 'blue',
  }));

  // Compute candidate highlights based on technique
  const candidateHighlights = computeCandidateHighlights(
    example.primary_technique,
    hintData.cells || [],
    example.board,
    example.pencilmarks || ''
  );

  const options: SvgGeneratorOptions = {
    puzzle: example.board,
    pencilmarks: example.pencilmarks || '',
    showPencilmarks: !!example.pencilmarks && example.pencilmarks.length > 0,
    highlights: {
      cells: cellHighlights,
      candidates: candidateHighlights,
    },
    size: 450,
    darkMode: false,
  };

  return generateSudokuSvg(options);
}

// Helper to get belt styling based on level
function getBeltStyles(level: number): { hex: string; bg: string; border: string; text: string; name: string } {
  const belt = BELT_COLORS[level] || BELT_COLORS[1];
  const hex = belt.hex;

  // Calculate appropriate background, border, and text colors based on belt color
  // For light belts (White, Yellow), use darker text; for dark belts, use lighter text
  const isLightBelt = level <= 3; // White, Yellow, Orange
  const isDarkBelt = level >= 7; // Brown, Red, Black

  let bg: string;
  let border: string;
  let text: string;

  if (level === 1) { // White belt
    bg = '#f9fafb';
    border = '#d1d5db';
    text = '#374151';
  } else if (level === 9) { // Black belt
    bg = '#1f2937';
    border = '#4b5563';
    text = '#f9fafb';
  } else if (isDarkBelt) {
    bg = hex + '20'; // 12% opacity
    border = hex;
    text = '#374151';
  } else {
    bg = hex + '30'; // 19% opacity
    border = hex;
    text = '#374151';
  }

  return { hex, bg, border, text, name: belt.name };
}

function generateHtml(techniqueId: number, technique: TechniqueInfo, example: ExampleData | null): string {
  let cellList = 'N/A';
  let specificExplanation = 'No example available for this technique.';

  if (example) {
    const hintData: HintData = JSON.parse(example.hint_data || '{}');
    const cells = hintData.cells || [];
    cellList = cells.map(c => cellNotation(c.row, c.column)).join(', ');
    specificExplanation = technique.getSpecificExplanation(cells, example.board, example.pencilmarks || '', example.solution || '');
  }

  const beltStyles = getBeltStyles(technique.level);

  return HTML_TEMPLATE
    .replace(/{{NAME}}/g, technique.name)
    .replace(/{{LEVEL}}/g, String(technique.level))
    .replace(/{{BELT_NAME}}/g, beltStyles.name)
    .replace(/{{BELT_HEX}}/g, beltStyles.hex)
    .replace(/{{BELT_BG}}/g, beltStyles.bg)
    .replace(/{{BELT_BORDER}}/g, beltStyles.border)
    .replace(/{{BELT_TEXT}}/g, beltStyles.text)
    .replace(/{{OVERVIEW}}/g, technique.overview)
    .replace(/{{HOW_IT_WORKS}}/g, technique.howItWorks)
    .replace(/{{IMAGE_FILE}}/g, `${technique.file.toLowerCase()}_1.svg`)
    .replace(/{{CELL_LIST}}/g, cellList)
    .replace(/{{SPECIFIC_EXPLANATION}}/g, specificExplanation)
    .replace(/{{TIPS}}/g, technique.tips);
}

async function main() {
  const outputDir = path.join(__dirname, '../public/help');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating comprehensive tutorials from saved examples...\n');

  let htmlGenerated = 0;
  let svgGenerated = 0;
  let noExample = 0;

  for (const [idStr, technique] of Object.entries(TECHNIQUES)) {
    const techniqueId = parseInt(idStr);
    console.log(`Processing: ${technique.name} (${techniqueId})...`);

    const example = loadExample(techniqueId);

    // Generate HTML
    const html = generateHtml(techniqueId, technique, example);
    const htmlPath = path.join(outputDir, `${technique.file}.html`);
    fs.writeFileSync(htmlPath, html);
    console.log(`  ✓ HTML: ${technique.file}.html`);
    htmlGenerated++;

    // Generate SVG
    if (example) {
      try {
        const svg = generateSvgForExample(example);
        const svgPath = path.join(outputDir, `${technique.file.toLowerCase()}_1.svg`);
        fs.writeFileSync(svgPath, svg);
        console.log(`  ✓ SVG: ${technique.file.toLowerCase()}_1.svg`);
        svgGenerated++;
      } catch (error) {
        console.error(`  ✗ SVG failed:`, error);
      }
    } else {
      console.log(`  ⚠️ No example available`);
      noExample++;
    }
  }

  console.log(`\n✅ Generated ${htmlGenerated} HTML files and ${svgGenerated} SVG images`);
  if (noExample > 0) {
    console.log(`⚠️ ${noExample} techniques had no examples`);
  }
}

main().catch(console.error);
