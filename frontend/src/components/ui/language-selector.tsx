"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

interface LanguageSelectorProps {
  value?: string;
  onChange?: (language: string) => void;
  className?: string;
}

const languages: Language[] = [
  { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿', nativeName: 'Қазақша' },
];

export function LanguageSelector({ 
  value = 'ru', 
  onChange, 
  className 
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = React.useState(
    languages.find(lang => lang.code === value) || languages[0]
  );

  const handleSelect = (language: Language) => {
    setSelectedLanguage(language);
    onChange?.(language.code);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 bg-background/50 backdrop-blur-sm",
          "border border-border/30 rounded-lg hover:bg-background/80 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {selectedLanguage.nativeName}
          </span>
          <span className="text-lg">{selectedLanguage.flag}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <motion.div
        initial={false}
        animate={{
          opacity: isOpen ? 1 : 0,
          scale: isOpen ? 1 : 0.95,
          y: isOpen ? 0 : -10,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "absolute top-full left-0 right-0 mt-1 z-50",
          "bg-background/95 backdrop-blur-md border border-border/30 rounded-lg shadow-lg",
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {languages.map((language) => (
          <motion.button
            key={language.code}
            type="button"
            onClick={() => handleSelect(language)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-left",
              "hover:bg-muted/50 transition-colors duration-150",
              "first:rounded-t-lg last:rounded-b-lg",
              selectedLanguage.code === language.code && "bg-primary/10"
            )}
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{language.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {language.nativeName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {language.name}
                </span>
              </div>
            </div>
            {selectedLanguage.code === language.code && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="w-4 h-4 text-primary" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}