import { useTranslation } from 'react-i18next';
import { Heading, Text } from '@sudobility/components';
import { SudokuGame } from '@/components/sudoku';

// TODO: Replace with actual API call to get daily puzzle
const SAMPLE_PUZZLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const SAMPLE_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

export default function DailyPage() {
  const { t } = useTranslation();

  const handleComplete = () => {
    // TODO: Save completion to user progress
    console.log('Daily puzzle completed!');
  };

  return (
    <div className="py-8">
      <header className="mb-8">
        <Heading level={1} size="2xl" className="mb-2">
          {t('daily.title')}
        </Heading>
        <Text color="muted">{t('daily.subtitle')}</Text>
      </header>

      <SudokuGame
        puzzle={SAMPLE_PUZZLE}
        solution={SAMPLE_SOLUTION}
        showErrors={true}
        onComplete={handleComplete}
      />
    </div>
  );
}
