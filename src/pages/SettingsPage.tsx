import { useTranslation } from 'react-i18next';
import { useState, useCallback } from 'react';
import { Heading, Text, Card, CardContent, Switch, Select } from '@sudobility/components';
import { getStorageService } from '@sudobility/di';

interface AppSettings {
  showErrors: boolean;
  symmetrical: boolean;
  display: 'numeric' | 'kanji' | 'emojis';
}

const DEFAULT_SETTINGS: AppSettings = {
  showErrors: true,
  symmetrical: true,
  display: 'numeric',
};

const SETTINGS_KEY = 'sudojo-settings';

function getInitialSettings(): AppSettings {
  try {
    const storage = getStorageService();
    const saved = storage.getItem(SETTINGS_KEY);
    if (saved && typeof saved === 'string') {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // Storage not available
  }
  return DEFAULT_SETTINGS;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);

  // Save settings to storage
  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      try {
        const storage = getStorageService();
        storage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      } catch {
        // Storage not available
      }
      return newSettings;
    });
  }, []);

  const displayOptions = [
    { value: 'numeric', label: t('settings.displayOptions.numeric') },
    { value: 'kanji', label: t('settings.displayOptions.kanji') },
    { value: 'emojis', label: t('settings.displayOptions.emojis') },
  ];

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <header className="mb-8">
        <Heading level={1} size="2xl">
          {t('settings.title')}
        </Heading>
      </header>

      <div className="space-y-4">
        {/* Show Errors */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <Text weight="medium">{t('settings.showErrors')}</Text>
              <Text size="sm" color="muted">
                {t('settings.showErrorsDesc')}
              </Text>
            </div>
            <Switch
              checked={settings.showErrors}
              onCheckedChange={checked => updateSetting('showErrors', checked)}
            />
          </CardContent>
        </Card>

        {/* Symmetrical Puzzles */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <Text weight="medium">{t('settings.symmetrical')}</Text>
              <Text size="sm" color="muted">
                {t('settings.symmetricalDesc')}
              </Text>
            </div>
            <Switch
              checked={settings.symmetrical}
              onCheckedChange={checked => updateSetting('symmetrical', checked)}
            />
          </CardContent>
        </Card>

        {/* Display Format */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <Text weight="medium">{t('settings.display')}</Text>
                <Text size="sm" color="muted">
                  {t('settings.displayDesc')}
                </Text>
              </div>
              <Select
                value={settings.display}
                onValueChange={value => updateSetting('display', value as AppSettings['display'])}
              >
                {displayOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
