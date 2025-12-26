import { useTranslation } from 'react-i18next';
import { Heading, Text } from '@sudobility/components';
import { EnterBoard } from '@/components/sudoku';
import { useSettings } from '@/context/SettingsContext';

export default function EnterPage() {
  const { t } = useTranslation();
  const { settings } = useSettings();

  return (
    <div className="py-8">
      <header className="mb-8">
        <Heading level={1} size="2xl" className="mb-2">
          {t('enter.title')}
        </Heading>
        <Text color="muted">{t('enter.subtitle')}</Text>
      </header>

      <EnterBoard showErrors={settings.showErrors} />
    </div>
  );
}
