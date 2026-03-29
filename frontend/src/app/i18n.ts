import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/app/locales/en.json';
import fr from '@/app/locales/fr.json';
import ar from '@/app/locales/ar.json';

export const APP_LANGUAGE_STORAGE_KEY = 'studypal_app_language';
export const OUTPUT_LANGUAGE_STORAGE_KEY = 'studypal_output_language';
export const DOCUMENT_LANGUAGE_TOGGLE_KEY = 'studypal_use_document_language';

export type AppLanguage = 'en' | 'fr' | 'ar';

const readInitialLanguage = (): AppLanguage => {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
  if (stored === 'fr' || stored === 'en' || stored === 'ar') {
    return stored;
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: readInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
