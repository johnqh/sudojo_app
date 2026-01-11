import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import ScreenContainer from '@/components/layout/ScreenContainer';
import { LocalizedLink } from '@/components/layout/LocalizedLink';
import { CONSTANTS } from '@/config/constants';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type SupportedLanguage } from '@/config/languages';
import { AppSitemapPage } from '@sudobility/building_blocks';
import type {
  SitemapPageText,
  SitemapSection,
  LanguageOption,
  QuickLink,
  LinkComponentProps,
} from '@sudobility/building_blocks';

// Language flags
const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇺🇸',
  zh: '🇨🇳',
};

// Link wrapper component that integrates with AppSitemapPage
const LinkWrapper: React.FC<LinkComponentProps & { language?: string }> = ({
  href,
  className,
  children,
  language,
}) => {
  if (language) {
    return (
      <LocalizedLink to={href} className={className} language={language as SupportedLanguage}>
        {children}
      </LocalizedLink>
    );
  }
  return (
    <LocalizedLink to={href} className={className}>
      {children}
    </LocalizedLink>
  );
};

export default function SitemapPage() {
  const { t } = useTranslation('sitemap');
  const appName = CONSTANTS.APP_NAME;

  // Build language options
  const languageOptions: LanguageOption[] = useMemo(() => {
    return [...SUPPORTED_LANGUAGES].map((code) => ({
      code,
      name: LANGUAGE_NAMES[code],
      flag: LANGUAGE_FLAGS[code],
    }));
  }, []);

  const sections: SitemapSection[] = [
    {
      title: t('sections.main', 'Main Pages'),
      icon: 'home',
      links: [
        {
          path: '/',
          label: t('links.home', 'Home'),
          description: t('descriptions.home', 'Landing page'),
        },
        {
          path: '/daily',
          label: t('links.daily', 'Daily Challenge'),
          description: t('descriptions.daily', 'New puzzle every day'),
        },
        {
          path: '/play',
          label: t('links.levels', 'Levels'),
          description: t('descriptions.levels', 'Progressive skill levels'),
        },
        {
          path: '/techniques',
          label: t('links.techniques', 'Techniques'),
          description: t('descriptions.techniques', 'Learn solving techniques'),
        },
      ],
    },
    {
      title: t('sections.learn', 'Learning'),
      icon: 'document',
      links: [
        {
          path: '/techniques',
          label: t('links.allTechniques', 'All Techniques'),
          description: t('descriptions.allTechniques', 'Browse all solving techniques'),
        },
        {
          path: '/daily',
          label: t('links.practice', 'Daily Practice'),
          description: t('descriptions.practice', 'Improve with daily puzzles'),
        },
      ],
    },
    {
      title: t('sections.account', 'Account'),
      icon: 'cog',
      links: [
        {
          path: '/settings',
          label: t('links.settings', 'Settings'),
          description: t('descriptions.settings', 'App preferences'),
        },
        {
          path: '/pricing',
          label: t('links.pricing', 'Pricing'),
          description: t('descriptions.pricing', 'Subscription plans'),
        },
        {
          path: '/subscription',
          label: t('links.subscription', 'Subscription'),
          description: t('descriptions.subscription', 'Manage your subscription'),
        },
      ],
    },
    {
      title: t('sections.legal', 'Legal'),
      icon: 'document',
      links: [
        {
          path: '/privacy',
          label: t('links.privacy', 'Privacy Policy'),
          description: t('descriptions.privacy', 'Privacy and data protection'),
        },
        {
          path: '/terms',
          label: t('links.terms', 'Terms of Service'),
          description: t('descriptions.terms', 'Terms and conditions'),
        },
      ],
    },
  ];

  // Build quick links
  const quickLinks: QuickLink[] = [
    {
      path: '/daily',
      label: t('quickLinks.daily', 'Play Daily'),
      variant: 'primary',
    },
    {
      path: '/play',
      label: t('quickLinks.levels', 'Play Levels'),
      variant: 'secondary',
    },
    {
      path: '/techniques',
      label: t('quickLinks.techniques', 'Learn Techniques'),
      variant: 'outline',
      icon: 'document',
    },
  ];

  // Build text content
  const text: SitemapPageText = {
    title: t('title', 'Sitemap'),
    subtitle: t('subtitle', {
      defaultValue: `Explore all pages and features available on ${appName}`,
      appName,
    }),
    languagesSectionTitle: t('sections.languages', 'Languages'),
    languagesDescription: t('languageDescription', {
      defaultValue: `${appName} is available in multiple languages. Select your preferred language:`,
      appName,
    }),
    quickLinksTitle: t('quickLinks.title', 'Quick Links'),
  };

  return (
    <ScreenContainer>
      <Helmet>
        <title>{t('meta.title', { defaultValue: `Sitemap - ${appName}`, appName })}</title>
        <meta
          name="description"
          content={t('meta.description', {
            defaultValue: `Navigate all pages and features available on ${appName}`,
            appName,
          })}
        />
      </Helmet>

      <AppSitemapPage
        text={text}
        sections={sections}
        languages={languageOptions}
        quickLinks={quickLinks}
        LinkComponent={LinkWrapper}
      />
    </ScreenContainer>
  );
}
