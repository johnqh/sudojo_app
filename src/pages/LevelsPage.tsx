import { useTranslation } from 'react-i18next';
import { Heading, Text, Card, CardContent } from '@sudobility/components';
import { LocalizedLink } from '@/components/layout/LocalizedLink';

// TODO: Replace with actual API call using useSudojoLevels
const MOCK_LEVELS = [
  { uuid: '1', index: 1, title: 'Beginner' },
  { uuid: '2', index: 2, title: 'Easy' },
  { uuid: '3', index: 3, title: 'Medium' },
  { uuid: '4', index: 4, title: 'Hard' },
  { uuid: '5', index: 5, title: 'Expert' },
];

export default function LevelsPage() {
  const { t } = useTranslation();

  return (
    <div className="py-8">
      <header className="mb-8">
        <Heading level={1} size="2xl">
          {t('levels.title')}
        </Heading>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_LEVELS.map(level => (
          <LocalizedLink key={level.uuid} to={`/levels/${level.uuid}`} className="block">
            <Card variant="elevated" className="hover:shadow-lg transition-shadow">
              <CardContent className="py-6">
                <Text size="sm" color="muted" className="mb-1">
                  {t('levels.level', { number: level.index })}
                </Text>
                <Heading level={3} size="lg">
                  {level.title}
                </Heading>
              </CardContent>
            </Card>
          </LocalizedLink>
        ))}
      </div>
    </div>
  );
}
