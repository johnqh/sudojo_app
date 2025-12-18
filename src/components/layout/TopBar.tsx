import { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { LanguageSelector } from './LanguageSelector';
import { LocalizedLink } from './LocalizedLink';
import { AuthModal } from '@/components/auth';

// Get initials from display name or email
function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '?';
}

export default function TopBar() {
  const { t } = useTranslation();
  const { navigate, currentLanguage } = useLocalizedNavigate();
  const location = useLocation();
  const { user, loading, signOut, openAuthModal } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Reset image error state when user or photo URL changes
  useEffect(() => {
    setImageError(false);
  }, [user?.photoURL]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

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

            {/* User Avatar or Login Button */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  {user.photoURL && !imageError ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                      {getInitials(user.displayName, user.email)}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.displayName || user.email}
                      </p>
                      {user.displayName && user.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      )}
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t('auth.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '...' : t('auth.login')}
              </button>
            )}
          </TopbarActions>
        </TopbarRight>
      </Topbar>
    </TopbarProvider>

      {/* Auth Modal */}
      <AuthModal />
    </>
  );
}
