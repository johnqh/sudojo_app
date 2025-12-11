import { useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSudoku } from 'sudojo_lib';
import { Card, CardContent, Text } from '@sudobility/components';
import SudokuCanvas from './SudokuCanvas';
import SudokuControls from './SudokuControls';

interface SudokuGameProps {
  puzzle: string;
  solution: string;
  showErrors?: boolean;
  onComplete?: () => void;
}

export default function SudokuGame({ puzzle, solution, showErrors = true, onComplete }: SudokuGameProps) {
  const { t } = useTranslation();

  const {
    board,
    selectedIndex,
    isPencilMode,
    isCompleted,
    errorCells,
    progress,
    canUndo,
    loadBoard,
    selectCell,
    input,
    erase,
    togglePencilMode,
    undo,
    autoPencilmarks,
  } = useSudoku();

  // Load the puzzle on mount
  useEffect(() => {
    loadBoard(puzzle, solution);
  }, [puzzle, solution, loadBoard]);

  // Handle completion
  useEffect(() => {
    if (isCompleted && onComplete) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  // Handle number input
  const handleNumberInput = useCallback(
    (value: number) => {
      input(value);
    },
    [input]
  );

  // Handle cell selection
  const handleCellSelect = useCallback(
    (index: number) => {
      selectCell(index);
    },
    [selectCell]
  );

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      // Number input
      if (key >= '1' && key <= '9') {
        input(parseInt(key, 10));
        return;
      }

      // Erase
      if (key === 'Backspace' || key === 'Delete' || key === '0') {
        erase();
        return;
      }

      // Undo
      if ((event.metaKey || event.ctrlKey) && key === 'z') {
        event.preventDefault();
        undo();
        return;
      }

      // Toggle pencil mode
      if (key === 'p' || key === 'P') {
        togglePencilMode();
        return;
      }

      // Arrow key navigation
      if (selectedIndex !== null) {
        const row = Math.floor(selectedIndex / 9);
        const col = selectedIndex % 9;
        let newRow = row;
        let newCol = col;

        switch (key) {
          case 'ArrowUp':
            newRow = Math.max(0, row - 1);
            break;
          case 'ArrowDown':
            newRow = Math.min(8, row + 1);
            break;
          case 'ArrowLeft':
            newCol = Math.max(0, col - 1);
            break;
          case 'ArrowRight':
            newCol = Math.min(8, col + 1);
            break;
          default:
            return;
        }

        event.preventDefault();
        selectCell(newRow * 9 + newCol);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, input, erase, undo, togglePencilMode, selectCell]);

  // Convert errorCells (SudokuCell[]) to Set<number> of indices
  const errorIndices = useMemo(() => {
    return new Set(errorCells.map(cell => cell.index));
  }, [errorCells]);

  // Get cells array from board (empty array if no board)
  const cells = board?.cells ?? [];

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      {progress > 0 && (
        <div className="text-center">
          <Text size="sm" color="muted">
            {t('game.progress', { percent: progress })}
          </Text>
          <div className="mt-1 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden max-w-[500px] mx-auto">
            <div
              className="h-full bg-[var(--color-primary-500)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Completion message */}
      {isCompleted && (
        <Card className="max-w-[500px] mx-auto">
          <CardContent className="py-4 text-center">
            <Text weight="medium" className="text-green-600 dark:text-green-400">
              {t('game.completed')}
            </Text>
          </CardContent>
        </Card>
      )}

      {/* Sudoku board */}
      <SudokuCanvas
        board={cells}
        selectedIndex={selectedIndex}
        errorCells={errorIndices}
        onCellSelect={handleCellSelect}
        showErrors={showErrors}
      />

      {/* Controls */}
      <SudokuControls
        onNumberInput={handleNumberInput}
        onErase={erase}
        onUndo={undo}
        onTogglePencil={togglePencilMode}
        onAutoPencil={autoPencilmarks}
        isPencilMode={isPencilMode}
        canUndo={canUndo}
        disabled={isCompleted}
      />
    </div>
  );
}
