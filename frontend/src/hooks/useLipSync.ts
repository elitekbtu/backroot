import { useState, useCallback } from 'react';
import type { LipSyncData, VisemeData } from '../types/v2v';

export const useLipSync = () => {
  const [currentLipSyncData, setCurrentLipSyncData] = useState<LipSyncData | null>(null);

  // Convert text to phonemes (simplified) - supports both English and Kazakh
  const textToPhonemes = useCallback((word: string): string[] => {
    const phonemes: string[] = [];
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i].toLowerCase();
      const nextChar = word[i + 1]?.toLowerCase();
      
      // English vowels
      if ('aeiou'.includes(char)) {
        if (char === 'a') phonemes.push('aa');
        else if (char === 'e') phonemes.push('E');
        else if (char === 'i') phonemes.push('I');
        else if (char === 'o') phonemes.push('O');
        else if (char === 'u') phonemes.push('U');
      }
      // Kazakh vowels (Cyrillic)
      else if ('аәеиоөұүыі'.includes(char)) {
        if (char === 'а' || char === 'ә') phonemes.push('aa');
        else if (char === 'е') phonemes.push('E');
        else if (char === 'и' || char === 'ы' || char === 'і') phonemes.push('I');
        else if (char === 'о' || char === 'ө') phonemes.push('O');
        else if (char === 'ұ' || char === 'ү') phonemes.push('U');
      }
      // English consonants
      else if (char === 'p' || char === 'b' || char === 'm') {
        phonemes.push('PP');
      } else if (char === 'f' || char === 'v') {
        phonemes.push('FF');
      } else if (char === 't' || char === 'd') {
        phonemes.push('DD');
      } else if (char === 'k' || char === 'g') {
        phonemes.push('kk');
      } else if (char === 's' || char === 'z') {
        phonemes.push('SS');
      } else if (char === 'n' || char === 'ng') {
        phonemes.push('nn');
      } else if (char === 'r') {
        phonemes.push('RR');
      } else if (char === 'l') {
        phonemes.push('nn'); // Similar to 'n'
      } else if (char === 'w') {
        phonemes.push('U'); // Similar to 'u'
      } else if (char === 'y') {
        phonemes.push('I'); // Similar to 'i'
      } else if (char === 'h') {
        phonemes.push('aa'); // Open mouth for 'h'
      } else if (char === 'c' || char === 'q') {
        if (nextChar === 'h') {
          phonemes.push('CH');
          i++; // Skip next character
        } else {
          phonemes.push('kk');
        }
      } else if (char === 's' && nextChar === 'h') {
        phonemes.push('CH');
        i++; // Skip next character
      } else if (char === 't' && nextChar === 'h') {
        phonemes.push('TH');
        i++; // Skip next character
      }
      // Kazakh consonants (Cyrillic)
      else if (char === 'п' || char === 'б' || char === 'м') {
        phonemes.push('PP');
      } else if (char === 'ф' || char === 'в') {
        phonemes.push('FF');
      } else if (char === 'т' || char === 'д') {
        phonemes.push('DD');
      } else if (char === 'к' || char === 'г' || char === 'қ' || char === 'ғ') {
        phonemes.push('kk');
      } else if (char === 'с' || char === 'з' || char === 'ц') {
        phonemes.push('SS');
      } else if (char === 'н' || char === 'ң') {
        phonemes.push('nn');
      } else if (char === 'р') {
        phonemes.push('RR');
      } else if (char === 'л') {
        phonemes.push('nn'); // Similar to 'n'
      } else if (char === 'ш' || char === 'щ' || char === 'ч' || char === 'ж') {
        phonemes.push('CH');
      } else if (char === 'х' || char === 'һ') {
        phonemes.push('aa'); // Open mouth for 'h'
      } else if (char === 'й') {
        phonemes.push('I'); // Similar to 'i'
      } else {
        // Default to silence for unknown characters
        phonemes.push('sil');
      }
    }
    
    return phonemes;
  }, []);

  // Convert phoneme to viseme
  const phonemeToViseme = useCallback((phoneme: string): string => {
    const visemeMap: { [key: string]: string } = {
      'aa': 'aa', 'E': 'E', 'I': 'I', 'O': 'O', 'U': 'U',
      'PP': 'PP', 'FF': 'FF', 'DD': 'DD', 'kk': 'kk',
      'SS': 'SS', 'nn': 'nn', 'RR': 'RR', 'CH': 'CH', 'TH': 'TH',
      'sil': 'sil'
    };
    
    return visemeMap[phoneme] || 'sil';
  }, []);

  // Enhanced lip sync data generation with audio analysis
  const generateEnhancedLipSyncData = useCallback((text: string, audioDuration?: number): LipSyncData => {
    const words = text.toLowerCase().split(/\s+/);
    const visemes: string[] = [];
    const times: number[] = [];
    const durations: number[] = [];
    const timing: VisemeData[] = [];
    
    let currentTime = 0;
    const totalTextDuration = audioDuration || (text.length * 0.08); // Estimate if no audio duration
    
    words.forEach((word, wordIndex) => {
      const phonemes = textToPhonemes(word);
      const wordDuration = (word.length / text.length) * totalTextDuration;
      const phonemeDuration = wordDuration / phonemes.length;
      
      phonemes.forEach((phoneme) => {
        const viseme = phonemeToViseme(phoneme);
        const duration = Math.max(0.05, phonemeDuration * 0.8); // Ensure minimum duration
        
        visemes.push(viseme);
        times.push(currentTime);
        durations.push(duration);
        timing.push({
          viseme: viseme,
          start_time: currentTime,
          duration: duration
        });
        
        currentTime += duration;
      });
      
      // Add pause between words
      if (wordIndex < words.length - 1) {
        const pauseDuration = 0.08;
        visemes.push('sil');
        times.push(currentTime);
        durations.push(pauseDuration);
        timing.push({
          viseme: 'sil',
          start_time: currentTime,
          duration: pauseDuration
        });
        currentTime += pauseDuration;
      }
    });
    
    return {
      visemes,
      times,
      durations,
      timing
    };
  }, [textToPhonemes, phonemeToViseme]);

  // Play audio with lip sync synchronization
  const playAudioWithLipSync = useCallback((audioData: string, lipSyncData: LipSyncData, onStart?: () => void, onEnd?: () => void, onError?: (error: string) => void) => {
    try {
      // Create audio element
      const audio = new Audio(`data:audio/wav;base64,${audioData}`);
      
      // Set up audio event listeners
      audio.addEventListener('loadeddata', () => {
        console.log('Audio loaded, starting lip sync');
        setCurrentLipSyncData(lipSyncData);
        onStart?.();
      });
      
      audio.addEventListener('ended', () => {
        console.log('Audio ended, stopping lip sync');
        setCurrentLipSyncData(null);
        onEnd?.();
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        onError?.('Ошибка воспроизведения аудио');
      });
      
      // Start playing
      audio.play().catch((error) => {
        console.error('Failed to play audio:', error);
        onError?.('Не удалось воспроизвести аудио');
      });
      
    } catch (error) {
      console.error('Error setting up audio playback:', error);
      onError?.('Ошибка настройки воспроизведения аудио');
    }
  }, []);

  return {
    currentLipSyncData,
    setCurrentLipSyncData,
    generateEnhancedLipSyncData,
    playAudioWithLipSync
  };
};