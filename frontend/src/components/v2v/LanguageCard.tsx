import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { LanguageSelector } from '../ui/language-selector';

interface LanguageCardProps {
  language: string;
  onLanguageChange: (language: string) => void;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
  language,
  onLanguageChange
}) => {
  return (
    <motion.div 
      className="group relative rounded-2xl border border-border/20 p-4 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300"
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-center space-x-3">
        <motion.div
          className="p-2 rounded-full bg-muted/50"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <Globe className="w-5 h-5 text-blue-500" />
        </motion.div>
        <div className="flex-1">
          <div className="font-medium text-sm text-foreground mb-2">
            Response Language
          </div>
          <LanguageSelector 
            value={language}
            onChange={onLanguageChange}
          />
        </div>
      </div>
    </motion.div>
  );
};