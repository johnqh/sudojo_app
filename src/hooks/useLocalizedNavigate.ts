import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { SUPPORTED_LANGUAGES, isLanguageSupported, type SupportedLanguage } from '@/i18n';

export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const { i18n } = useTranslation();

  const currentLanguage = (lang && isLanguageSupported(lang) ? lang : 'en') as SupportedLanguage;

  const localizedNavigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      // If path already starts with language prefix, use as is
      if (SUPPORTED_LANGUAGES.some(l => to.startsWith(`/${l}/`) || to === `/${l}`)) {
        navigate(to, options);
        return;
      }

      // Add language prefix
      const path = to.startsWith('/') ? to : `/${to}`;
      navigate(`/${currentLanguage}${path}`, options);
    },
    [navigate, currentLanguage]
  );

  const switchLanguage = useCallback(
    (newLang: SupportedLanguage) => {
      // Get current path without language prefix
      const pathWithoutLang = location.pathname.replace(new RegExp(`^/${lang}`), '') || '/';

      // Change i18n language
      i18n.changeLanguage(newLang);

      // Navigate to new language path
      navigate(`/${newLang}${pathWithoutLang}`, { replace: true });
    },
    [navigate, location.pathname, lang, i18n]
  );

  return {
    navigate: localizedNavigate,
    switchLanguage,
    currentLanguage,
  };
}

export function buildLocalizedUrl(path: string, lang: SupportedLanguage): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${lang}${cleanPath}`;
}
