import { useTranslation } from 'react-i18next';
import { Button } from '@sudobility/components';

interface SudokuControlsProps {
  onNumberInput: (value: number) => void;
  onErase: () => void;
  onUndo: () => void;
  onTogglePencil: () => void;
  onAutoPencil?: () => void;
  onHint?: () => void;
  isPencilMode: boolean;
  canUndo: boolean;
  isHintLoading?: boolean;
  disabled?: boolean;
}

export default function SudokuControls({
  onNumberInput,
  onErase,
  onUndo,
  onTogglePencil,
  onAutoPencil,
  onHint,
  isPencilMode,
  canUndo,
  isHintLoading = false,
  disabled = false,
}: SudokuControlsProps) {
  const { t } = useTranslation();

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="w-full max-w-[500px] mx-auto space-y-4">
      {/* Number pad */}
      <div className="grid grid-cols-9 gap-1 sm:gap-2">
        {numbers.map(num => (
          <button
            key={num}
            onClick={() => onNumberInput(num)}
            disabled={disabled}
            className="aspect-square text-lg sm:text-xl font-semibold rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={isPencilMode ? 'primary' : 'outline'}
          size="sm"
          onClick={onTogglePencil}
          disabled={disabled}
        >
          {isPencilMode ? t('game.pencilOn') : t('game.pencilOff')}
        </Button>

        <Button variant="outline" size="sm" onClick={onErase} disabled={disabled}>
          {t('game.erase')}
        </Button>

        <Button variant="outline" size="sm" onClick={onUndo} disabled={disabled || !canUndo}>
          {t('game.undo')}
        </Button>

        {onAutoPencil && (
          <Button variant="outline" size="sm" onClick={onAutoPencil} disabled={disabled}>
            {t('game.autoPencil')}
          </Button>
        )}

        {onHint && (
          <Button
            variant="outline"
            size="sm"
            onClick={onHint}
            disabled={disabled || isHintLoading}
          >
            {isHintLoading ? t('game.hint.loading') : t('game.hint.get')}
          </Button>
        )}
      </div>
    </div>
  );
}
