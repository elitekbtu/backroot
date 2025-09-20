import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Eye, Pause, RefreshCw } from 'lucide-react';
import { AIVoiceInput } from '../ui/ai-voice-input';
import type { VoiceProcessingState } from '../../api/v2v';
import type { LocationPermissionState, LocationUIState } from '../../types/location';

interface VoiceControlsProps {
  isRecording: boolean;
  processingState: VoiceProcessingState;
  locationPermission: LocationPermissionState;
  locationUI: LocationUIState;
  onStartRecording: () => void;
  onStopRecording: (duration?: number) => void;
  onStartLocationWatching: () => void;
  onStopLocationWatching: () => void;
  onRequestLocationPermission: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isRecording,
  processingState,
  locationPermission,
  locationUI,
  onStartRecording,
  onStopRecording,
  onStartLocationWatching,
  onStopLocationWatching,
  onRequestLocationPermission
}) => {
  return (
    <motion.div 
      className="rounded-3xl border border-border/20 p-6 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300 mb-6"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.7 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Mic className="w-5 h-5 text-purple-500" />
          Voice Control
        </h2>
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: isRecording ? 1 : 0.5 }}
        >
          <div className={`w-2 h-2 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : 
            processingState === 'processing' ? 'bg-yellow-500 animate-pulse' :
            processingState === 'playing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
          }`} />
          <span className="text-sm text-muted-foreground">
            {isRecording ? 'Recording...' : 
             processingState === 'processing' ? 'Processing...' :
             processingState === 'playing' ? 'Playing...' : 'Ready'}
          </span>
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* AI Voice Input Component */}
        <motion.div 
          className="w-full max-w-md"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <AIVoiceInput
            onStart={onStartRecording}
            onStop={onStopRecording}
            visualizerBars={48}
            className="w-full"
          />
        </motion.div>
        
        {/* Control Buttons */}
        {locationPermission.status === 'granted' && (
          <div className="flex flex-wrap gap-3 justify-center">
            <motion.button
              onClick={locationUI.isWatching ? onStopLocationWatching : onStartLocationWatching}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                locationUI.isWatching 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {locationUI.isWatching ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>
                {locationUI.isWatching ? 'Stop Tracking' : 'Start Tracking'}
              </span>
            </motion.button>
            
            <motion.button
              onClick={onRequestLocationPermission}
              disabled={locationUI.isRequesting}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-4 h-4 ${locationUI.isRequesting ? 'animate-spin' : ''}`} />
              <span>
                {locationUI.isRequesting ? 'Updating...' : 'Update Location'}
              </span>
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};