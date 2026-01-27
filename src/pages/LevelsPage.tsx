import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
import { Heading, Text } from '@sudobility/components';
import { useGamePlay } from '@sudobility/sudojo_lib';
import { LocalizedLink } from '@/components/layout/LocalizedLink';
import { useApi } from '@/context/apiContextDef';
import { useGameDataStore } from '@/stores/gameDataStore';
import { getInfoService } from '@sudobility/di';
import { InfoType } from '@sudobility/types';
import { getBeltForLevel, getBeltIconSvg, type Technique } from '@sudobility/sudojo_types';
import { Section } from '@/components/layout/Section';

/** Belt icon component that renders the martial arts belt SVG */
function BeltIcon({ levelIndex, width = 48, height = 20 }: { levelIndex: number; width?: number; height?: number }) {
  const belt = getBeltForLevel(levelIndex);
  if (!belt) return null;

  const svg = getBeltIconSvg(belt.hex, width, height);
  return <div dangerouslySetInnerHTML={{ __html: svg }} className="flex-shrink-0" />;
}

export default function LevelsPage() {
  const { t } = useTranslation();
  const { networkClient, baseUrl, token } = useApi();

  const {
    levels,
    levelsLoading,
    levelsError,
    fetchLevels,
    techniques,
    techniquesLoading,
    techniquesError,
    fetchTechniques,
  } = useGameDataStore();

  // Current game for "Continue" button
  const { currentGame, hasCurrentGame } = useGamePlay();

  // Get continue path based on game source
  const getContinuePath = () => {
    if (!currentGame) return '/play';
    switch (currentGame.source) {
      case 'daily':
        return '/daily';
      case 'level':
        return `/play/${currentGame.meta.levelId}`;
      case 'entered':
        return '/play/enter';
    }
  };

  // Get continue description text
  const getContinueDescription = () => {
    if (!currentGame) return '';
    switch (currentGame.source) {
      case 'daily':
        return t('play.continueDaily');
      case 'level':
        return currentGame.meta.levelTitle
          ? t('play.continueLevel', { level: currentGame.meta.levelTitle })
          : t('play.continuePuzzle');
      case 'entered':
        return t('play.continueEntered');
    }
  };

  const isLoading = levelsLoading || techniquesLoading;
  const error = levelsError || techniquesError;

  // Fetch levels and techniques on mount (only fetches if not already fetched)
  useEffect(() => {
    fetchLevels(networkClient, baseUrl, token ?? '');
    fetchTechniques(networkClient, baseUrl, token ?? '');
  }, [networkClient, baseUrl, token, fetchLevels, fetchTechniques]);

  // Create a map of level_uuid to techniques
  const techniquesByLevel = useMemo(() => {
    const map = new Map<string, Technique[]>();
    for (const technique of techniques) {
      if (technique.level_uuid) {
        const existing = map.get(technique.level_uuid) || [];
        existing.push(technique);
        map.set(technique.level_uuid, existing);
      }
    }
    // Sort techniques by index within each level
    for (const [key, value] of map) {
      map.set(key, value.sort((a, b) => a.index - b.index));
    }
    return map;
  }, [techniques]);

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
          {/* Continue Last Sudoku button */}
          {hasCurrentGame && currentGame && (
            <LocalizedLink
              to={getContinuePath()}
              className="flex items-center justify-between py-4 px-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors rounded-lg mb-2"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 flex justify-center flex-shrink-0">
                  <PlayIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <Text weight="medium" className="text-blue-600 dark:text-blue-400">
                    {t('play.continue')}
                  </Text>
                  <Text size="sm" color="muted">
                    {getContinueDescription()}
                  </Text>
                </div>
              </div>
              <Text color="muted">→</Text>
            </LocalizedLink>
          )}
          <LocalizedLink
            to="/play/enter"
            className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 flex justify-center flex-shrink-0">
                <PencilSquareIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </div>
              <Text weight="medium">{t('nav.enter')}</Text>
            </div>
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
          {levels.map(level => {
            const belt = getBeltForLevel(level.index);
            const levelTechniques = techniquesByLevel.get(level.uuid) || [];
            const techniqueNames = levelTechniques.map(t => t.title).join(', ');
            const subtitle = level.text && techniqueNames
              ? `${level.text} - ${techniqueNames}`
              : level.text || techniqueNames || null;

            return (
              <LocalizedLink
                key={level.uuid}
                to={`/play/${level.uuid}`}
                className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <BeltIcon levelIndex={level.index} />
                  <div>
                    <Text weight="medium">
                      Level {level.index}, {belt?.name ?? ''} Belt
                    </Text>
                    {subtitle && (
                      <Text size="sm" color="muted">
                        {subtitle}
                      </Text>
                    )}
                  </div>
                </div>
                <Text color="muted">→</Text>
              </LocalizedLink>
            );
          })}
        </div>
      </Section>
    </>
  );
}
