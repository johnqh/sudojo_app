import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MasterDetailLayout, MasterListItem, Text, Card, CardContent } from '@sudobility/components';
import { useSudojoLearning } from '@sudobility/sudojo_client';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { useApi } from '@/context/apiContextDef';
import { useBreadcrumbTitle } from '@/hooks/useBreadcrumbTitle';
import { useGameDataStore } from '@/stores/gameDataStore';
import {
  getTechniqueIconUrl,
  getHelpFileUrl,
  getTechniqueFromHelpFile,
  extractBodyContent,
} from '@sudobility/sudojo_lib';
import { Section } from '@/components/layout/Section';

// Cache for memoized icon components
const techniqueIconCache = new Map<string, React.ComponentType<{ className?: string }>>();

// Create an icon component for a technique (memoized)
function getTechniqueIcon(title: string): React.ComponentType<{ className?: string }> {
  if (!techniqueIconCache.has(title)) {
    const iconUrl = getTechniqueIconUrl(title);
    const TechniqueIcon = ({ className }: { className?: string }) => (
      <img
        src={iconUrl}
        alt=""
        className={className}
        style={{ width: '24px', height: '24px' }}
      />
    );
    TechniqueIcon.displayName = `TechniqueIcon(${title})`;
    techniqueIconCache.set(title, TechniqueIcon);
  }
  return techniqueIconCache.get(title)!;
}

// Simple HTML content fetcher - derives state from fetch results, no sync setState
type FetchResult = { content: string; error?: undefined } | { content?: undefined; error: Error };

function useHtmlContent(url: string | null) {
  const [results, setResults] = useState<Record<string, FetchResult>>({});

  useEffect(() => {
    if (!url || url in results) {
      return;
    }

    let cancelled = false;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        if (cancelled) return;
        const extractedContent = extractBodyContent(html);
        setResults(prev => ({ ...prev, [url]: { content: extractedContent } }));
      })
      .catch(err => {
        if (cancelled) return;
        setResults(prev => ({
          ...prev,
          [url]: { error: err instanceof Error ? err : new Error(String(err)) },
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [url, results]);

  // Derive state from results - no synchronous setState needed
  if (!url) {
    return { content: null, isLoading: false, error: null };
  }
  if (url in results) {
    const result = results[url];
    return {
      content: result.content ?? null,
      isLoading: false,
      error: result.error ?? null,
    };
  }
  // Not in results yet = loading
  return { content: null, isLoading: true, error: null };
}

export default function TechniquesPage() {
  const { techniqueId } = useParams<{ techniqueId: string }>();
  const { t, i18n } = useTranslation();
  const { navigate } = useLocalizedNavigate();
  const { networkClient, baseUrl, token } = useApi();

  // Mobile view state - show content when techniqueId is present
  const [mobileViewOverride, setMobileViewOverride] = useState<'navigation' | 'content' | null>(null);
  const mobileView = mobileViewOverride ?? (techniqueId ? 'content' : 'navigation');

  // Get techniques from store
  const {
    techniques,
    techniquesLoading,
    fetchTechniques,
  } = useGameDataStore();

  // Fetch techniques on mount (only fetches if not already fetched)
  useEffect(() => {
    fetchTechniques(networkClient, baseUrl, token ?? '');
  }, [networkClient, baseUrl, token, fetchTechniques]);

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
    baseUrl,
    token ?? '',
    learningParams,
    { enabled: !!techniqueId }
  );
  const learningItems = learningData?.data ?? [];

  const selectedTechnique = techniques.find(tech => tech.uuid === techniqueId);

  // Set dynamic breadcrumb title for the selected technique
  useBreadcrumbTitle(selectedTechnique?.title);

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

  // Handle clicks on links in technique content
  const handleContentClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Check if it's a technique link (ends with .html)
      if (href.endsWith('.html') && href !== 'index.html') {
        event.preventDefault();

        // Get the filename and look up the technique
        const fileName = href.toLowerCase();
        const techniqueTitle = getTechniqueFromHelpFile(fileName);

        if (techniqueTitle) {
          // Find the technique by title
          const technique = techniques.find(t => t.title === techniqueTitle);
          if (technique) {
            handleTechniqueSelect(technique.uuid);
          }
        }
      }
    },
    [techniques, handleTechniqueSelect]
  );

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
          icon={getTechniqueIcon(technique.title)}
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

  const helpFileUrl = selectedTechnique ? getHelpFileUrl(selectedTechnique.title) : null;
  const { content: htmlContent, isLoading: htmlLoading } = useHtmlContent(helpFileUrl);

  const detailContent = selectedTechnique ? (
    <div className="h-full flex flex-col">
      {/* Embedded HTML instructions */}
      {htmlLoading && (
        <div className="p-4 text-center">
          <Text color="muted">{t('common.loading')}</Text>
        </div>
      )}

      {htmlContent && (
        <div
          className="technique-content prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          onClick={handleContentClick}
        />
      )}

      {learningLoading && (
        <div className="p-4 text-center">
          <Text color="muted">{t('common.loading')}</Text>
        </div>
      )}

      {learningItems.length > 0 && (
        <div className="space-y-4 mt-4">
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
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center h-full text-center">
      <Text color="muted">{t('techniques.selectTechnique')}</Text>
    </div>
  );

  return (
    <Section spacing="xl">
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
    </Section>
  );
}
