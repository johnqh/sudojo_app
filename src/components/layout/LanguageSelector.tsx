import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type SupportedLanguage } from '@/i18n';
import { Dropdown } from '@sudobility/components';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

export function LanguageSelector() {
  const { currentLanguage, switchLanguage } = useLocalizedNavigate();

  const handleLanguageChange = (langCode: string) => {
    if (langCode !== currentLanguage) {
      switchLanguage(langCode as SupportedLanguage);
    }
  };

  const dropdownItems = SUPPORTED_LANGUAGES.map(lang => ({
    id: lang,
    label: LANGUAGE_NAMES[lang],
    onClick: () => handleLanguageChange(lang),
  }));

  return (
    <Dropdown
      items={dropdownItems}
      trigger={
        <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          <GlobeAltIcon className="w-5 h-5" />
          <span className="hidden sm:inline">{LANGUAGE_NAMES[currentLanguage]}</span>
        </button>
      }
    />
  );
}
