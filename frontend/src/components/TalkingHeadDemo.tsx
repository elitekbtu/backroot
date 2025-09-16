import React, { useState } from 'react';
import TalkingHead from './TalkingHead';
import type { AvatarConfig, LipSyncData } from '../types/v2v';

const TalkingHeadDemo: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mood, setMood] = useState<string>('neutral');
  const [lipSyncData, setLipSyncData] = useState<LipSyncData | null>(null);

  // Example Ready Player Me avatar (replace with your own)
  const avatarConfig: AvatarConfig = {
    url: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png',
    body: 'F',
    lipsyncLang: 'en',
    ttsLang: 'en-US',
    ttsVoice: 'en-US-Standard-A',
    avatarMood: mood,
    avatarMute: false,
    avatarIdleEyeContact: 0.3,
    avatarIdleHeadMove: 0.5,
    avatarSpeakingEyeContact: 0.7,
    avatarSpeakingHeadMove: 0.3
  };

  const handleReady = () => {
    setIsReady(true);
    console.log('TalkingHead is ready!');
  };

  const handleError = (error: Error) => {
    setError(error.message);
    console.error('TalkingHead error:', error);
  };

  const simulateSpeech = () => {
    // Example lip sync data - in a real app, this would come from your TTS service
    const exampleLipSyncData: LipSyncData = {
      visemes: ['sil', 'PP', 'aa', 'DD', 'sil', 'E', 'nn', 'sil'],
      times: [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4],
      durations: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3],
      timing: [
        { viseme: 'sil', start_time: 0, duration: 0.2 },
        { viseme: 'PP', start_time: 0.2, duration: 0.2 },
        { viseme: 'aa', start_time: 0.4, duration: 0.2 },
        { viseme: 'DD', start_time: 0.6, duration: 0.2 },
        { viseme: 'sil', start_time: 0.8, duration: 0.2 },
        { viseme: 'E', start_time: 1.0, duration: 0.2 },
        { viseme: 'nn', start_time: 1.2, duration: 0.2 },
        { viseme: 'sil', start_time: 1.4, duration: 0.3 }
      ]
    };

    setLipSyncData(exampleLipSyncData);
    setIsPlaying(true);

    // Stop speaking after 2 seconds
    setTimeout(() => {
      setIsPlaying(false);
      setLipSyncData(null);
    }, 2000);
  };

  const moods = ['neutral', 'happy', 'sad', 'angry'];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">TalkingHead Demo</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Display */}
        <div className="lg:col-span-2">
          <TalkingHead
            className="w-full"
            onReady={handleReady}
            onError={handleError}
            lipSyncData={lipSyncData}
            isPlaying={isPlaying}
            avatarConfig={avatarConfig}
            mood={mood}
            options={{
              cameraView: 'upper',
              lightAmbientIntensity: 2,
              lightDirectIntensity: 30,
              avatarIdleEyeContact: 0.3,
              avatarIdleHeadMove: 0.5,
              avatarSpeakingEyeContact: 0.7,
              avatarSpeakingHeadMove: 0.3
            }}
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Status</h3>
            <div className="space-y-2">
              <div className={`px-3 py-1 rounded-full text-sm ${
                isReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isReady ? '✅ Ready' : '⏳ Loading...'}
              </div>
              {error && (
                <div className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                  ❌ {error}
                </div>
              )}
              <div className={`px-3 py-1 rounded-full text-sm ${
                isPlaying ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isPlaying ? '🗣️ Speaking' : '😐 Silent'}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Controls</h3>
            <div className="space-y-3">
              <button
                onClick={simulateSpeech}
                disabled={!isReady || isPlaying}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isPlaying ? 'Speaking...' : 'Simulate Speech'}
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mood
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {moods.map((m) => (
                    <option key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Features</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✅ Ready Player Me Support</li>
              <li>✅ Proper Lip Sync with Visemes</li>
              <li>✅ ARKit Morph Targets</li>
              <li>✅ Mood-based Expressions</li>
              <li>✅ Idle Animations</li>
              <li>✅ Eye Contact Simulation</li>
              <li>✅ Progressive Loading</li>
              <li>✅ Error Handling</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Usage Example</h3>
        <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto text-sm">
{`import TalkingHead from './TalkingHead';
import type { AvatarConfig, LipSyncData } from '../types/v2v';

const avatarConfig: AvatarConfig = {
  url: 'https://models.readyplayer.me/your-avatar-id.glb?morphTargets=ARKit,Oculus+Visemes',
  body: 'F',
  lipsyncLang: 'en',
  avatarMood: 'neutral'
};

<TalkingHead
  avatarConfig={avatarConfig}
  lipSyncData={lipSyncData}
  isPlaying={isPlaying}
  mood="happy"
  onReady={() => console.log('Ready!')}
  onError={(error) => console.error(error)}
/>`}
        </pre>
      </div>
    </div>
  );
};

export default TalkingHeadDemo;
