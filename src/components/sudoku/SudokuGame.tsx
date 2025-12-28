import { useEffect, useCallback, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSudoku } from '@sudobility/sudojo_lib';
import { Card, CardContent, Text } from '@sudobility/components';
import SudokuCanvas from './SudokuCanvas';
import SudokuControls from './SudokuControls';
import CompletionCelebration from './CompletionCelebration';
import HintPanel from './HintPanel';
import GameTimer from './GameTimer';
import ProgressPie from './ProgressPie';
import { useHint } from '@/hooks/useHint';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useTheme } from '@/hooks/useTheme';
import { getInfoService } from '@sudobility/di';
import { InfoType } from '@sudobility/types';

interface SudokuGameProps {
  puzzle: string;
  solution: string;
  showErrors?: boolean;
  showTimer?: boolean;
  onComplete?: (timeSeconds: number) => void;
}

export default function SudokuGame({ puzzle, solution, showErrors = true, showTimer = true, onComplete }: SudokuGameProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const [showCelebration, setShowCelebration] = useState(false);
  const prevCompletedRef = useRef(false);

  // Game timer
  const { formattedTime, isRunning, stop: stopTimer } = useGameTimer({ autoStart: true });

  const {
    board,
    play,
    selectedIndex,
    isPencilMode,
    isCompleted,
    progress,
    canUndo,
    loadBoard,
    selectCell,
    input,
    erase,
    togglePencilMode,
    undo,
    autoPencilmarks,
    applyHintData,
    getInputString,
    getPencilmarksString,
  } = useSudoku();

  // Load the puzzle on mount
  useEffect(() => {
    loadBoard(puzzle, solution, { scramble: false });
  }, [puzzle, solution, loadBoard]);

  // Handle completion - trigger celebration when puzzle is first completed
  useEffect(() => {
    if (isCompleted && !prevCompletedRef.current) {
      prevCompletedRef.current = true;
      const finalTime = stopTimer();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowCelebration(true);
      onComplete?.(finalTime);
    } else if (!isCompleted) {
      prevCompletedRef.current = false;
    }
  }, [isCompleted, onComplete, stopTimer]);

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

  // Get cells array from board (empty array if no board)
  const cells = board?.cells ?? [];

  // Hints system
  const {
    hint,
    stepIndex,
    totalSteps,
    hasNextStep,
    hasPreviousStep,
    canApply,
    isLoading: isHintLoading,
    error: hintError,
    getHint,
    nextStep,
    previousStep,
    clearHint,
    applyHint,
  } = useHint({
    puzzle,
    userInput: getInputString(),
    pencilmarks: getPencilmarksString(),
    autoPencilmarks: play?.settings.autoPencilmarks ?? false,
  });

  // Show hint error via InfoService instead of rendering on page
  useEffect(() => {
    if (hintError) {
      getInfoService().show(t('game.hint.error'), hintError, InfoType.ERROR, 5000);
    }
  }, [hintError, t]);

  // Handle applying hint to the board
  const handleApplyHint = useCallback(() => {
    const hintData = applyHint();
    if (hintData) {
      applyHintData(hintData.user, hintData.pencilmarks, hintData.autoPencilmarks);
    }
  }, [applyHint, applyHintData]);

  return (
    <div className="space-y-6">
      {/* Celebration animation */}
      <CompletionCelebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Timer and Progress */}
      <div className="flex items-center justify-between max-w-[500px] mx-auto">
        {/* Timer */}
        {showTimer && (
          <GameTimer time={formattedTime} isRunning={isRunning && !isCompleted} />
        )}
        {!showTimer && <div />}

        {/* Progress pie chart - always rendered to prevent layout shift */}
        <ProgressPie progress={progress} />
      </div>

      {/* Completion message */}
      {isCompleted && (
        <Card className="max-w-[500px] mx-auto">
          <CardContent className="py-4 text-center">
            <Text weight="medium" className="text-green-600 dark:text-green-400">
              {t('game.completed')}
            </Text>
            {showTimer && (
              <Text size="sm" color="muted" className="mt-1">
                {t('game.completedTime', { time: formattedTime })}
              </Text>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sudoku board */}
      <SudokuCanvas
        board={cells}
        selectedIndex={selectedIndex}
        onCellSelect={handleCellSelect}
        showErrors={showErrors}
        hint={hint}
        isDarkMode={isDarkMode}
      />

      {/* Hint panel - shown below grid, hides controls */}
      {hint && (
        <HintPanel
          hint={hint}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          hasNextStep={hasNextStep}
          hasPreviousStep={hasPreviousStep}
          canApply={canApply}
          onNextStep={nextStep}
          onPreviousStep={previousStep}
          onApply={handleApplyHint}
          onDismiss={clearHint}
        />
      )}

      {/* Controls - hidden during hint mode */}
      {!hint && (
        <SudokuControls
          onNumberInput={handleNumberInput}
          onErase={erase}
          onUndo={undo}
          onTogglePencil={togglePencilMode}
          onAutoPencil={autoPencilmarks}
          onHint={getHint}
          isPencilMode={isPencilMode}
          canUndo={canUndo}
          isHintLoading={isHintLoading}
          disabled={isCompleted}
        />
      )}
    </div>
  );
}
