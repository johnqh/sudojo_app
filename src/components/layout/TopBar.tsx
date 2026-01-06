import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  Topbar,
  TopbarProvider,
  TopbarLeft,
  TopbarRight,
  TopbarLogo,
  TopbarNavigation,
  TopbarActions,
  type TopbarNavItem,
} from '@sudobility/components';
import { AuthModal, AuthAction, useAuthStatus } from '@sudobility/auth-components';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { LanguageSelector } from './LanguageSelector';
import { LocalizedLink } from './LocalizedLink';

const DEV_USER_EMAIL = 'johnqh@yahoo.com';

export default function TopBar() {
  const { t } = useTranslation();
  const { navigate, currentLanguage } = useLocalizedNavigate();
  const location = useLocation();
  const { user } = useAuthStatus();

  // Check if current user is dev user
  const isDevUser = user?.email === DEV_USER_EMAIL;

  // Check if current route is active - strip language prefix from path
  const currentPath = location.pathname.replace(`/${currentLanguage}`, '');

  const navItems: TopbarNavItem[] = useMemo(() => {
    const isActive = (path: string) => currentPath === path || currentPath.startsWith(`${path}/`);

    const items: TopbarNavItem[] = [
      {
        id: 'daily',
        label: t('nav.daily'),
        href: '/daily',
        active: isActive('/daily'),
      },
      {
        id: 'play',
        label: t('nav.play'),
        href: '/play',
        active: isActive('/play'),
      },
      {
        id: 'techniques',
        label: t('nav.techniques'),
        href: '/techniques',
        active: isActive('/techniques'),
      },
    ];

    // Add Admin menu for dev user (after Techniques, before Settings)
    if (isDevUser) {
      items.push({
        id: 'admin',
        label: t('nav.admin', 'Admin'),
        href: '/admin',
        active: isActive('/admin'),
      });
    }

    items.push({
      id: 'settings',
      label: t('nav.settings'),
      href: '/settings',
      active: isActive('/settings'),
    });

    return items;
  }, [t, isDevUser, currentPath]);

  // Custom link wrapper for localized navigation
  function LinkWrapper({
    href,
    children,
    ...props
  }: {
    href?: string;
    children: React.ReactNode;
  }) {
    if (!href) return <span {...props}>{children}</span>;
    return (
      <LocalizedLink to={href} {...props}>
        {children}
      </LocalizedLink>
    );
  }

  return (
    <>
      <TopbarProvider sticky>
        <Topbar sticky zIndex="highest">
          <TopbarLeft>
            <TopbarNavigation items={navItems} collapseBelow="lg" LinkComponent={LinkWrapper}>
              <TopbarLogo onClick={() => navigate('/')}>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {t('app.name')}
                </span>
              </TopbarLogo>
            </TopbarNavigation>
          </TopbarLeft>

          <TopbarRight>
            <TopbarActions gap="md">
              <LanguageSelector />
              <AuthAction avatarSize={32} dropdownAlign="right" />
            </TopbarActions>
          </TopbarRight>
        </Topbar>
      </TopbarProvider>

      {/* Auth Modal */}
      <AuthModal />
    </>
  );
}
