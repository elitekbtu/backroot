import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { PlaceholdersAndVanishInput } from '../ui/placeholders-and-vanish-input';

interface TextInputSectionProps {
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
}

export const TextInputSection: React.FC<TextInputSectionProps> = ({
  onTextChange,
  onSubmit
}) => {
  return (
    <motion.div 
      className="rounded-3xl border border-border/20 p-6 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-green-500" />
        <h2 className="text-xl font-semibold text-foreground">Text Input</h2>
      </div>
      <PlaceholdersAndVanishInput
        placeholders={[
          "Enter your message...",
          "Ask something to AI",
          "Tell me about the weather",
          "How are you?",
          "What's new?"
        ]}
        onChange={onTextChange}
        onSubmit={onSubmit}
      />
    </motion.div>
  );
};