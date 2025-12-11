import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { SUPPORTED_LANGUAGES, isLanguageSupported } from './config/languages';

// Re-export for convenience
export { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, isLanguageSupported } from './config/languages';
export type { SupportedLanguage } from './config/languages';

// Detect language from URL path
const detectLanguageFromPath = (): string => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const pathLang = window.location.pathname.split('/')[1];
  return isLanguageSupported(pathLang) ? pathLang : 'en';
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: detectLanguageFromPath(),
    fallbackLng: {
      zh: ['zh', 'en'],
      default: ['en'],
    },
    initImmediate: false,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    debug: false,
    nonExplicitSupportedLngs: true,

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: `/locales/{{lng}}/{{ns}}.json`,
    },

    detection: {
      order: ['path', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
      lookupFromPathIndex: 0,
    },

    load: 'languageOnly',
    preload: [],
    cleanCode: false,
    lowerCaseLng: false,

    defaultNS: 'common',
    ns: [
      'common',
      'dailyPage',
      'levelsPage',
      'techniquesPage',
      'settingsPage',
    ],
  });

export default i18n;
