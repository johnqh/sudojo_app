import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useCallback } from 'react';
import { MasterDetailLayout, MasterListItem, Heading, Text, Card, CardContent } from '@sudobility/components';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';

// TODO: Replace with actual API calls
const MOCK_TECHNIQUES = [
  { uuid: '1', title: 'Naked Singles', text: 'Find cells with only one possible value' },
  { uuid: '2', title: 'Hidden Singles', text: 'Find values that can only go in one cell' },
  { uuid: '3', title: 'Naked Pairs', text: 'Two cells in a unit with the same two candidates' },
  { uuid: '4', title: 'Pointing Pairs', text: 'Candidates restricted to one box' },
  { uuid: '5', title: 'Box/Line Reduction', text: 'Candidates restricted to one row or column' },
];

export default function TechniquesPage() {
  const { techniqueId } = useParams<{ techniqueId: string }>();
  const { t } = useTranslation();
  const { navigate } = useLocalizedNavigate();

  // Mobile view state - show content when techniqueId is present
  const [mobileViewOverride, setMobileViewOverride] = useState<'navigation' | 'content' | null>(null);
  const mobileView = mobileViewOverride ?? (techniqueId ? 'content' : 'navigation');

  const selectedTechnique = MOCK_TECHNIQUES.find(tech => tech.uuid === techniqueId);

  const handleTechniqueSelect = useCallback((uuid: string) => {
    setMobileViewOverride('content');
    navigate(`/techniques/${uuid}`);
  }, [navigate]);

  const handleBackToNavigation = useCallback(() => {
    setMobileViewOverride('navigation');
    navigate('/techniques');
  }, [navigate]);

  const masterContent = (
    <div className="space-y-1">
      {MOCK_TECHNIQUES.map(technique => (
        <MasterListItem
          key={technique.uuid}
          isSelected={technique.uuid === techniqueId}
          onClick={() => handleTechniqueSelect(technique.uuid)}
          label={technique.title}
          description={technique.text}
        />
      ))}
    </div>
  );

  const detailContent = selectedTechnique ? (
    <div>
      <Heading level={2} size="xl" className="mb-4">
        {selectedTechnique.title}
      </Heading>
      <Card>
        <CardContent>
          <Text>{selectedTechnique.text}</Text>
          {/* TODO: Add learning content from API */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Text color="muted">Detailed learning content will appear here...</Text>
          </div>
        </CardContent>
      </Card>
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
