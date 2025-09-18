import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { Environment, Html } from '@react-three/drei';
import { Coin3D } from './Coin3D';
import { getCoinsForAR } from '../api/coin';
import { 
  getARCapabilities, 
  generateCoinPositions, 
  ARPerformanceMonitor,
  ARSessionManager 
} from '../lib/ar-utils';
import type { CoinResponse } from '../types/coin';

interface ARProps {
  onBack?: () => void;
}

interface ARSceneProps {
  coins: CoinResponse[];
  onCoinClick?: (coin: CoinResponse) => void;
}

// AR Scene Component
const ARScene: React.FC<ARSceneProps> = ({ coins, onCoinClick }) => {
  const [selectedCoin, setSelectedCoin] = useState<CoinResponse | null>(null);
  const [arCapabilities, setArCapabilities] = useState<{
    arSupported: boolean;
    cameraAccess: boolean;
    canRunAR: boolean;
  } | null>(null);
  const performanceMonitorRef = useRef<ARPerformanceMonitor | null>(null);
  const sessionManagerRef = useRef<ARSessionManager | null>(null);

  useEffect(() => {
    const checkCapabilities = async () => {
      const capabilities = await getARCapabilities();
      setArCapabilities(capabilities);
    };
    checkCapabilities();

    // Initialize performance monitor
    performanceMonitorRef.current = new ARPerformanceMonitor();
    sessionManagerRef.current = new ARSessionManager();
  }, []);

  const handleCoinClick = useCallback((coin: CoinResponse) => {
    setSelectedCoin(coin);
    onCoinClick?.(coin);
  }, [onCoinClick]);

  if (!arCapabilities) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-lg">Checking AR capabilities...</p>
        </div>
      </div>
    );
  }

  if (!arCapabilities.canRunAR) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🥽</div>
          <h2 className="text-2xl font-bold mb-2">AR Not Available</h2>
          <p className="text-gray-300 mb-4">
            {!arCapabilities.arSupported && !arCapabilities.cameraAccess 
              ? "Your device doesn't support WebXR AR and camera access is not available."
              : !arCapabilities.arSupported 
              ? "Your device doesn't support WebXR AR."
              : "Camera access is required for AR functionality."
            }
          </p>
          <div className="text-sm text-gray-400">
            <p>Requirements:</p>
            <p>• WebXR AR support</p>
            <p>• Camera access permission</p>
            <p>• Supported browsers: Chrome on Android, Safari on iOS 15+</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <XR store={createXRStore()}>
        <Canvas
          camera={{ position: [0, 0, 0], fov: 75 }}
          style={{ background: 'transparent' }}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
          }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* Environment */}
          <Environment preset="city" />

          {/* Coins */}
          {generateCoinPositions(coins).map(({ coin, position }) => (
            <Coin3D
              key={coin.id}
              coin={coin}
              position={position}
              onClick={() => handleCoinClick(coin)}
            />
          ))}

          {/* Selected Coin Info */}
          {selectedCoin && (
            <Html
              position={[0, 2, 0]}
              center
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '1rem',
                borderRadius: '0.5rem',
                color: 'white',
                minWidth: '200px',
                textAlign: 'center'
              }}
            >
              <h3 className="text-lg font-bold mb-2">{selectedCoin.name}</h3>
              <p className="text-sm text-gray-300 mb-2">{selectedCoin.symbol}</p>
              {selectedCoin.description && (
                <p className="text-xs text-gray-400">{selectedCoin.description}</p>
              )}
              <button
                onClick={() => setSelectedCoin(null)}
                className="mt-2 px-3 py-1 bg-yellow-500 text-black rounded text-xs hover:bg-yellow-400"
              >
                Close
              </button>
            </Html>
          )}

          {/* Instructions */}
          <Html
            position={[0, -1.5, 0]}
            center
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              color: 'white',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}
          >
            Look around to see coins • Tap coins for info • Move to explore
          </Html>
        </Canvas>
      </XR>
    </>
  );
};

// Main AR Component
const AR: React.FC<ARProps> = ({ onBack }) => {
  const [coins, setCoins] = useState<CoinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arSession, setArSession] = useState(false);

  // Load coins for AR
  const loadCoins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCoinsForAR();
      if (response.success && response.data) {
        setCoins(response.data);
      } else {
        setError(response.error?.detail || 'Failed to load coins');
      }
    } catch (err) {
      setError('Failed to load coins');
      console.error('Error loading coins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoins();
  }, [loadCoins]);

  const handleCoinClick = useCallback((coin: CoinResponse) => {
    console.log('Coin clicked:', coin);
    // You can add additional logic here, like opening a modal or navigating
  }, []);

  const startARSession = useCallback(() => {
    setArSession(true);
  }, []);

  const stopARSession = useCallback(() => {
    setArSession(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading AR Experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading AR</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={loadCoins}
            className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (coins.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🪙</div>
          <h2 className="text-2xl font-bold mb-2">No Coins Available</h2>
          <p className="text-gray-300 mb-4">No active coins found for AR display</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-400 transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!arSession) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-yellow-400 to-orange-500">
        <div className="text-center text-white">
          <div className="text-8xl mb-6">🥽</div>
          <h1 className="text-4xl font-bold mb-4">AR Coin Experience</h1>
          <p className="text-xl mb-6">Discover {coins.length} coins in augmented reality</p>
          
          <div className="space-y-4">
            <button
              onClick={startARSession}
              className="px-8 py-4 bg-white text-black rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start AR Experience
            </button>
            
            {onBack && (
              <button
                onClick={onBack}
                className="block mx-auto px-6 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
              >
                ← Back to Management
              </button>
            )}
          </div>

          <div className="mt-8 text-sm opacity-75">
            <p>Make sure you have good lighting and a clear view</p>
            <p>Move your device slowly for best tracking</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black">
      {/* AR Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={stopARSession}
          className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
        >
          ← Exit AR
        </button>
        <button
          onClick={loadCoins}
          className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Coin Counter */}
      <div className="absolute top-4 right-4 z-10">
        <div className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg">
          <span className="text-sm">Coins: {coins.filter(coin => coin.is_active).length}</span>
        </div>
      </div>

      {/* AR Scene */}
      <ARScene coins={coins} onCoinClick={handleCoinClick} />
    </div>
  );
};

export default AR;