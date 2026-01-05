/**
 * SVG Generator for Sudoku diagrams
 * Creates clean, scalable SVG images for technique tutorials
 */

export interface CellHighlight {
  row: number;
  col: number;
  fill: string;
}

export interface CandidateHighlight {
  row: number;
  col: number;
  digit: number;
  color: string;
  strikethrough?: boolean;
}

export interface LineHighlight {
  index: number;
  color: string;
}

export interface SvgGeneratorOptions {
  /** 81-char board string (0 = empty) */
  puzzle: string;
  /** 81-char user input string (0 = empty) */
  userInput?: string;
  /** Comma-delimited pencilmarks (e.g., "123,45,,,9,...") */
  pencilmarks?: string;
  /** Highlights to apply */
  highlights?: {
    cells?: CellHighlight[];
    candidates?: CandidateHighlight[];
    rows?: LineHighlight[];
    cols?: LineHighlight[];
  };
  /** SVG size in pixels (default 400) */
  size?: number;
  /** Whether to show pencilmarks (default true if pencilmarks provided) */
  showPencilmarks?: boolean;
  /** Dark mode (default false) */
  darkMode?: boolean;
}

// Color palette
const COLORS = {
  light: {
    background: '#ffffff',
    cellBackground: '#ffffff',
    gridLine: '#cccccc',
    blockLine: '#000000',
    givenDigit: '#000000',
    userDigit: '#0066cc',
    pencilmark: '#666666',
    highlightBlue: 'rgba(59, 130, 246, 0.3)',
    highlightGreen: 'rgba(34, 197, 94, 0.3)',
    highlightYellow: 'rgba(234, 179, 8, 0.3)',
    highlightRed: 'rgba(239, 68, 68, 0.3)',
    highlightOrange: 'rgba(249, 115, 22, 0.3)',
    candidateBlue: '#3b82f6',
    candidateGreen: '#22c55e',
    candidateRed: '#ef4444',
  },
  dark: {
    background: '#1f2937',
    cellBackground: '#374151',
    gridLine: '#4b5563',
    blockLine: '#e5e7eb',
    givenDigit: '#f9fafb',
    userDigit: '#60a5fa',
    pencilmark: '#9ca3af',
    highlightBlue: 'rgba(59, 130, 246, 0.4)',
    highlightGreen: 'rgba(34, 197, 94, 0.4)',
    highlightYellow: 'rgba(234, 179, 8, 0.4)',
    highlightRed: 'rgba(239, 68, 68, 0.4)',
    highlightOrange: 'rgba(249, 115, 22, 0.4)',
    candidateBlue: '#60a5fa',
    candidateGreen: '#4ade80',
    candidateRed: '#f87171',
  },
};

function getHighlightColor(color: string, palette: typeof COLORS.light): string {
  const colorMap: Record<string, string> = {
    blue: palette.highlightBlue,
    green: palette.highlightGreen,
    yellow: palette.highlightYellow,
    red: palette.highlightRed,
    orange: palette.highlightOrange,
  };
  return colorMap[color.toLowerCase()] || color;
}

function getCandidateColor(color: string, palette: typeof COLORS.light): string {
  const colorMap: Record<string, string> = {
    blue: palette.candidateBlue,
    green: palette.candidateGreen,
    red: palette.candidateRed,
  };
  return colorMap[color.toLowerCase()] || color;
}

/**
 * Generate an SVG string for a Sudoku diagram
 */
