import { useTranslation } from 'react-i18next';
import { Card, CardContent, Heading, Text } from '@sudobility/components';
import { LocalizedLink } from '@/components/layout/LocalizedLink';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="py-8 md:py-16">
      {/* Hero Section */}
      <section className="text-center mb-16 md:mb-24">
        <Heading level={1} size="4xl" className="mb-4">
          {t('home.hero.title')}
        </Heading>
        <Text size="xl" color="muted" className="max-w-2xl mx-auto mb-6">
          {t('home.hero.subtitle')}
        </Text>
        <Text size="lg" className="max-w-3xl mx-auto text-gray-600 dark:text-gray-400">
          {t('home.hero.description')}
        </Text>
      </section>

      {/* What is Sudojo Section */}
      <section className="mb-16 md:mb-24 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Heading level={2} size="2xl" className="mb-4">
            {t('home.whatIs.title')}
          </Heading>
          <Text size="lg" color="muted" className="max-w-2xl mx-auto">
            {t('home.whatIs.subtitle')}
          </Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="bordered" className="text-center">
            <CardContent className="py-6">
              <div className="text-3xl mb-3">🧠</div>
              <Heading level={4} size="base" className="mb-2">
                {t('home.whatIs.learn.title')}
              </Heading>
              <Text size="sm" color="muted">
                {t('home.whatIs.learn.description')}
              </Text>
            </CardContent>
          </Card>

          <Card variant="bordered" className="text-center">
            <CardContent className="py-6">
              <div className="text-3xl mb-3">📈</div>
              <Heading level={4} size="base" className="mb-2">
                {t('home.whatIs.progress.title')}
              </Heading>
              <Text size="sm" color="muted">
                {t('home.whatIs.progress.description')}
              </Text>
            </CardContent>
          </Card>

          <Card variant="bordered" className="text-center">
            <CardContent className="py-6">
              <div className="text-3xl mb-3">🎯</div>
              <Heading level={4} size="base" className="mb-2">
                {t('home.whatIs.master.title')}
              </Heading>
              <Text size="sm" color="muted">
                {t('home.whatIs.master.description')}
              </Text>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mb-16 md:mb-24 bg-gray-50 dark:bg-gray-900 -mx-4 px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Heading level={2} size="2xl" className="mb-4">
              {t('home.howItWorks.title')}
            </Heading>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                1
              </div>
              <div>
                <Heading level={4} size="base" className="mb-2">
                  {t('home.howItWorks.step1.title')}
                </Heading>
                <Text size="sm" color="muted">
                  {t('home.howItWorks.step1.description')}
                </Text>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                2
              </div>
              <div>
                <Heading level={4} size="base" className="mb-2">
                  {t('home.howItWorks.step2.title')}
                </Heading>
                <Text size="sm" color="muted">
                  {t('home.howItWorks.step2.description')}
                </Text>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                3
              </div>
              <div>
                <Heading level={4} size="base" className="mb-2">
                  {t('home.howItWorks.step3.title')}
                </Heading>
                <Text size="sm" color="muted">
                  {t('home.howItWorks.step3.description')}
                </Text>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                4
              </div>
              <div>
                <Heading level={4} size="base" className="mb-2">
                  {t('home.howItWorks.step4.title')}
                </Heading>
                <Text size="sm" color="muted">
                  {t('home.howItWorks.step4.description')}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Techniques Preview Section */}
      <section className="mb-16 md:mb-24 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Heading level={2} size="2xl" className="mb-4">
            {t('home.techniques.title')}
          </Heading>
          <Text size="lg" color="muted" className="max-w-2xl mx-auto">
            {t('home.techniques.subtitle')}
          </Text>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['nakedSingle', 'hiddenSingle', 'nakedPair', 'xWing'].map((technique) => (
            <Card key={technique} variant="bordered" className="text-center">
              <CardContent className="py-4">
                <Text size="sm" className="font-medium">
                  {t(`home.techniques.list.${technique}`)}
                </Text>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-6">
          <LocalizedLink
            to="/techniques"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {t('home.techniques.viewAll')} →
          </LocalizedLink>
        </div>
      </section>

      {/* Smart Hints Section */}
      <section className="mb-16 md:mb-24 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <Heading level={2} size="2xl" className="mb-4">
              {t('home.hints.title')}
            </Heading>
            <Text size="lg" color="muted" className="mb-4">
              {t('home.hints.description')}
            </Text>
            <ul className="space-y-3">
              {['step1', 'step2', 'step3'].map((step) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <Text size="sm">{t(`home.hints.features.${step}`)}</Text>
                </li>
              ))}
            </ul>
          </div>
          <Card variant="elevated" className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardContent className="py-8 text-center">
              <div className="text-5xl mb-4">💡</div>
              <Text size="lg" className="font-medium mb-2">
                {t('home.hints.example.title')}
              </Text>
              <Text size="sm" color="muted">
                {t('home.hints.example.description')}
              </Text>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Cards */}
      <section className="mb-8">
        <div className="text-center mb-10">
          <Heading level={2} size="2xl" className="mb-4">
            {t('home.getStarted.title')}
          </Heading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
        </div>
      </section>
    </div>
  );
}
