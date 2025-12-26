import { useTranslation } from 'react-i18next';
import { Button } from '@sudobility/components';

interface EntryControlsProps {
  onNumberInput: (value: number) => void;
  onErase: () => void;
  onValidate: () => void;
  isValidating: boolean;
  disabled?: boolean;
  clueCount?: number;
}

export default function EntryControls({
  onNumberInput,
  onErase,
  onValidate,
  isValidating,
  disabled = false,
  clueCount = 0,
}: EntryControlsProps) {
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
            className="aspect-square min-h-[44px] text-lg sm:text-xl font-semibold rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] active:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Clue counter */}
      <div className="text-center text-sm text-[var(--color-text-secondary)]">
        {t('enter.clueCount', { count: clueCount })} {clueCount < 17 && t('enter.minClues')}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={onErase} disabled={disabled}>
          {t('game.erase')}
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onValidate}
          disabled={disabled || isValidating || clueCount < 17}
        >
          {isValidating ? t('enter.validating') : t('enter.validate')}
        </Button>
      </div>
    </div>
  );
}
