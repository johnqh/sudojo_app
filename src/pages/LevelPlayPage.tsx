import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heading, Text } from '@sudobility/components';

export default function LevelPlayPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { t } = useTranslation();

  return (
    <div className="py-8">
      <header className="mb-8">
        <Heading level={1} size="2xl" className="mb-2">
          {t('levels.level', { number: levelId })}
        </Heading>
      </header>

      {/* TODO: Add SudokuGame component here */}
      <div className="aspect-square max-w-lg mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <Text color="muted">Sudoku Board Coming Soon</Text>
      </div>
    </div>
  );
}
