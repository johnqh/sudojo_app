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
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { LanguageSelector } from './LanguageSelector';
import { LocalizedLink } from './LocalizedLink';

export default function TopBar() {
  const { t } = useTranslation();
  const { navigate, currentLanguage } = useLocalizedNavigate();
  const location = useLocation();

  // Check if current route is active
  const currentPath = location.pathname.replace(`/${currentLanguage}`, '');
  const isActive = (path: string) => currentPath === path || currentPath.startsWith(`${path}/`);

  const navItems: TopbarNavItem[] = [
    {
      id: 'daily',
      label: t('nav.daily'),
      href: '/daily',
      active: isActive('/daily'),
    },
    {
      id: 'levels',
      label: t('nav.levels'),
      href: '/levels',
      active: isActive('/levels'),
    },
    {
      id: 'techniques',
      label: t('nav.techniques'),
      href: '/techniques',
      active: isActive('/techniques'),
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      href: '/settings',
      active: isActive('/settings'),
    },
  ];

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
            <button
              onClick={() => {
                // TODO: Implement Firebase Auth
                console.log('Login clicked');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('auth.login')}
            </button>
          </TopbarActions>
        </TopbarRight>
      </Topbar>
    </TopbarProvider>
  );
}
