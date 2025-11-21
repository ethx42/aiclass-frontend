"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '../../../messages/en.json';
import es from '../../../messages/es.json';

type Messages = typeof en;
type Locale = 'en' | 'es';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  messages: Messages;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messages: Record<Locale, Messages> = {
  en,
  es,
};

// Detect browser language
function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en'; // Server-side fallback
  }

  // Try to get the preferred language from the browser
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // Check if browser language starts with 'es' (es, es-ES, es-MX, etc.)
  if (browserLang && browserLang.toLowerCase().startsWith('es')) {
    return 'es';
  }
  
  // Default to English
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Initialize with browser language detection
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
        return savedLocale;
      }
      // If no saved locale, detect from browser
      return detectBrowserLocale();
    }
    return 'en'; // Server-side fallback
  });

  // Load locale from localStorage on mount (if not already set)
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
      setLocaleState(savedLocale);
    } else {
      // If no saved locale, detect from browser and save it
      const detectedLocale = detectBrowserLocale();
      setLocaleState(detectedLocale);
      localStorage.setItem('locale', detectedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = messages[locale];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, messages: messages[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslations must be used within I18nProvider');
  }
  return context;
}

// Hook for easier usage
export function useT() {
  const { t } = useTranslations();
  return t;
}

