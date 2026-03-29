import { Languages, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseCard } from '@/app/components/base-card';
import { PageHeader } from '@/app/components/page-header';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { useAppSettings } from '@/app/context/app-settings-context';

export function SettingsScreen() {
  const { t } = useTranslation();
  const {
    appLanguage,
    outputLanguage,
    useDocumentLanguage,
    setAppLanguage,
    setOutputLanguage,
    setUseDocumentLanguage,
  } = useAppSettings();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <div className="grid gap-6">
        <BaseCard className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Languages className="h-5 w-5 text-[var(--focus-primary)]" />
            <div>
              <h3 className="text-lg font-semibold">{t('settings.appLanguageTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.appLanguageDescription')}</p>
            </div>
          </div>
          <Select value={appLanguage} onValueChange={(value) => setAppLanguage(value as 'en' | 'fr' | 'ar')}>
            <SelectTrigger className="max-w-sm rounded-2xl">
              <SelectValue placeholder={t('common.appLanguage')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('languages.en')}</SelectItem>
              <SelectItem value="fr">{t('languages.fr')}</SelectItem>
              <SelectItem value="ar">{t('languages.ar')}</SelectItem>
            </SelectContent>
          </Select>
        </BaseCard>

        <BaseCard className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-[var(--break-primary)]" />
            <div>
              <h3 className="text-lg font-semibold">{t('settings.outputLanguageTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.outputLanguageDescription')}</p>
            </div>
          </div>
          <Select value={outputLanguage} onValueChange={(value) => setOutputLanguage(value as 'en' | 'fr' | 'ar')}>
            <SelectTrigger className="max-w-sm rounded-2xl">
              <SelectValue placeholder={t('common.outputLanguage')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('languages.en')}</SelectItem>
              <SelectItem value="fr">{t('languages.fr')}</SelectItem>
              <SelectItem value="ar">{t('languages.ar')}</SelectItem>
            </SelectContent>
          </Select>
        </BaseCard>

        <BaseCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-base font-semibold">{t('settings.useDocumentLanguageTitle')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.useDocumentLanguageDescription')}</p>
            </div>
            <Switch checked={useDocumentLanguage} onCheckedChange={setUseDocumentLanguage} />
          </div>
        </BaseCard>
      </div>
    </div>
  );
}
