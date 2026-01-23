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
      'zh-hant': ['zh-hant', 'zh', 'en'],
      default: ['en'],
    },
    initImmediate: false,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    debug: false,

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

    load: 'currentOnly', // Only load the exact language (keeps zh-hant separate from zh)
    preload: [],
    cleanCode: false,
    lowerCaseLng: true, // Normalize zh-Hant to zh-hant
    nonExplicitSupportedLngs: false, // Only use explicitly listed languages

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
