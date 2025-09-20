import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import TalkingHead from '../TalkingHead';
import type { AvatarConfig, LipSyncData } from '../../types/v2v';
import type { VoiceProcessingState } from '../../api/v2v';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';

interface AvatarSectionProps {
  processingState: VoiceProcessingState;
  currentLipSyncData: LipSyncData | null;
  avatarConfig: AvatarConfig;
  avatarMood: string;
  memoizedAvatarOptions: any;
}

export const AvatarSection: React.FC<AvatarSectionProps> = ({
  processingState,
  currentLipSyncData,
  avatarConfig,
  avatarMood,
  memoizedAvatarOptions
}) => {
  const deviceInfo = useDeviceDetection();

  return (
    <motion.div 
      className="relative"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="group relative rounded-3xl border border-border/20 p-6 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            AI Avatar
          </h2>
          <motion.div
            className="w-3 h-3 rounded-full bg-green-500"
            animate={{ 
              scale: processingState === 'playing' ? [1, 1.2, 1] : 1,
              opacity: processingState === 'playing' ? [1, 0.5, 1] : 1
            }}
            transition={{ duration: 1, repeat: processingState === 'playing' ? Infinity : 0 }}
          />
        </div>
        
        <div className="relative flex justify-center items-center">
          <motion.div 
            className={`relative ${
              deviceInfo.isKiosk ? 'w-80 h-80' : 
              deviceInfo.isMobile ? 'w-64 h-64' : 'w-72 h-72'
            }`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <TalkingHead
                className="w-full h-full object-contain"
                lipSyncData={currentLipSyncData}
                isPlaying={processingState === 'playing'}
                avatarConfig={avatarConfig}
                mood={avatarMood}
                options={memoizedAvatarOptions}
              />
            </div>
            
            {/* Floating particles effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};