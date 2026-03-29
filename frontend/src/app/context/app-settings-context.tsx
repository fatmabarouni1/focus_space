import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import i18n, {
  APP_LANGUAGE_STORAGE_KEY,
  DOCUMENT_LANGUAGE_TOGGLE_KEY,
  OUTPUT_LANGUAGE_STORAGE_KEY,
  type AppLanguage,
} from '@/app/i18n';

type AppSettingsContextValue = {
  appLanguage: AppLanguage;
  outputLanguage: AppLanguage;
  useDocumentLanguage: boolean;
  isRtl: boolean;
  setAppLanguage: (language: AppLanguage) => void;
  setOutputLanguage: (language: AppLanguage) => void;
  setUseDocumentLanguage: (value: boolean) => void;
};

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

const readStoredOutputLanguage = (): AppLanguage => {
  const raw = window.localStorage.getItem(OUTPUT_LANGUAGE_STORAGE_KEY);
  return raw === 'fr' || raw === 'ar' || raw === 'en' ? raw : 'en';
};

const readStoredDocumentPreference = () =>
  window.localStorage.getItem(DOCUMENT_LANGUAGE_TOGGLE_KEY) === 'true';

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(
    (i18n.language as AppLanguage) || 'en'
  );
  const [outputLanguage, setOutputLanguage] = useState<AppLanguage>(() =>
    readStoredOutputLanguage()
  );
  const [useDocumentLanguage, setUseDocumentLanguage] = useState<boolean>(() =>
    readStoredDocumentPreference()
  );

  useEffect(() => {
    void i18n.changeLanguage(appLanguage);
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, appLanguage);
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = appLanguage === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', appLanguage === 'ar');
  }, [appLanguage]);

  useEffect(() => {
    window.localStorage.setItem(OUTPUT_LANGUAGE_STORAGE_KEY, outputLanguage);
  }, [outputLanguage]);

  useEffect(() => {
    window.localStorage.setItem(
      DOCUMENT_LANGUAGE_TOGGLE_KEY,
      String(useDocumentLanguage)
    );
  }, [useDocumentLanguage]);

  const value = useMemo(
    () => ({
      appLanguage,
      outputLanguage,
      useDocumentLanguage,
      isRtl: appLanguage === 'ar',
      setAppLanguage,
      setOutputLanguage,
      setUseDocumentLanguage,
    }),
    [appLanguage, outputLanguage, useDocumentLanguage]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used inside AppSettingsProvider.');
  }
  return context;
}
