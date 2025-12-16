import { useMemo, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MasterDetailLayout, MasterListItem, Heading, Text, Card, CardContent } from '@sudobility/components';
import { useSudojoTechniques, useSudojoLearning } from '@sudobility/sudojo_client';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { useSudojoClient } from '@/hooks/useSudojoClient';

export default function TechniquesPage() {
  const { techniqueId } = useParams<{ techniqueId: string }>();
  const { t, i18n } = useTranslation();
  const { navigate } = useLocalizedNavigate();
  const { networkClient, config } = useSudojoClient();

  // Mobile view state - show content when techniqueId is present
  const [mobileViewOverride, setMobileViewOverride] = useState<'navigation' | 'content' | null>(null);
  const mobileView = mobileViewOverride ?? (techniqueId ? 'content' : 'navigation');

  // Fetch techniques list
  const { data: techniquesData, isLoading: techniquesLoading } = useSudojoTechniques(networkClient, config);
  const techniques = techniquesData?.data ?? [];

  // Fetch learning content for selected technique
  const learningParams = useMemo(
    () => ({
      technique_uuid: techniqueId,
      language_code: i18n.language,
    }),
    [techniqueId, i18n.language]
  );
  const { data: learningData, isLoading: learningLoading } = useSudojoLearning(
    networkClient,
    config,
    learningParams,
    { enabled: !!techniqueId }
  );
  const learningItems = learningData?.data ?? [];

  const selectedTechnique = techniques.find(tech => tech.uuid === techniqueId);

  const handleTechniqueSelect = useCallback(
    (uuid: string) => {
      setMobileViewOverride('content');
      navigate(`/techniques/${uuid}`);
    },
    [navigate]
  );

  const handleBackToNavigation = useCallback(() => {
    setMobileViewOverride('navigation');
    navigate('/techniques');
  }, [navigate]);

  const masterContent = (
    <div className="space-y-1">
      {techniquesLoading && (
        <div className="p-4 text-center">
          <Text color="muted">{t('common.loading')}</Text>
        </div>
      )}
      {techniques.map(technique => (
        <MasterListItem
          key={technique.uuid}
          isSelected={technique.uuid === techniqueId}
          onClick={() => handleTechniqueSelect(technique.uuid)}
          label={technique.title}
          description={technique.text ?? undefined}
        />
      ))}
      {!techniquesLoading && techniques.length === 0 && (
        <div className="p-4 text-center">
          <Text color="muted">{t('techniques.empty')}</Text>
        </div>
      )}
    </div>
  );

  const detailContent = selectedTechnique ? (
    <div>
      <Heading level={2} size="xl" className="mb-4">
        {selectedTechnique.title}
      </Heading>

      {selectedTechnique.text && (
        <Text className="mb-6">{selectedTechnique.text}</Text>
      )}

      {learningLoading && (
        <div className="p-4 text-center">
          <Text color="muted">{t('common.loading')}</Text>
        </div>
      )}

      {learningItems.length > 0 ? (
        <div className="space-y-4">
          {learningItems
            .sort((a, b) => a.index - b.index)
            .map(item => (
              <Card key={item.uuid}>
                <CardContent className="py-4">
                  {item.text && <Text>{item.text}</Text>}
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={`Learning step ${item.index}`}
                      className="mt-4 rounded-lg max-w-full"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        !learningLoading && (
          <Card>
            <CardContent className="py-4">
              <Text color="muted">{t('techniques.noContent')}</Text>
            </CardContent>
          </Card>
        )
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center h-full text-center">
      <Text color="muted">{t('techniques.selectTechnique')}</Text>
    </div>
  );

  return (
    <div className="py-8">
      <MasterDetailLayout
        masterTitle={t('techniques.title')}
        masterContent={masterContent}
        detailContent={detailContent}
        detailTitle={selectedTechnique?.title}
        mobileView={mobileView}
        onBackToNavigation={handleBackToNavigation}
        masterWidth={320}
        stickyMaster
        stickyTopOffset={80}
      />
    </div>
  );
}
