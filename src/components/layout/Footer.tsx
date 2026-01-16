import { useTranslation } from 'react-i18next';
import {
  AppFooter,
  AppFooterForHomePage,
  type FooterLinkSection,
} from '@sudobility/building_blocks';
import { LocalizedLink } from './LocalizedLink';
import { useBuildingBlocksAnalytics } from '@/hooks/useBuildingBlocksAnalytics';

interface FooterProps {
  variant?: 'full' | 'compact';
}

// Link wrapper for footer
const LinkWrapper = ({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <LocalizedLink to={href} className={className}>
    {children}
  </LocalizedLink>
);

export default function Footer({ variant = 'compact' }: FooterProps) {
  const { t } = useTranslation();
  const onTrack = useBuildingBlocksAnalytics();
  const currentYear = String(new Date().getFullYear());
  const version = import.meta.env.VITE_APP_VERSION || '0.0.1';

  if (variant === 'compact') {
    return (
      <AppFooter
        version={version}
        copyrightYear={currentYear}
        companyName={t('app.name')}
        companyUrl="/"
        links={[
          { label: t('footer.privacy'), href: '/privacy' },
          { label: t('footer.terms'), href: '/terms' },
        ]}
        LinkComponent={LinkWrapper}
        onTrack={onTrack}
        sticky
      />
    );
  }

  // Full footer for home page
  const linkSections: FooterLinkSection[] = [
    {
      title: t('nav.daily'),
      links: [{ label: t('daily.title'), href: '/daily' }],
    },
    {
      title: t('nav.play'),
      links: [{ label: t('nav.play'), href: '/play' }],
    },
    {
      title: t('nav.techniques'),
      links: [{ label: t('techniques.title'), href: '/techniques' }],
    },
  ];

  return (
    <AppFooterForHomePage
      logo={{
        appName: t('app.name'),
      }}
      linkSections={linkSections}
      version={version}
      copyrightYear={currentYear}
      companyName={t('app.name')}
      companyUrl="/"
      description={t('app.tagline')}
      LinkComponent={LinkWrapper}
      onTrack={onTrack}
      gridColumns={3}
    />
  );
}
