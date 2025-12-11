import { useTranslation } from 'react-i18next';
import { Card, CardContent, Text, Button } from '@sudobility/components';
import type { HintStep } from '@sudobility/sudojo_solver_client';

interface HintPanelProps {
  hint: HintStep;
  onDismiss: () => void;
}

export default function HintPanel({ hint, onDismiss }: HintPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="max-w-[500px] mx-auto border-l-4 border-l-blue-500">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Text weight="semibold" className="text-blue-600 dark:text-blue-400">
              {hint.title}
            </Text>
            <Text size="sm" color="muted">
              {hint.text}
            </Text>
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
