import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heading, Text } from '@sudobility/components';
import { LocalizedLink } from '@/components/layout/LocalizedLink';
import { useApi } from '@/context/apiContextDef';
import { useGameDataStore } from '@/stores/gameDataStore';
import { getInfoService } from '@sudobility/di';
import { InfoType } from '@sudobility/types';
import { getBeltForLevel, getBeltIconSvg } from '@sudobility/sudojo_types';
import { Section } from '@/components/layout/Section';

/** Belt icon component that renders the martial arts belt SVG */
function BeltIcon({ levelIndex, width = 60, height = 24 }: { levelIndex: number; width?: number; height?: number }) {
  const belt = getBeltForLevel(levelIndex);
  if (!belt) return null;

  const svg = getBeltIconSvg(belt.hex, width, height);
  return <div dangerouslySetInnerHTML={{ __html: svg }} className="flex-shrink-0" />;
}

export default function LevelsPage() {
  const { t } = useTranslation();
  const { networkClient, config, auth } = useApi();

  const {
    levels,
    levelsLoading: isLoading,
    levelsError: error,
    fetchLevels,
  } = useGameDataStore();

  // Fetch levels on mount (only fetches if not already fetched)
  useEffect(() => {
    fetchLevels(networkClient, config, auth);
  }, [networkClient, config, auth, fetchLevels]);

  // Show error via InfoService instead of rendering on page
  useEffect(() => {
    if (error) {
      getInfoService().show(t('common.error'), t('levels.loadError'), InfoType.ERROR, 5000);
    }
  }, [error, t]);

  return (
    <>
      {/* Section 1: Play */}
      <Section spacing="lg">
        <Heading level={2} size="xl" className="mb-4">
          {t('nav.play')}
        </Heading>
        <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
          <LocalizedLink
            to="/play/enter"
            className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Text weight="medium">{t('nav.enter')}</Text>
            <Text color="muted">→</Text>
          </LocalizedLink>
        </div>
      </Section>

      {/* Section 2: Levels */}
      <Section spacing="xl">
        <Heading level={2} size="xl" className="mb-4">
          {t('levels.title')}
        </Heading>

        {isLoading && (
          <div className="text-center py-12">
            <Text color="muted">{t('common.loading')}</Text>
          </div>
        )}

        {!isLoading && !error && levels.length === 0 && (
          <div className="text-center py-12">
            <Text color="muted">{t('levels.empty')}</Text>
          </div>
        )}

        <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
          {levels.map(level => (
            <LocalizedLink
              key={level.uuid}
              to={`/play/${level.uuid}`}
              className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                <BeltIcon levelIndex={level.index} />
                <div>
                  <Text weight="medium">{level.title}</Text>
                  {level.text && (
                    <Text size="sm" color="muted">
                      {level.text}
                    </Text>
                  )}
                </div>
              </div>
              <Text color="muted">→</Text>
            </LocalizedLink>
          ))}
        </div>
      </Section>
    </>
  );
}
