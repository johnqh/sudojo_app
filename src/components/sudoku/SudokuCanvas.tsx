import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { SudokuCell } from '@sudobility/sudojo_lib';
import type { HintStep } from '@sudobility/sudojo_solver_client';
import {
  presentBoard,
  themeColorToCSS,
  getColorPalette,
  computeSelectedDigitCells,
  ThemeColor,
  type CellDisplayState,
} from '@sudobility/sudojo_lib';

interface SudokuCanvasProps {
  board: SudokuCell[];
  selectedIndex: number | null;
  onCellSelect: (index: number) => void;
  showErrors?: boolean;
  hint?: HintStep | null;
  isDarkMode?: boolean;
}

/**
 * Convert HintStep from solver client to display format
 * The solver client uses string actions, but the presenter expects numbers/arrays
 */
function convertHintStep(hint: HintStep | null | undefined): Parameters<typeof presentBoard>[0]['hintStep'] {
  if (!hint) return null;

  return {
    title: hint.title,
    text: hint.text,
    areas: hint.areas?.map(area => ({
      type: area.type,
      color: area.color as Parameters<typeof presentBoard>[0]['hintStep'] extends { areas?: infer A }
        ? A extends Array<{ color: infer C }> ? C : never : never,
      index: area.index,
    })) ?? null,
    cells: hint.cells?.map(cell => ({
      index: cell.row * 9 + cell.column,
      color: cell.color as Parameters<typeof presentBoard>[0]['hintStep'] extends { cells?: infer C }
        ? C extends Array<{ color: infer CO }> ? CO : never : never,
      fill: cell.fill,
      actions: cell.actions ? {
        // Matches Kotlin: select = if (select != 0) select else null
        select: cell.actions.select ? (parseInt(cell.actions.select, 10) || null) : null,
        unselect: cell.actions.unselect ? (parseInt(cell.actions.unselect, 10) || null) : null,
        add: cell.actions.add ? cell.actions.add.split('').map(d => parseInt(d, 10)).filter(n => !isNaN(n) && n !== 0) : null,
        remove: cell.actions.remove ? cell.actions.remove.split('').map(d => parseInt(d, 10)).filter(n => !isNaN(n) && n !== 0) : null,
        highlight: cell.actions.highlight ? cell.actions.highlight.split('').map(d => parseInt(d, 10)).filter(n => !isNaN(n) && n !== 0) : null,
      } : undefined,
    })) ?? null,
  };
}

export default function SudokuCanvas({
  board,
  selectedIndex,
  onCellSelect,
  showErrors = true,
  hint = null,
  isDarkMode = false,
}: SudokuCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get color palette
  const palette = useMemo(() => getColorPalette(isDarkMode), [isDarkMode]);

  // Convert hint to display format
  const displayHint = useMemo(() => convertHintStep(hint), [hint]);

  // Compute selectedDigitCells - cells that have the same digit as selected cell
  // Only computed when selected cell has a given or correct input
  const selectedDigitCells = useMemo(() => {
    if (board.length !== 81) return null;
    return computeSelectedDigitCells(board, selectedIndex);
  }, [board, selectedIndex]);

  // Generate display states using the presenter
  const displayStates = useMemo(() => {
    if (board.length !== 81) return [];
    return presentBoard({
      cells: board,
      selectedIndex,
      showErrors,
      hintStep: displayHint,
      selectedDigitCells,
    });
  }, [board, selectedIndex, showErrors, displayHint, selectedDigitCells]);

  // Get CSS color from ThemeColor
  const getColor = useCallback(
    (themeColor: ThemeColor | null, fallback: string): string => {
      const color = themeColorToCSS(palette, themeColor);
      return color ?? fallback;
    },
    [palette]
  );

  // Draw the Sudoku board
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayStates.length !== 81) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cellSize = size / 9;
    const boxSize = size / 3;

    // Grid colors
    const gridLightColor = palette.secondaryLabel;
    const gridDarkColor = palette.label;

    // Clear canvas
    ctx.fillStyle = palette.systemBackground;
    ctx.fillRect(0, 0, size, size);

    // Draw cells
    displayStates.forEach((state: CellDisplayState) => {
      const row = Math.floor(state.index / 9);
      const col = state.index % 9;
      const x = col * cellSize;
      const y = row * cellSize;

      // Cell background
      const bgColor = getColor(state.backgroundColor, palette.systemBackground);
      if (bgColor !== palette.systemBackground) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, cellSize, cellSize);
      }

      // Cell border (if present)
      if (state.borderColor) {
        const borderColor = getColor(state.borderColor, '');
        if (borderColor) {
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 1.5, y + 1.5, cellSize - 3, cellSize - 3);
        }
      }

      // Draw cell content
      if (state.digit !== null) {
        // Draw digit
        const textColor = getColor(state.textColor, palette.label);
        ctx.fillStyle = textColor;
        ctx.font = state.isGiven
          ? `bold ${cellSize * 0.6}px system-ui, sans-serif`
          : `${cellSize * 0.6}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(state.digit), x + cellSize / 2, y + cellSize / 2);
      } else if (state.pencilmarks.length > 0) {
        // Draw pencilmarks (small numbers in 3x3 grid)
        ctx.font = `${cellSize * 0.25}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        state.pencilmarks.forEach((pm) => {
          const pmColor = getColor(pm.color, palette.secondaryLabel);
          ctx.fillStyle = pmColor;

          const markRow = Math.floor((pm.digit - 1) / 3);
          const markCol = (pm.digit - 1) % 3;
          const markX = x + (markCol + 0.5) * (cellSize / 3);
          const markY = y + (markRow + 0.5) * (cellSize / 3);
          ctx.fillText(String(pm.digit), markX, markY);
        });
      }
    });

    // Draw grid lines
    ctx.strokeStyle = gridLightColor;
    ctx.lineWidth = 1;

    // Thin lines for cells
    for (let i = 1; i < 9; i++) {
      if (i % 3 !== 0) {
        // Vertical
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, size);
        ctx.stroke();
        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(size, i * cellSize);
        ctx.stroke();
      }
    }

    // Thick lines for boxes
    ctx.strokeStyle = gridDarkColor;
    ctx.lineWidth = 2;

    for (let i = 0; i <= 3; i++) {
      // Vertical
      ctx.beginPath();
      ctx.moveTo(i * boxSize, 0);
      ctx.lineTo(i * boxSize, size);
      ctx.stroke();
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, i * boxSize);
      ctx.lineTo(size, i * boxSize);
      ctx.stroke();
    }
  }, [displayStates, palette, getColor]);

  // Handle canvas resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const size = Math.min(entry.contentRect.width, entry.contentRect.height);
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
        draw();
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [draw]);

  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle click/touch
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const cellSize = rect.width / 9;
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < 9 && col >= 0 && col < 9) {
        const index = row * 9 + col;
        onCellSelect(index);
      }
    },
    [onCellSelect]
  );

  return (
    <div ref={containerRef} className="w-full aspect-square max-w-[500px] mx-auto">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="touch-none cursor-pointer"
        aria-label="Sudoku board"
      />
    </div>
  );
}
