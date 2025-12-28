import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, Text } from '@sudobility/components';
import SudokuCanvas from './SudokuCanvas';
import SudokuGame from './SudokuGame';
import EntryControls from './EntryControls';
import { useBoardEntry } from '@/hooks/useBoardEntry';
import { useTheme } from '@/hooks/useTheme';
import { getInfoService } from '@sudobility/di';
import { InfoType } from '@sudobility/types';

interface EnterBoardProps {
  showErrors?: boolean;
}

type Mode = 'entry' | 'play';

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
  } = useBoardEntry();

  // Transition to play mode when puzzle is validated
  useEffect(() => {
    if (validatedPuzzle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('play');
    }
  }, [validatedPuzzle]);

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
  }, []);

  // Handle going back to entry mode
  const handleBackToEntry = useCallback(() => {
    reset();
    setMode('entry');
  }, [reset]);

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

  // Entry mode
  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="max-w-[500px] mx-auto">
        <CardContent className="py-3">
          <Text size="sm" color="muted" className="text-center">
            {t('enter.instructions')}
          </Text>
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
        onValidate={validate}
        isValidating={isValidating}
        clueCount={clueCount}
      />
    </div>
  );
}
