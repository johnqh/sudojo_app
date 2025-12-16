import { useTranslation } from 'react-i18next';
import { Card, CardContent, Text, Button } from '@sudobility/components';
import type { HintStep } from '@sudobility/sudojo_solver_client';

interface HintPanelProps {
  hint: HintStep;
  stepIndex: number;
  totalSteps: number;
  hasNextStep: boolean;
  hasPreviousStep: boolean;
  canApply: boolean;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onApply: () => void;
  onDismiss: () => void;
}

export default function HintPanel({
  hint,
  stepIndex,
  totalSteps,
  hasNextStep,
  hasPreviousStep,
  canApply,
  onNextStep,
  onPreviousStep,
  onApply,
  onDismiss,
}: HintPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="max-w-[500px] mx-auto border-l-4 border-l-blue-500">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Step progress indicator */}
            {totalSteps > 1 && (
              <Text size="xs" color="muted">
                {t('game.hint.step', { current: stepIndex + 1, total: totalSteps })}
              </Text>
            )}
            <Text weight="semibold" className="text-blue-600 dark:text-blue-400">
              {hint.title}
            </Text>
            <Text size="sm" color="muted">
              {hint.text}
            </Text>
            {/* Navigation buttons */}
            <div className="flex gap-2 pt-2">
              {totalSteps > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreviousStep}
                  disabled={!hasPreviousStep}
                >
                  {t('game.hint.previous')}
                </Button>
              )}
              {hasNextStep ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextStep}
                >
                  {t('game.hint.next')}
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onApply}
                  disabled={!canApply}
                >
                  {t('game.hint.apply')}
                </Button>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            aria-label={t('game.hint.dismiss')}
          >
            ✕
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
