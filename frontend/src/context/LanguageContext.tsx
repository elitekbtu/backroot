import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type Language = 'kk' | 'ru' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  getLanguageName: (lang: Language) => string;
  getLanguageFlag: (lang: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en'); // Default to English

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') as Language;
    if (savedLanguage && ['kk', 'ru', 'en'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language to localStorage when changed
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
  };

  const getLanguageName = (lang: Language): string => {
    const names = {
      kk: 'Қазақша',
      ru: 'Русский',
      en: 'English'
    };
    return names[lang];
  };

  const getLanguageFlag = (lang: Language): string => {
    const flags = {
      kk: '🇰🇿',
      ru: '🇷🇺',
      en: '🇺🇸'
    };
    return flags[lang];
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    getLanguageName,
    getLanguageFlag
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};