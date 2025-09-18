import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { Environment, Html, OrbitControls } from '@react-three/drei';
import { Coin3D } from './Coin3D';
import { getCoinsForAR } from '../api/coin';
import { 
  getARCapabilities, 
  generateCoinPositions, 
  ARPerformanceMonitor,
  ARSessionManager 
} from '../lib/ar-utils';
import type { CoinResponse } from '../types/coin';

interface ImprovedARProps {
  onBack?: () => void;
}

interface ARSceneProps {
  coins: CoinResponse[];
  onCoinClick?: (coin: CoinResponse) => void;
  mode: 'ar' | 'desktop' | 'mobile';
}

// Desktop/Mobile 3D Scene (без AR)
const Desktop3DScene: React.FC<ARSceneProps> = ({ coins, onCoinClick }) => {
  const [selectedCoin, setSelectedCoin] = useState<CoinResponse | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  const handleCoinClick = useCallback((coin: CoinResponse) => {
    setSelectedCoin(coin);
    onCoinClick?.(coin);
  }, [onCoinClick]);

  // Handle WebGL errors
  useEffect(() => {
    const handleWebGLError = (event: any) => {
      console.error('WebGL Error:', event);
      setWebglError('WebGL context lost. Please refresh the page.');
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleWebGLError);
      canvas.addEventListener('webglcontextrestored', () => {
        setWebglError(null);
        console.log('WebGL context restored');
      });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleWebGLError);
        canvas.removeEventListener('webglcontextrestored', () => {});
      }
    };
  }, []);

  if (webglError) {
    return (
      <div className="flex items-center justify-center h-full bg-red-100 text-red-800">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">WebGL Error</h2>
          <p className="mb-4">{webglError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB, #98FB98)' }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x87CEEB, 1);
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = 2; // PCFSoftShadowMap
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Environment */}
        <Environment preset="city" />

        {/* Orbit Controls for desktop */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
          enableDamping={true}
          dampingFactor={0.05}
        />

        {/* Coins */}
        {generateCoinPositions(coins).map(({ coin, position }: { coin: CoinResponse; position: [number, number, number] }) => (
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
          position={[0, -2, 0]}
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
          Use mouse/touch to rotate, zoom, and explore • Click coins for info
        </Html>
      </Canvas>
    </>
  );
};

// AR Scene Component with better camera handling
const ARScene: React.FC<ARSceneProps> = ({ coins, onCoinClick }) => {
  const [selectedCoin, setSelectedCoin] = useState<CoinResponse | null>(null);
  const [arCapabilities, setArCapabilities] = useState<{
    arSupported: boolean;
    cameraAccess: boolean;
    canRunAR: boolean;
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    deviceType: string;
  } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
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

  const requestCameraPermission = useCallback(async () => {
    setIsRequestingCamera(true);
    setCameraError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      // Update capabilities
      const capabilities = await getARCapabilities();
      setArCapabilities(capabilities);
      
    } catch (error: any) {
      console.error('Camera permission error:', error);
      setCameraError(getCameraErrorMessage(error));
    } finally {
      setIsRequestingCamera(false);
    }
  }, []);

  const getCameraErrorMessage = (error: any): string => {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Camera access denied. Please allow camera access and try again.';
      case 'NotFoundError':
        return 'No camera found on this device.';
      case 'NotReadableError':
        return 'Camera is already in use by another application.';
      case 'OverconstrainedError':
        return 'Camera constraints cannot be satisfied.';
      default:
        return `Camera error: ${error.message}`;
    }
  };

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

  if (!arCapabilities.cameraAccess) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📷</div>
          <h2 className="text-2xl font-bold mb-2">Camera Access Required</h2>
          <p className="text-gray-300 mb-4">
            AR functionality requires camera access. Please allow camera access to continue.
          </p>
          
          {cameraError && (
            <div className="mb-4 p-4 bg-red-900 bg-opacity-50 rounded-lg">
              <p className="text-red-300 text-sm">{cameraError}</p>
            </div>
          )}
          
          <button
            onClick={requestCameraPermission}
            disabled={isRequestingCamera}
            className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isRequestingCamera ? 'Requesting...' : 'Allow Camera Access'}
          </button>
          
          <div className="mt-4 text-sm text-gray-400">
            <p>Requirements:</p>
            <p>• Camera access permission</p>
            <p>• HTTPS connection</p>
            <p>• Compatible browser</p>
          </div>
        </div>
      </div>
    );
  }

  if (!arCapabilities.arSupported) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🥽</div>
          <h2 className="text-2xl font-bold mb-2">AR Not Supported</h2>
          <p className="text-gray-300 mb-4">
            Your device doesn't support WebXR AR. You can still use 3D mode.
          </p>
          <div className="text-sm text-gray-400">
            <p>Supported browsers:</p>
            <p>• Chrome on Android (ARCore required)</p>
            <p>• Safari on iOS 15+ (ARKit required)</p>
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
          style={{ 
            background: 'transparent',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: true,
            failIfMajorPerformanceCaveat: false
          }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor(0x000000, 0);
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = 2; // PCFSoftShadowMap
            
            // Ensure camera is properly configured for AR
            if (camera) {
              camera.position.set(0, 0, 0);
              camera.lookAt(0, 0, -1);
            }
          }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* Environment */}
          <Environment preset="city" />

          {/* Coins */}
          {generateCoinPositions(coins).map(({ coin, position }: { coin: CoinResponse; position: [number, number, number] }) => (
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

// Main Improved AR Component
const ImprovedAR: React.FC<ImprovedARProps> = ({ onBack }) => {
  const [coins, setCoins] = useState<CoinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'ar' | 'desktop' | 'mobile'>('desktop');
  const [arCapabilities, setArCapabilities] = useState<{
    arSupported: boolean;
    cameraAccess: boolean;
    canRunAR: boolean;
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    deviceType: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect device type
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };
    checkDevice();
  }, []);

  // Check AR capabilities
  useEffect(() => {
    const checkCapabilities = async () => {
      const capabilities = await getARCapabilities();
      setArCapabilities(capabilities);
      
      // Set initial mode based on capabilities
      if (capabilities.canRunAR) {
        setMode('ar');
      } else if (isMobile) {
        setMode('mobile');
      } else {
        setMode('desktop');
      }
    };
    checkCapabilities();
  }, [isMobile]);

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
  }, []);

  const startARSession = useCallback(() => {
    setMode('ar');
  }, []);

  const startDesktopMode = useCallback(() => {
    setMode('desktop');
  }, []);

  const startMobileMode = useCallback(() => {
    setMode('mobile');
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

  if (mode === 'ar') {
    return (
      <div className="relative h-screen w-full bg-black">
        {/* AR Controls */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={() => setMode('desktop')}
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
        <ARScene coins={coins} onCoinClick={handleCoinClick} mode="ar" />
      </div>
    );
  }

  if (mode === 'desktop' || mode === 'mobile') {
    return (
      <div className="relative h-screen w-full">
        {/* Controls */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {arCapabilities?.canRunAR && (
            <button
              onClick={startARSession}
              className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-all font-semibold"
            >
              🥽 Start AR
            </button>
          )}
          <button
            onClick={loadCoins}
            className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
          >
            🔄 Refresh
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-400 transition-all"
            >
              ← Back
            </button>
          )}
        </div>

        {/* Mode Indicator */}
        <div className="absolute top-4 right-4 z-10">
          <div className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg">
            <span className="text-sm">
              {mode === 'mobile' ? '📱 Mobile 3D' : '💻 Desktop 3D'} • 
              Coins: {coins.filter(coin => coin.is_active).length}
            </span>
          </div>
        </div>

        {/* 3D Scene */}
        <Desktop3DScene coins={coins} onCoinClick={handleCoinClick} mode={mode} />
      </div>
    );
  }

  // Mode selection screen
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-yellow-400 to-orange-500">
      <div className="text-center text-white">
        <div className="text-8xl mb-6">🥽</div>
        <h1 className="text-4xl font-bold mb-4">Improved AR Experience</h1>
        <p className="text-xl mb-6">Discover {coins.length} coins in 3D or AR</p>
        
        <div className="space-y-4">
          {arCapabilities?.canRunAR && (
            <button
              onClick={startARSession}
              className="block mx-auto px-8 py-4 bg-white text-black rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              🥽 Start AR Experience
            </button>
          )}
          
          <button
            onClick={startDesktopMode}
            className="block mx-auto px-8 py-4 bg-white text-black rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            💻 Desktop 3D View
          </button>
          
          <button
            onClick={startMobileMode}
            className="block mx-auto px-8 py-4 bg-white text-black rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            📱 Mobile 3D View
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
          <p>Choose your preferred viewing mode</p>
          <p>AR requires camera access and WebXR support</p>
        </div>
      </div>
    </div>
  );
};

export default ImprovedAR;
