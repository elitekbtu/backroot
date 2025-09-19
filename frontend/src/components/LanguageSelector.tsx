import React, { useState } from 'react';
import { useLanguage, type Language } from '../context/LanguageContext';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, getLanguageName, getLanguageFlag } = useLanguage();
  const deviceInfo = useDeviceDetection();
  const [isOpen, setIsOpen] = useState(false);

  const languages: Language[] = ['kk', 'ru', 'en'];

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Language Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 
          bg-white hover:bg-gray-50 transition-colors duration-200
          ${deviceInfo.isMobile ? 'text-sm' : 'text-base'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
        aria-label="Select language"
      >
        <span className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'}`}>
          {getLanguageFlag(language)}
        </span>
        <span className={`font-medium ${deviceInfo.isMobile ? 'text-xs' : 'text-sm'}`}>
          {getLanguageName(language)}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 
                transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg
                ${language === lang ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                ${deviceInfo.isMobile ? 'text-sm' : 'text-base'}
              `}
            >
              <span className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'}`}>
                {getLanguageFlag(lang)}
              </span>
              <span className="font-medium">
                {getLanguageName(lang)}
              </span>
              {language === lang && (
                <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;