export function generateSudokuSvg(options: SvgGeneratorOptions): string {
  const {
    puzzle,
    userInput = '',
    pencilmarks = '',
    highlights = {},
    size = 400,
    showPencilmarks = !!pencilmarks,
    darkMode = false,
  } = options;

  const palette = darkMode ? COLORS.dark : COLORS.light;
  const cellSize = size / 9;
  const thinLine = 1;
  const thickLine = 3;

  // Parse pencilmarks
  const pencilmarkArray = pencilmarks ? pencilmarks.split(',') : [];

  // Build SVG elements
  const elements: string[] = [];

  // Background
  elements.push(
    `<rect x="0" y="0" width="${size}" height="${size}" fill="${palette.background}" />`
  );

  // Row highlights
  if (highlights.rows) {
    for (const { index, color } of highlights.rows) {
      const y = index * cellSize;
      elements.push(
        `<rect x="0" y="${y}" width="${size}" height="${cellSize}" fill="${getHighlightColor(color, palette)}" />`
      );
    }
  }

  // Column highlights
  if (highlights.cols) {
    for (const { index, color } of highlights.cols) {
      const x = index * cellSize;
      elements.push(
        `<rect x="${x}" y="0" width="${cellSize}" height="${size}" fill="${getHighlightColor(color, palette)}" />`
      );
    }
  }

  // Cell highlights
  if (highlights.cells) {
    for (const { row, col, fill } of highlights.cells) {
      const x = col * cellSize;
      const y = row * cellSize;
      elements.push(
        `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${getHighlightColor(fill, palette)}" />`
      );
    }
  }

  // Grid lines (thin)
  for (let i = 1; i < 9; i++) {
    if (i % 3 !== 0) {
      const pos = i * cellSize;
      elements.push(
        `<line x1="${pos}" y1="0" x2="${pos}" y2="${size}" stroke="${palette.gridLine}" stroke-width="${thinLine}" />`
      );
      elements.push(
        `<line x1="0" y1="${pos}" x2="${size}" y2="${pos}" stroke="${palette.gridLine}" stroke-width="${thinLine}" />`
      );
    }
  }

  // Block lines (thick)
  for (let i = 0; i <= 3; i++) {
    const pos = i * 3 * cellSize;
    elements.push(
      `<line x1="${pos}" y1="0" x2="${pos}" y2="${size}" stroke="${palette.blockLine}" stroke-width="${thickLine}" />`
    );
    elements.push(
      `<line x1="0" y1="${pos}" x2="${size}" y2="${pos}" stroke="${palette.blockLine}" stroke-width="${thickLine}" />`
    );
  }

  // Digits and pencilmarks
  const digitFontSize = cellSize * 0.6;
  const pencilFontSize = cellSize * 0.25;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const index = row * 9 + col;
      const x = col * cellSize + cellSize / 2;
      const y = row * cellSize + cellSize / 2;

      const givenDigit = puzzle[index];
      const userDigit = userInput[index] || '0';

      if (givenDigit !== '0') {
        // Given digit
        elements.push(
          `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${digitFontSize}" font-weight="bold" fill="${palette.givenDigit}" text-anchor="middle" dominant-baseline="central">${givenDigit}</text>`
        );
      } else if (userDigit !== '0') {
        // User-entered digit
        elements.push(
          `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${digitFontSize}" fill="${palette.userDigit}" text-anchor="middle" dominant-baseline="central">${userDigit}</text>`
        );
      } else if (showPencilmarks && pencilmarkArray[index]) {
        // Pencilmarks (3x3 grid within cell)
        const marks = pencilmarkArray[index];
        const markCellSize = cellSize / 3;

        for (const mark of marks) {
          const digit = parseInt(mark, 10);
          if (digit >= 1 && digit <= 9) {
            const markRow = Math.floor((digit - 1) / 3);
            const markCol = (digit - 1) % 3;
            const markX = col * cellSize + markCol * markCellSize + markCellSize / 2;
            const markY = row * cellSize + markRow * markCellSize + markCellSize / 2;

            // Check for candidate highlights
            const candidateHighlight = highlights.candidates?.find(
              (h) => h.row === row && h.col === col && h.digit === digit
            );

            let markColor = palette.pencilmark;
            let strikethrough = false;

            if (candidateHighlight) {
              markColor = getCandidateColor(candidateHighlight.color, palette);
              strikethrough = candidateHighlight.strikethrough || false;
            }

            elements.push(
              `<text x="${markX}" y="${markY}" font-family="Arial, sans-serif" font-size="${pencilFontSize}" fill="${markColor}" text-anchor="middle" dominant-baseline="central">${digit}</text>`
            );

            if (strikethrough) {
              const strikeY = markY;
              const strikeX1 = markX - pencilFontSize * 0.4;
              const strikeX2 = markX + pencilFontSize * 0.4;
              elements.push(
                `<line x1="${strikeX1}" y1="${strikeY}" x2="${strikeX2}" y2="${strikeY}" stroke="${markColor}" stroke-width="1.5" />`
              );
            }
          }
        }
      }
    }
  }

  // Assemble SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${elements.join('\n  ')}
</svg>`;

  return svg;
}

/**
 * Convert SVG to a data URL for use in img tags
 */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/**
 * Download SVG as a file
 */
export function downloadSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
