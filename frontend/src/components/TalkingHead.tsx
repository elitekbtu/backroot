import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { TalkingHead as TalkingHeadEngine, type TalkingHeadOptions } from '../lib/talkinghead';
import type { LipSyncData, AvatarConfig } from '../types/v2v';

interface TalkingHeadProps {
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  lipSyncData?: LipSyncData | null;
  isPlaying?: boolean;
  avatarConfig?: AvatarConfig;
  mood?: string;
  options?: TalkingHeadOptions;
}

// Wrapper for the new TalkingHead engine
class TalkingHeadWrapper {
  private engine: TalkingHeadEngine;
  
  constructor(container: HTMLElement, options?: TalkingHeadOptions) {
    this.engine = new TalkingHeadEngine(container, options);
  }
  
  public setLipSyncData(lipSyncData: LipSyncData) {
    this.engine.setLipSyncData(lipSyncData);
  }
  
  public startSpeaking() {
    this.engine.startSpeaking();
  }
  
  public stopSpeaking() {
    this.engine.stopSpeaking();
  }
  
  public setMood(mood: string) {
    this.engine.setMood(mood);
  }
  
  public async loadAvatar(config: AvatarConfig, onProgress?: (progress: ProgressEvent) => void): Promise<boolean> {
    return await this.engine.loadAvatar(config, onProgress);
  }
  
  public dispose() {
    this.engine.dispose();
  }
  
  public getReady() {
    return this.engine.getReady();
  }
  
  public async speakText(text: string, lipSyncData?: LipSyncData) {
    return await this.engine.speakText(text, lipSyncData);
  }
}

const TalkingHead: React.FC<TalkingHeadProps> = ({
  className = '',
  onReady,
  onError,
  lipSyncData,
  isPlaying = false,
  avatarConfig,
  mood = 'neutral',
  options
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const talkingHeadRef = useRef<TalkingHeadWrapper | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Memoize options to prevent unnecessary re-initialization
  const memoizedOptions = useMemo((): TalkingHeadOptions => {
    return {
      cameraView: 'upper' as const,
      avatarMood: mood,
      ...options
    };
  }, [mood, options]);

  // Memoize callbacks to prevent unnecessary re-initialization
  const memoizedOnReady = useCallback(() => {
    onReady?.();
  }, [onReady]);

  const memoizedOnError = useCallback((error: Error) => {
    onError?.(error);
  }, [onError]);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Initialize TalkingHead with options
      talkingHeadRef.current = new TalkingHeadWrapper(containerRef.current, memoizedOptions);
      
      // Set up ready callback
      const checkReady = () => {
        if (talkingHeadRef.current?.getReady()) {
          setIsInitialized(true);
          memoizedOnReady();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize TalkingHead');
      setError(error.message);
      memoizedOnError(error);
    }

    return () => {
      talkingHeadRef.current?.dispose();
    };
  }, [memoizedOptions, memoizedOnReady, memoizedOnError]);

  useEffect(() => {
    if (!talkingHeadRef.current || !lipSyncData) return;

    talkingHeadRef.current.setLipSyncData(lipSyncData);
  }, [lipSyncData]);

  useEffect(() => {
    if (!talkingHeadRef.current) return;

    if (isPlaying) {
      talkingHeadRef.current.startSpeaking();
    } else {
      talkingHeadRef.current.stopSpeaking();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!talkingHeadRef.current) return;

    talkingHeadRef.current.setMood(mood);
  }, [mood]);

  // Memoize avatar config to prevent unnecessary reloads
  const memoizedAvatarConfig = useMemo(() => {
    if (!avatarConfig) return null;
    return avatarConfig;
  }, [avatarConfig]);

  useEffect(() => {
    if (!talkingHeadRef.current || !memoizedAvatarConfig) return;

    const loadAvatar = async () => {
      try {
        setError(null);
        setLoadingProgress(0);
        
        const success = await talkingHeadRef.current!.loadAvatar(
          memoizedAvatarConfig,
          (progress) => {
            if (progress.lengthComputable) {
              const percentComplete = (progress.loaded / progress.total) * 100;
              setLoadingProgress(Math.round(percentComplete));
            }
          }
        );
        
        if (!success) {
          setError('Failed to load avatar');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Avatar loading failed');
        setError(error.message);
        memoizedOnError(error);
      }
    };

    loadAvatar();
  }, [memoizedAvatarConfig, memoizedOnError]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center text-red-600">
          <div className="text-4xl mb-2">⚠️</div>
          <p>Ошибка загрузки аватара</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef} 
        className="w-full h-96 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {(!isInitialized || loadingProgress < 100) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">
              {loadingProgress > 0 ? `Загрузка аватара... ${loadingProgress}%` : 'Инициализация...'}
            </p>
            {loadingProgress > 0 && (
              <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Avatar Controls Overlay */}
      {isInitialized && (
        <div className="absolute top-4 right-4 space-y-2">
          {lipSyncData && (
            <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              🎭 Lip-sync активен
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TalkingHead;
