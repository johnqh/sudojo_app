import { useMemo, useCallback, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MasterDetailLayout, MasterListItem, Text, Card, CardContent } from '@sudobility/components';
import { useSudojoTechniques, useSudojoLearning } from '@sudobility/sudojo_client';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { useSudojoClient } from '@/hooks/useSudojoClient';

// Map technique titles to HTML help file paths
const techniqueToHelpFile: Record<string, string> = {
  'Full House': 'Full_House.html',
  'Naked Single': 'Naked_Single.html',
  'Hidden Single': 'Hidden_Single.html',
  'Naked Pair': 'Naked_Pair.html',
  'Hidden Pair': 'Hidden_Pair.html',
  'Locked Candidates': 'Locked_Candidates.html',
  'Naked Triple': 'Naked_Triple.html',
  'Hidden Triple': 'Hidden_Triple.html',
  'Naked Quad': 'Nakded_Quad.html', // Note: typo in original file name
  'Hidden Quad': 'Hidden_Quad.html',
  'X-Wing': 'X-Wing.html',
  'Swordfish': 'Swordfish.html',
  'Jellyfish': 'Jellyfish.html',
  'Squirmbag': 'Squirmbag.html',
  'XY-Wing': 'XY-Wing.html',
  'XYZ-Wing': 'XYZ-Wing.html',
  'WXYZ-Wing': 'WXYZ-Wing.html',
  'Finned X-Wing': 'Finned_X-Wing.html',
  'Finned Swordfish': 'Finned_Swordfish.html',
  'Finned Jellyfish': 'Finned_Jellyfish.html',
  'Finned Squirmbag': 'Finned_Squirmbag.html',
  'Almost Locked Sets': 'Almost_Locked_Sets.html',
  'ALS Chain': 'ALS-Chain.html',
  'ALS-Chain': 'ALS-Chain.html',
};

// Reverse mapping: HTML file name (lowercase) -> technique title
const helpFileToTechnique: Record<string, string> = Object.entries(techniqueToHelpFile).reduce(
  (acc, [title, file]) => {
    acc[file.toLowerCase()] = title;
    return acc;
  },
  {} as Record<string, string>
);

function getHelpFileUrl(techniqueTitle: string): string | null {
  const fileName = techniqueToHelpFile[techniqueTitle];
  if (fileName) {
    return `/help/${fileName}`;
  }
  // Try to generate file name from title (spaces to underscores, preserve hyphens)
  const generatedFileName = techniqueTitle.replace(/\s+/g, '_') + '.html';
  return `/help/${generatedFileName}`;
}

// Extract body content from HTML and clean up navigation links
function extractBodyContent(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove "Back to Course Catalog" links
  const links = doc.querySelectorAll('a[href="index.html"]');
  links.forEach(link => {
    const parent = link.closest('tr') || link.closest('td') || link.parentElement;
    if (parent) {
      parent.remove();
    }
  });

  // Fix image paths - convert relative paths to absolute /help/ paths
  const images = doc.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('/') && !src.startsWith('http')) {
      img.setAttribute('src', `/help/${src}`);
    }
  });

  // Get the body content
  return doc.body.innerHTML;
}

// Custom hook to fetch and parse HTML content
function useHtmlContent(url: string | null) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) {
      setContent(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        setContent(extractBodyContent(html));
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
      });
  }, [url]);

  return { content, isLoading, error };
}

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
        const techniqueTitle = helpFileToTechnique[fileName];

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
