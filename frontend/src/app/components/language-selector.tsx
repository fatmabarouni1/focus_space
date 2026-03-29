import { Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from '@/app/context/app-settings-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

export function LanguageSelector() {
  const { t } = useTranslation();
  const { appLanguage, setAppLanguage } = useAppSettings();

  return (
    <div className="flex items-center gap-2">
      <Globe2 className="h-4 w-4 text-muted-foreground" />
      <Select value={appLanguage} onValueChange={(value) => setAppLanguage(value as 'en' | 'fr' | 'ar')}>
        <SelectTrigger className="h-9 w-[150px] rounded-xl">
          <SelectValue placeholder={t('common.language')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t('languages.en')}</SelectItem>
          <SelectItem value="fr">{t('languages.fr')}</SelectItem>
          <SelectItem value="ar">{t('languages.ar')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
