import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { Environment, Html, OrbitControls } from '@react-three/drei';
import { Coin3D } from './Coin3D';
import { getCoinsForAR } from '../api/coin';
import { 
  getARCapabilities, 
  generateCoinPositions
} from '../lib/ar-utils';
import type { CoinResponse } from '../types/coin';

interface WorkingARProps {
  onBack?: () => void;
}

const WorkingAR: React.FC<WorkingARProps> = ({ onBack }) => {
  const [coins, setCoins] = useState<CoinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arCapabilities, setArCapabilities] = useState<{
    arSupported: boolean;
    cameraAccess: boolean;
    canRunAR: boolean;
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    deviceType: string;
  } | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinResponse | null>(null);
  const [mode, setMode] = useState<'ar' | '3d'>('3d');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load coins
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

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Update capabilities
      const capabilities = await getARCapabilities();
      setArCapabilities(capabilities);
      
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(getCameraErrorMessage(err));
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

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

  // Check AR capabilities
  useEffect(() => {
    const checkCapabilities = async () => {
      const capabilities = await getARCapabilities();
      setArCapabilities(capabilities);
    };
    checkCapabilities();
    loadCoins();
  }, [loadCoins]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleCoinClick = useCallback((coin: CoinResponse) => {
    setSelectedCoin(coin);
    console.log('Coin clicked:', coin);
  }, []);

  const switchToAR = useCallback(async () => {
    await startCamera();
    setMode('ar');
  }, [startCamera]);

  const switchTo3D = useCallback(() => {
    stopCamera();
    setMode('3d');
  }, [stopCamera]);

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

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Camera Video Background for AR */}
      {mode === 'ar' && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          playsInline
          muted
        />
      )}

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {arCapabilities?.cameraAccess && (
          <button
            onClick={mode === 'ar' ? switchTo3D : switchToAR}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-all font-semibold"
          >
            {mode === 'ar' ? '💻 3D Mode' : '🥽 AR Mode'}
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
            {mode === 'ar' ? '🥽 AR Mode' : '💻 3D Mode'} • 
            Coins: {coins.filter(coin => coin.is_active).length}
          </span>
        </div>
      </div>

      {/* Camera Status */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg">
          <span className="text-sm">
            Camera: {cameraStream ? '✅' : '❌'} • 
            AR: {arCapabilities?.arSupported ? '✅' : '❌'}
          </span>
        </div>
      </div>

      {/* Camera Error */}
      {cameraError && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-red-900 bg-opacity-90 text-white p-6 rounded-lg max-w-sm text-center">
            <div className="text-4xl mb-2">📷</div>
            <h3 className="text-lg font-bold mb-2">Camera Error</h3>
            <p className="text-sm mb-4">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Selected Coin Info */}
      {selectedCoin && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-black bg-opacity-80 text-white p-6 rounded-lg max-w-sm">
            <h3 className="text-xl font-bold mb-2">{selectedCoin.name}</h3>
            <p className="text-yellow-400 mb-2">{selectedCoin.symbol}</p>
            {selectedCoin.description && (
              <p className="text-gray-300 text-sm mb-4">{selectedCoin.description}</p>
            )}
            <button
              onClick={() => setSelectedCoin(null)}
              className="w-full px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 3D Scene */}
      <div className={`absolute inset-0 ${mode === 'ar' ? 'z-10' : 'z-0'}`}>
        {mode === '3d' ? (
          <Canvas
            camera={{ position: [0, 0, 5], fov: 75 }}
            style={{ 
              background: 'linear-gradient(to bottom, #87CEEB, #98FB98)',
              width: '100%',
              height: '100%'
            }}
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

            {/* Orbit Controls */}
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
        ) : (
          /* AR Scene */
          <XR store={createXRStore()}>
            <Canvas
              camera={{ position: [0, 0, 0], fov: 75 }}
              style={{ 
                background: 'transparent',
                width: '100%',
                height: '100%'
              }}
              gl={{ 
                antialias: true, 
                alpha: true,
                powerPreference: 'high-performance'
              }}
              onCreated={({ gl, camera }) => {
                gl.setClearColor(0x000000, 0);
                
                // Ensure camera is properly configured for AR
                if (camera) {
                  camera.position.set(0, 0, 0);
                  camera.lookAt(0, 0, -1);
                }
              }}
            >
              {/* Lighting */}
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
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
        )}
      </div>
    </div>
  );
};

export default WorkingAR;
