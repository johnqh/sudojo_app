import { useTranslation } from 'react-i18next';
import { Heading, Text, Card, CardContent } from '@sudobility/components';
import { useSudojoLevels } from '@sudobility/sudojo_client';
import { LocalizedLink } from '@/components/layout/LocalizedLink';
import { useSudojoClient } from '@/hooks/useSudojoClient';

export default function LevelsPage() {
  const { t } = useTranslation();
  const { networkClient, config, auth } = useSudojoClient();

  const { data, isLoading, error } = useSudojoLevels(networkClient, config, auth);

  const levels = data?.data ?? [];

  return (
    <div className="py-8">
      <header className="mb-8">
        <Heading level={1} size="2xl">
          {t('levels.title')}
        </Heading>
      </header>

      {isLoading && (
        <div className="text-center py-12">
          <Text color="muted">{t('common.loading')}</Text>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <Text color="muted" className="text-red-500">
            {t('common.error')}
          </Text>
        </div>
      )}

      {!isLoading && !error && levels.length === 0 && (
        <div className="text-center py-12">
          <Text color="muted">{t('levels.empty')}</Text>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {levels.map(level => (
          <LocalizedLink key={level.uuid} to={`/levels/${level.uuid}`} className="block">
            <Card variant="elevated" className="hover:shadow-lg transition-shadow">
              <CardContent className="py-6">
                <Text size="sm" color="muted" className="mb-1">
                  {t('levels.level', { number: level.index })}
                </Text>
                <Heading level={3} size="lg">
                  {level.title}
                </Heading>
                {level.text && (
                  <Text size="sm" color="muted" className="mt-2">
                    {level.text}
                  </Text>
                )}
              </CardContent>
            </Card>
          </LocalizedLink>
        ))}
      </div>
    </div>
  );
}
