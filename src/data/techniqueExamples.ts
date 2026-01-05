/**
 * Example puzzle data for technique tutorials
 * Each example demonstrates a specific solving technique
 */

import type { CellHighlight, CandidateHighlight, LineHighlight } from '@/utils/sudokuSvgGenerator';

export interface TechniqueExample {
  id: string;
  technique: string;
  /** 81-char puzzle string (0 = empty) */
  puzzle: string;
  /** 81-char solution string */
  solution: string;
  /** Comma-delimited pencilmarks for each cell */
  pencilmarks?: string;
  /** Highlights for the diagram */
  highlights: {
    cells?: CellHighlight[];
    candidates?: CandidateHighlight[];
    rows?: LineHighlight[];
    cols?: LineHighlight[];
  };
  /** Description of what this example demonstrates */
  description: string;
}

// X-Wing Example
// In rows 1 and 8, candidate 7 only appears in columns 1 and 5
// This allows eliminating 7 from other cells in columns 1 and 5
export const xWingExample: TechniqueExample = {
  id: 'x-wing-1',
  technique: 'X-Wing',
  puzzle: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
  solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
  pencilmarks: [
    // Row 0
    '', '34', '', '', '17', '', '1249', '1249', '12',
    // Row 1 (candidate 7 at cols 0 and 4)
    '', '17', '', '', '17', '', '34', '348', '',
    // Row 2
    '', '', '', '34', '247', '27', '', '', '17',
    // Row 3
    '', '', '', '17', '', '17', '', '', '',
    // Row 4
    '', '', '', '', '', '', '579', '', '',
    // Row 5
    '', '', '', '', '45', '', '', '', '',
    // Row 6
    '', '', '', '35', '37', '37', '', '', '',
    // Row 7 (candidate 7 at cols 0 and 4)
    '23', '27', '37', '', '', '', '', '36', '',
    // Row 8
    '1234', '1246', '1346', '', '', '', '', '36', ''
  ].join(','),
  highlights: {
    // Highlight the X-Wing cells
    cells: [
      { row: 1, col: 0, fill: 'blue' },
      { row: 1, col: 4, fill: 'blue' },
      { row: 7, col: 0, fill: 'blue' },
      { row: 7, col: 4, fill: 'blue' },
    ],
    // Highlight the 7s that form the X-Wing
    candidates: [
      { row: 1, col: 0, digit: 7, color: 'blue' },
      { row: 1, col: 4, digit: 7, color: 'blue' },
      { row: 7, col: 0, digit: 7, color: 'blue' },
      { row: 7, col: 4, digit: 7, color: 'blue' },
      // Eliminations in column 4
      { row: 2, col: 4, digit: 7, color: 'red', strikethrough: true },
      { row: 6, col: 4, digit: 7, color: 'red', strikethrough: true },
    ],
  },
  description: 'X-Wing on candidate 7: Rows 1 and 8 both have 7 only in columns 1 and 5. This eliminates 7 from other cells in those columns.',
};

// Naked Single Example
export const nakedSingleExample: TechniqueExample = {
  id: 'naked-single-1',
  technique: 'Naked Single',
  puzzle: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
  solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
  pencilmarks: [
    '', '34', '', '', '78', '', '1249', '1249', '12',
    '', '27', '', '', '', '', '34', '348', '',
    '', '', '', '34', '247', '27', '', '', '17',
    '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '579', '', '',
    '', '', '', '', '45', '', '', '', '',
    '', '', '', '35', '37', '37', '', '', '',
    '23', '27', '37', '', '', '', '', '36', '',
    '1234', '1246', '1346', '', '', '', '', '36', ''
  ].join(','),
  highlights: {
    cells: [
      { row: 0, col: 8, fill: 'green' },
    ],
    candidates: [
      { row: 0, col: 8, digit: 1, color: 'green' },
      { row: 0, col: 8, digit: 2, color: 'green' },
    ],
  },
  description: 'R1C9 has only candidates 1 and 2. When we check the row, column, and block constraints, only one digit is possible.',
};

// Hidden Single Example
export const hiddenSingleExample: TechniqueExample = {
  id: 'hidden-single-1',
  technique: 'Hidden Single',
  puzzle: '000000000904607000076804100309701080008000300050308702007502610000403208000000000',
  solution: '851239674924617835376854129369721584418965327752348791287592613143876952695143278',
  pencilmarks: '',
  highlights: {
    cells: [
      { row: 0, col: 0, fill: 'green' },
    ],
  },
  description: 'In Block 1, digit 8 can only go in R1C1, making it a Hidden Single.',
};

// Naked Pair Example
export const nakedPairExample: TechniqueExample = {
  id: 'naked-pair-1',
  technique: 'Naked Pair',
  puzzle: '400000938032094100095300240370609004529001673604703090957008300003900400240030709',
  solution: '461275938732894156895316247378629514529481673614753892957148362183962475246537819',
  pencilmarks: [
    '', '16', '18', '27', '157', '1257', '', '', '',
    '', '', '', '', '', '', '15', '56', '',
    '', '', '', '', '17', '', '', '', '',
    '', '', '18', '', '', '', '125', '125', '',
    '', '', '', '', '48', '', '', '', '',
    '', '', '', '', '', '', '', '', '',
    '', '', '', '146', '14', '', '', '', '',
    '18', '168', '', '', '25', '', '1256', '', '56',
    '', '', '', '', '', '15', '', '', ''
  ].join(','),
  highlights: {
    cells: [
      { row: 3, col: 6, fill: 'blue' },
      { row: 3, col: 7, fill: 'blue' },
    ],
    candidates: [
      { row: 3, col: 6, digit: 1, color: 'blue' },
      { row: 3, col: 6, digit: 2, color: 'blue' },
      { row: 3, col: 6, digit: 5, color: 'red', strikethrough: true },
      { row: 3, col: 7, digit: 1, color: 'blue' },
      { row: 3, col: 7, digit: 2, color: 'blue' },
      { row: 3, col: 7, digit: 5, color: 'red', strikethrough: true },
    ],
  },
  description: 'R4C7 and R4C8 both contain only {1,2,5}. If we can reduce them to {1,2}, they form a Naked Pair.',
};

// Collection of all examples
export const techniqueExamples: TechniqueExample[] = [
  xWingExample,
  nakedSingleExample,
  hiddenSingleExample,
  nakedPairExample,
];

// Get example by technique name
export function getExampleByTechnique(technique: string): TechniqueExample | undefined {
  return techniqueExamples.find(
    (ex) => ex.technique.toLowerCase() === technique.toLowerCase()
  );
}

// Get all examples for a technique
export function getExamplesByTechnique(technique: string): TechniqueExample[] {
  return techniqueExamples.filter(
    (ex) => ex.technique.toLowerCase() === technique.toLowerCase()
  );
}
