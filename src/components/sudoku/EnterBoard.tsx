import { useState, useCallback, useEffect, lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, Text, Button } from '@sudobility/components';
import { useGamePlay } from '@sudobility/sudojo_lib';
import SudokuCanvas from './SudokuCanvas';
import SudokuGame from './SudokuGame';
import EntryControls from './EntryControls';
import { useBoardEntry } from '@/hooks/useBoardEntry';
import { useTheme } from '@/hooks/useTheme';
import { getInfoService } from '@sudobility/di';
import { InfoType } from '@sudobility/types';

// Lazy load ScanBoard since it has a heavy dependency (Tesseract.js)
const ScanBoard = lazy(() => import('./ScanBoard'));

interface EnterBoardProps {
  showErrors?: boolean;
}

type Mode = 'entry' | 'play' | 'scan';

export default function EnterBoard({ showErrors = true }: EnterBoardProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const [mode, setMode] = useState<Mode>('entry');

  const {
    cells,
    selectedIndex,
    isValidating,
    validationError,
    validatedPuzzle,
    selectCell,
    setGiven,
    erase,
    validate,
    reset,
    clueCount,
    setCellsFromPuzzle,
  } = useBoardEntry();

  // Current game management
  const { currentGame, startGame, updateProgress, clearGame } = useGamePlay();

  // Check if we're resuming an entered game
  const isResumingGame = useMemo(() => {
    return (
      currentGame?.source === 'entered' &&
      validatedPuzzle &&
      currentGame?.puzzle === validatedPuzzle.puzzle
    );
  }, [currentGame, validatedPuzzle]);

  // Transition to play mode when puzzle is validated
  useEffect(() => {
    if (validatedPuzzle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('play');
      // Start current game tracking (only if not resuming)
      if (!isResumingGame) {
        startGame('entered', validatedPuzzle.puzzle, validatedPuzzle.solution, {});
      }
    }
  }, [validatedPuzzle, isResumingGame, startGame]);

  // Show validation error via InfoService instead of rendering on page
  useEffect(() => {
    if (validationError) {
      getInfoService().show(t('enter.validationError'), t(validationError), InfoType.ERROR, 5000);
    }
  }, [validationError, t]);

  // Handle number input in entry mode
  const handleNumberInput = useCallback(
    (value: number) => {
      setGiven(value);
    },
    [setGiven]
  );

  // Handle cell selection
  const handleCellSelect = useCallback(
    (index: number) => {
      selectCell(index);
    },
    [selectCell]
  );

  // Keyboard support for entry mode
  useEffect(() => {
    if (mode !== 'entry') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      // Number input
      if (key >= '1' && key <= '9') {
        setGiven(parseInt(key, 10));
        return;
      }

      // Erase
      if (key === 'Backspace' || key === 'Delete' || key === '0') {
        erase();
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
  }, [mode, selectedIndex, setGiven, erase, selectCell]);

  // Handle completion in play mode - just show celebration, no progress tracking
  const handleComplete = useCallback(() => {
    // Celebration is handled automatically by SudokuGame
    // We intentionally don't save to progress
    clearGame(); // Clear current game on completion
  }, [clearGame]);

  // Handle going back to entry mode
  const handleBackToEntry = useCallback(() => {
    clearGame(); // Clear current game when going back
    reset();
    setMode('entry');
  }, [reset, clearGame]);

  // Handle switching to scan mode
  const handleScanMode = useCallback(() => {
    setMode('scan');
  }, []);

  // Handle scan complete - populate board with OCR result
  const handleScanComplete = useCallback((puzzle: string) => {
    setCellsFromPuzzle(puzzle);
    setMode('entry');
  }, [setCellsFromPuzzle]);

  // Handle scan cancel
  const handleScanCancel = useCallback(() => {
    setMode('entry');
  }, []);

  // Play mode - render SudokuGame
  if (mode === 'play' && validatedPuzzle) {
    return (
      <div className="space-y-6">
        <SudokuGame
          puzzle={validatedPuzzle.puzzle}
          solution={validatedPuzzle.solution}
          showErrors={showErrors}
          showTimer={true}
          onComplete={handleComplete}
          onProgressUpdate={updateProgress}
          initialInput={isResumingGame ? currentGame?.inputString : undefined}
          initialPencilmarks={isResumingGame ? currentGame?.pencilmarksString : undefined}
          initialElapsedTime={isResumingGame ? currentGame?.elapsedTime : undefined}
        />

        {/* Back to entry button */}
        <div className="flex justify-center">
          <button
            onClick={handleBackToEntry}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline"
          >
            {t('enter.backToEntry')}
          </button>
        </div>
      </div>
    );
  }

  // Scan mode - render ScanBoard
  if (mode === 'scan') {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        }
      >
        <ScanBoard onScanComplete={handleScanComplete} onCancel={handleScanCancel} />
      </Suspense>
    );
  }

  // Entry mode
  return (
    <div className="space-y-6">
      {/* Instructions and scan button */}
      <Card className="max-w-[500px] mx-auto">
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Text size="sm" color="muted" className="flex-1 text-center sm:text-left">
              {t('enter.instructions')}
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScanMode}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {t('enter.scanButton')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sudoku board */}
      <SudokuCanvas
        board={cells}
        selectedIndex={selectedIndex}
        onCellSelect={handleCellSelect}
        showErrors={false}
        isDarkMode={isDarkMode}
      />

      {/* Entry controls */}
      <EntryControls
        onNumberInput={handleNumberInput}
        onErase={erase}
        onClearBoard={reset}
        onValidate={validate}
        isValidating={isValidating}
        clueCount={clueCount}
        canEraseCell={selectedIndex !== null && cells[selectedIndex]?.given !== null}
      />
    </div>
  );
}
