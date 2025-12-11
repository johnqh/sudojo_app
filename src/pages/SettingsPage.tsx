import { useTranslation } from 'react-i18next';
import { Heading, Text, Card, CardContent, Switch, Select } from '@sudobility/components';
import { useSettings, type AppSettings } from '@/context/SettingsContext';
import { useProgress } from '@/context/ProgressContext';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const { progress } = useProgress();

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

      <div className="space-y-6">
        {/* Progress Stats */}
        <section>
          <Heading level={2} size="lg" className="mb-3">
            {t('settings.progress.title')}
          </Heading>
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Text size="2xl" weight="bold" className="text-blue-600 dark:text-blue-400">
                    {progress.totalCompleted}
                  </Text>
                  <Text size="sm" color="muted">
                    {t('settings.progress.completed')}
                  </Text>
                </div>
                <div>
                  <Text size="2xl" weight="bold" className="text-green-600 dark:text-green-400">
                    {progress.dailyStreak}
                  </Text>
                  <Text size="sm" color="muted">
                    {t('settings.progress.streak')}
                  </Text>
                </div>
                <div>
                  <Text size="2xl" weight="bold" className="text-purple-600 dark:text-purple-400">
                    {progress.completedPuzzles.filter(p => p.type === 'level').length}
                  </Text>
                  <Text size="sm" color="muted">
                    {t('settings.progress.levels')}
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Game Settings */}
        <section>
          <Heading level={2} size="lg" className="mb-3">
            {t('settings.gameSettings')}
          </Heading>
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
        </section>
      </div>
    </div>
  );
}
