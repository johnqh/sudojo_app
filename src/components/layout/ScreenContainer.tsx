import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumbs } from '@sudobility/building_blocks';
import TopBar from './TopBar';
import Footer from './Footer';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { CONSTANTS } from '@/config/constants';

interface ScreenContainerProps {
  children: ReactNode;
}

export default function ScreenContainer({ children }: ScreenContainerProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const { items: breadcrumbItems } = useBreadcrumbs();

  // Determine if we're on the home page (language root)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isHomePage = pathParts.length <= 1; // Only language prefix

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)]">
      {/* Sticky header containing topbar and breadcrumbs */}
      <div className="sticky top-0 z-40">
        <TopBar />
        {!isHomePage && (
          <AppBreadcrumbs
            items={breadcrumbItems}
            talkToFounder={
              CONSTANTS.MEET_FOUNDER_URL
                ? {
                    meetingUrl: CONSTANTS.MEET_FOUNDER_URL,
                    buttonText: t('common.talkToFounder'),
                  }
                : undefined
            }
          />
        )}
      </div>

      {/* Main content - no max-width wrapper; each Section handles its own constraints */}
      <main className="flex-1">{children}</main>

      <Footer variant={isHomePage ? 'full' : 'compact'} />
    </div>
  );
}
