import { useTranslation } from 'react-i18next';
import { Card, CardContent, Heading, Text } from '@sudobility/components';
import { LocalizedLink } from '@/components/layout/LocalizedLink';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="py-16">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <Heading level={1} size="4xl" className="mb-4">
          {t('home.hero.title')}
        </Heading>
        <Text size="xl" color="muted" className="max-w-2xl mx-auto">
          {t('home.hero.subtitle')}
        </Text>
      </section>

      {/* CTA Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <LocalizedLink to="/daily" className="block">
          <Card variant="elevated" className="h-full hover:shadow-lg transition-shadow">
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-4">📅</div>
              <Heading level={3} size="lg" className="mb-2">
                {t('daily.title')}
              </Heading>
              <Text color="muted">{t('daily.subtitle')}</Text>
            </CardContent>
          </Card>
        </LocalizedLink>

        <LocalizedLink to="/play" className="block">
          <Card variant="elevated" className="h-full hover:shadow-lg transition-shadow">
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-4">🎯</div>
              <Heading level={3} size="lg" className="mb-2">
                {t('levels.title')}
              </Heading>
              <Text color="muted">{t('home.cta.levels')}</Text>
            </CardContent>
          </Card>
        </LocalizedLink>

        <LocalizedLink to="/techniques" className="block">
          <Card variant="elevated" className="h-full hover:shadow-lg transition-shadow">
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-4">📚</div>
              <Heading level={3} size="lg" className="mb-2">
                {t('techniques.title')}
              </Heading>
              <Text color="muted">{t('home.cta.techniques')}</Text>
            </CardContent>
          </Card>
        </LocalizedLink>
      </section>
    </div>
  );
}
