import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BreadcrumbSection } from '@sudobility/components';
import TopBar from './TopBar';
import Footer from './Footer';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

interface ScreenContainerProps {
  children: ReactNode;
}

export default function ScreenContainer({ children }: ScreenContainerProps) {
  const location = useLocation();
  const { items: breadcrumbItems } = useBreadcrumbs();

  // Determine if we're on the home page (language root)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isHomePage = pathParts.length <= 1; // Only language prefix

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)]">
      <TopBar />
      {!isHomePage && <BreadcrumbSection items={breadcrumbItems} />}

      <main className="flex-1">
        <div className="container-app">{children}</div>
      </main>

      <Footer variant={isHomePage ? 'full' : 'compact'} />
    </div>
  );
}
