import { useRef, useEffect, useCallback } from 'react';
import type { SudokuCell } from '@sudobility/sudojo_lib';

interface SudokuCanvasProps {
  board: SudokuCell[];
  selectedIndex: number | null;
  errorCells: Set<number>;
  onCellSelect: (index: number) => void;
  showErrors?: boolean;
}

export default function SudokuCanvas({
  board,
  selectedIndex,
  errorCells,
  onCellSelect,
  showErrors = true,
}: SudokuCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get computed color value from CSS variable
  const getComputedColor = useCallback((cssVar: string): string => {
    if (!containerRef.current) return '#000';
    const computed = getComputedStyle(containerRef.current).getPropertyValue(cssVar.replace('var(', '').replace(')', ''));
    return computed.trim() || '#000';
  }, []);

  // Draw the Sudoku board
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || board.length !== 81) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cellSize = size / 9;
    const boxSize = size / 3;

    // Get actual colors
    const colors = {
      background: getComputedColor('var(--color-bg-primary)') || '#ffffff',
      gridLight: getComputedColor('var(--color-border)') || '#e5e7eb',
      gridDark: getComputedColor('var(--color-text-primary)') || '#1f2937',
      selectedBg: '#dbeafe',
      highlightBg: '#eff6ff',
      errorBg: '#fee2e2',
      givenText: getComputedColor('var(--color-text-primary)') || '#1f2937',
      inputText: '#2563eb',
      errorText: '#dc2626',
      pencilText: getComputedColor('var(--color-text-muted)') || '#6b7280',
    };

    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, size, size);

    // Get selected cell value for highlighting
    const selectedValue = selectedIndex !== null ? (board[selectedIndex].input ?? board[selectedIndex].given) : null;

    // Draw cells
    board.forEach((cell, index) => {
      const row = Math.floor(index / 9);
      const col = index % 9;
      const x = col * cellSize;
      const y = row * cellSize;

      // Cell background
      let bgColor = colors.background;
      const cellValue = cell.input ?? cell.given;

      if (index === selectedIndex) {
        bgColor = colors.selectedBg;
      } else if (showErrors && errorCells.has(index)) {
        bgColor = colors.errorBg;
      } else if (selectedValue && cellValue === selectedValue) {
        bgColor = colors.highlightBg;
      }

      if (bgColor !== colors.background) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, cellSize, cellSize);
      }

      // Draw cell content
      if (cell.given) {
        // Given number (bold)
        ctx.fillStyle = colors.givenText;
        ctx.font = `bold ${cellSize * 0.6}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(cell.given), x + cellSize / 2, y + cellSize / 2);
      } else if (cell.input) {
        // User input
        ctx.fillStyle = showErrors && errorCells.has(index) ? colors.errorText : colors.inputText;
        ctx.font = `${cellSize * 0.6}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(cell.input), x + cellSize / 2, y + cellSize / 2);
      } else if (cell.pencilmarks && cell.pencilmarks.length > 0) {
        // Pencilmarks (small numbers in 3x3 grid)
        ctx.fillStyle = colors.pencilText;
        ctx.font = `${cellSize * 0.25}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        cell.pencilmarks.forEach(mark => {
          const markRow = Math.floor((mark - 1) / 3);
          const markCol = (mark - 1) % 3;
          const markX = x + (markCol + 0.5) * (cellSize / 3);
          const markY = y + (markRow + 0.5) * (cellSize / 3);
          ctx.fillText(String(mark), markX, markY);
        });
      }
    });

    // Draw grid lines
    ctx.strokeStyle = colors.gridLight;
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
    ctx.strokeStyle = colors.gridDark;
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
  }, [board, selectedIndex, errorCells, showErrors, getComputedColor]);

  // Handle canvas resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
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
