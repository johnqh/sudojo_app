import { useLocalizedNavigate as useSharedLocalizedNavigate } from '@sudobility/components';
import { isLanguageSupported, type SupportedLanguage } from '@/i18n';

export function useLocalizedNavigate() {
  const result = useSharedLocalizedNavigate({
    isLanguageSupported,
    defaultLanguage: 'en',
    storageKey: 'language',
  });

  return {
    navigate: result.navigate,
    switchLanguage: result.switchLanguage as (
      newLanguage: SupportedLanguage,
      currentPath?: string,
    ) => void,
    currentLanguage: result.currentLanguage as SupportedLanguage,
  };
}

export function buildLocalizedUrl(path: string, lang: SupportedLanguage): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${lang}${cleanPath}`;
}
