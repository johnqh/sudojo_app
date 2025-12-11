import { useTranslation } from 'react-i18next';
import {
  Footer as FooterContainer,
  FooterCompact,
  FooterCompactLeft,
  FooterCompactRight,
  FooterCopyright,
  FooterVersion,
  FooterGrid,
  FooterBrand,
  FooterLinkSection,
  FooterLink,
  FooterBottom,
} from '@sudobility/components';
import { LocalizedLink } from './LocalizedLink';

interface FooterProps {
  variant?: 'full' | 'compact';
}

export default function Footer({ variant = 'compact' }: FooterProps) {
  const { t } = useTranslation();
  const currentYear = String(new Date().getFullYear());

  if (variant === 'compact') {
    return (
      <FooterContainer variant="compact" sticky>
        <FooterCompact>
          <FooterCompactLeft>
            <FooterVersion version={import.meta.env.VITE_APP_VERSION || '0.0.1'} />
            <FooterCopyright year={currentYear} companyName={t('app.name')} />
          </FooterCompactLeft>
          <FooterCompactRight>
            <LocalizedLink
              to="/privacy"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {t('footer.privacy')}
            </LocalizedLink>
            <LocalizedLink
              to="/terms"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {t('footer.terms')}
            </LocalizedLink>
          </FooterCompactRight>
        </FooterCompact>
      </FooterContainer>
    );
  }

  // Full footer for home page
  return (
    <FooterContainer variant="full">
      <FooterGrid>
        <FooterBrand description={t('app.tagline')}>
          <LocalizedLink to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {t('app.name')}
          </LocalizedLink>
        </FooterBrand>

        <FooterLinkSection title={t('nav.daily')}>
          <FooterLink>
            <LocalizedLink to="/daily">{t('daily.title')}</LocalizedLink>
          </FooterLink>
        </FooterLinkSection>

        <FooterLinkSection title={t('nav.levels')}>
          <FooterLink>
            <LocalizedLink to="/levels">{t('levels.title')}</LocalizedLink>
          </FooterLink>
        </FooterLinkSection>

        <FooterLinkSection title={t('nav.techniques')}>
          <FooterLink>
            <LocalizedLink to="/techniques">{t('techniques.title')}</LocalizedLink>
          </FooterLink>
        </FooterLinkSection>
      </FooterGrid>

      <FooterBottom>
        <FooterVersion version={import.meta.env.VITE_APP_VERSION || '0.0.1'} />
        <FooterCopyright year={currentYear} companyName={t('app.name')} />
      </FooterBottom>
    </FooterContainer>
  );
}
