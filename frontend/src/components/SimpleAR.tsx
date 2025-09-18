import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { Group, Mesh } from 'three';
import { getCoinsForAR } from '../api/coin';
import { collectCoinPublic } from '../api/coinCollection';
import type { CoinResponse } from '../types/coin';

interface SimpleARProps {
  onBack?: () => void;
}

// GLB Model Component
const GLBCoin: React.FC<{
  coin: CoinResponse;
  position: [number, number, number];
  onCollect: () => void;
  isCollected: boolean;
}> = ({ coin, position, onCollect, isCollected }) => {
  const meshRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  // Load GLB model
  const gltf = useGLTF(coin.ar_model_url || '/coin.glb');

  useFrame((_, delta) => {
    if (!meshRef.current || isCollected) return;
    
    // Rotate the coin
    meshRef.current.rotation.y += delta * 0.5;
    
    // Hover effect
    const scale = hovered ? 1.2 : (coin.ar_scale || 1);
    meshRef.current.scale.setScalar(scale);
  });

  if (isCollected) return null;

  return (
    <group position={position} ref={meshRef}>
      <primitive 
        object={gltf.scene.clone()} 
        onClick={onCollect}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={coin.ar_scale || 1}
      />
      
      {hovered && (
        <Html position={[0, 1, 0]} center>
          <div className="bg-black bg-opacity-80 text-white px-3 py-1 rounded text-sm">
            Click to collect {coin.symbol}
          </div>
        </Html>
      )}
    </group>
  );
};

// Fallback Coin Component
const FallbackCoin: React.FC<{
  coin: CoinResponse;
  position: [number, number, number];
  onCollect: () => void;
  isCollected: boolean;
}> = ({ coin, position, onCollect, isCollected }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current || isCollected) return;
    
    meshRef.current.rotation.y += delta * 0.5;
    
    const scale = hovered ? 1.2 : (coin.ar_scale || 1);
    meshRef.current.scale.setScalar(scale);
  });

  if (isCollected) return null;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onCollect}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
      <meshStandardMaterial color="#FFD700" />
      
      {hovered && (
        <Html position={[0, 1, 0]} center>
          <div className="bg-black bg-opacity-80 text-white px-3 py-1 rounded text-sm">
            Click to collect {coin.symbol}
          </div>
        </Html>
      )}
    </mesh>
  );
};

// Coin Component with Error Boundary
const Coin: React.FC<{
  coin: CoinResponse;
  position: [number, number, number];
  onCollect: () => void;
  isCollected: boolean;
}> = ({ coin, position, onCollect, isCollected }) => {
  if (coin.ar_model_url) {
    return (
      <GLBCoin
        coin={coin}
        position={position}
        onCollect={onCollect}
        isCollected={isCollected}
      />
    );
  }
  
  return (
    <FallbackCoin
      coin={coin}
      position={position}
      onCollect={onCollect}
      isCollected={isCollected}
    />
  );
};

// AR Scene Component
const ARScene: React.FC<{
  coins: CoinResponse[];
  collectedCoins: Set<number>;
  onCoinCollect: (coin: CoinResponse) => void;
}> = ({ coins, collectedCoins, onCoinCollect }) => {
  const { camera } = useThree();

  useEffect(() => {
    // Set camera position for AR
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);
  }, [camera]);

  // Generate positions for coins
  const coinPositions: [number, number, number][] = coins.map((_, index) => [
    (Math.random() - 0.5) * 10,
    0,
    -2 - index * 2
  ]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Coins */}
      {coins.map((coin, index) => (
        <Coin
          key={coin.id}
          coin={coin}
          position={coinPositions[index]}
          onCollect={() => onCoinCollect(coin)}
          isCollected={collectedCoins.has(coin.id)}
        />
      ))}
      
      {/* Instructions */}
      <Html position={[0, -2, 0]} center>
        <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded text-center">
          <p className="text-sm">Look around to find coins • Tap coins to collect them</p>
        </div>
      </Html>
    </>
  );
};

const SimpleAR: React.FC<SimpleARProps> = ({ onBack }) => {
  const [coins, setCoins] = useState<CoinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectedCoins, setCollectedCoins] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playRequestedRef = useRef(false);
  const cameraInitializedRef = useRef(false);

  // Attach stream to video and start playback robustly
  const attachStreamAndAutoplay = useCallback((stream: MediaStream, onDone?: () => void) => {
    const video = videoRef.current;
    if (!video) return;

    // Clean up any existing event listeners first
    const cleanup = () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('playing', onPlaying);
    };

    // Ensure autoplay-friendly settings
    try { video.pause(); } catch {}
    video.muted = true;
    // @ts-ignore
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    video.srcObject = stream;

    playRequestedRef.current = false;
    let attempts = 0;
    const maxAttempts = 10; // ~2s with 200ms interval

    const tryPlay = () => {
      if (!videoRef.current || playRequestedRef.current) return;
      playRequestedRef.current = true;
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          setCameraLoading(false);
          setCameraInitializing(false);
          setNeedsUserGesture(false);
          cleanup();
          onDone && onDone();
        }).catch((error: any) => {
          if (error?.name !== 'AbortError') {
            console.warn('video.play() error, will retry:', error?.message || error);
          }
          playRequestedRef.current = false; // allow retry
          if (attempts++ < maxAttempts) {
            setTimeout(tryPlay, 200);
          } else {
            setCameraLoading(false);
            setCameraInitializing(false);
            setNeedsUserGesture(true);
            cleanup();
          }
        });
      } else {
        setCameraLoading(false);
        setCameraInitializing(false);
        setNeedsUserGesture(false);
        cleanup();
        onDone && onDone();
      }
    };

    const onCanPlay = () => {
      tryPlay();
    };

    const onLoadedData = () => {
      if (!playRequestedRef.current) tryPlay();
    };

    const onPlaying = () => {
      setCameraLoading(false);
      setCameraInitializing(false);
      setNeedsUserGesture(false);
      cleanup();
      onDone && onDone();
    };

    video.addEventListener('canplay', onCanPlay, { once: true });
    video.addEventListener('loadeddata', onLoadedData, { once: true });
    video.addEventListener('playing', onPlaying, { once: true });

    // Fallback trigger in case events are delayed
    const fallbackTimeout = setTimeout(() => {
      if (!playRequestedRef.current) tryPlay();
    }, 300);

    // Return cleanup function
    return () => {
      clearTimeout(fallbackTimeout);
      cleanup();
    };
  }, [videoRef]);

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

        // Manual camera restart function
        const startCamera = useCallback(async () => {
          // Prevent multiple simultaneous camera initialization
          if (cameraInitializing) {
            console.log('Camera already initializing, skipping...');
            return;
          }

          try {
            setCameraInitializing(true);
            setCameraError(null);
            setCameraLoading(true);
            
            console.log('Restarting camera...');
            
            // Stop existing stream first
            if (cameraStream) {
              console.log('Stopping existing camera stream...');
              cameraStream.getTracks().forEach(track => track.stop());
              setCameraStream(null);
            }
            cameraInitializedRef.current = false;

            // Clear existing video source safely
            if (videoRef.current) {
              try { videoRef.current.pause(); } catch {}
              videoRef.current.srcObject = null;
            }

            // Wait a moment for cleanup
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const constraints = {
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                focusMode: 'continuous', // Add focus mode for better focus control
                facingMode: 'environment' // Use back camera for AR
              },
              audio: false
            };

            console.log('Requesting new camera stream...');
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('New camera stream obtained:', stream);
            
            setCameraStream(stream);
            cameraInitializedRef.current = true;
            
            if (videoRef.current) {
              console.log('Setting new video source...');
              attachStreamAndAutoplay(stream);
            }
          } catch (err: any) {
            console.error('Camera restart error:', err);
            setCameraError(`Failed to restart camera: ${err.message || 'Please allow camera access'}`);
            setCameraLoading(false);
            setCameraInitializing(false);
          }
        }, [cameraStream, cameraInitializing, attachStreamAndAutoplay]);

        // Handle coin collection
        const handleCoinCollect = useCallback(async (coin: CoinResponse) => {
          if (collectedCoins.has(coin.id)) return;
          
          try {
            const response = await collectCoinPublic(coin.id);
            if (response.success) {
              setCollectedCoins(prev => new Set([...prev, coin.id]));
              setScore(prev => prev + 1);
              console.log(`Collected ${coin.symbol}! Score: ${score + 1}`);
            } else {
              console.error('Failed to collect coin:', response.error);
            }
          } catch (err) {
            console.error('Error collecting coin:', err);
          }
        }, [collectedCoins, score]);

        // Initial load (once) - remove startCamera dependency to prevent loops
        useEffect(() => {
          loadCoins();
        }, [loadCoins]);

        // Initialize camera only once on mount
        useEffect(() => {
          let mounted = true;
          let cleanupFunction: (() => void) | undefined;
          
          const initCamera = async () => {
            if (!mounted || cameraInitializing || cameraStream || cameraInitializedRef.current) return;
            
            try {
              setCameraInitializing(true);
              setCameraError(null);
              setCameraLoading(true);
              
              console.log('Initializing camera...');
              
              const constraints = {
                video: {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  focusMode: 'continuous', // Add focus mode for better focus control
                  facingMode: 'environment' // Use back camera for AR
                },
                audio: false
              };

              const stream = await navigator.mediaDevices.getUserMedia(constraints);
              console.log('Camera stream obtained:', stream);
              
              if (!mounted) {
                stream.getTracks().forEach(track => track.stop());
                return;
              }
              
              setCameraStream(stream);
              cameraInitializedRef.current = true;
              
              if (videoRef.current) {
                console.log('Setting video source...');
                cleanupFunction = attachStreamAndAutoplay(stream, () => {
                  if (!mounted) return;
                  console.log('Video playing successfully');
                });
              }
            } catch (err: any) {
              if (mounted) {
                console.error('Camera error:', err);
                setCameraError(`Camera access failed: ${err.message || 'Please allow camera access'}`);
                setCameraLoading(false);
                setCameraInitializing(false);
              }
            }
          };

          initCamera();
          
          return () => {
            mounted = false;
            if (cleanupFunction) {
              cleanupFunction();
            }
            if (cameraStream) {
              cameraStream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
          };
        }, []); // Empty dependency array - only run once

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p>Loading AR experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={loadCoins}
            className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black">
            {/* Camera Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ zIndex: 1 }}
            />
            
            {/* Camera Loading Overlay */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center" style={{ zIndex: 3 }}>
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                  <p>Starting camera...</p>
                </div>
              </div>
            )}

            {/* User gesture fallback */}
            {needsUserGesture && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center" style={{ zIndex: 4 }}>
                <div className="text-center text-white space-y-3">
                  <p className="text-sm opacity-80">Tap to enable camera</p>
                  <button
                    onClick={() => {
                      const v = videoRef.current;
                      if (!v) return;
                      try { v.muted = true; /* ensure autoplay allowed */ } catch {}
                      const p = v.play();
                      if (p && typeof p.then === 'function') {
                        p.then(() => setNeedsUserGesture(false))
                         .catch(() => {/* keep overlay */});
                      } else {
                        setNeedsUserGesture(false);
                      }
                    }}
                    className="px-5 py-2 bg-yellow-500 text-black rounded-lg shadow hover:bg-yellow-400 active:scale-95 transition"
                  >
                    Enable Camera
                  </button>
                </div>
              </div>
            )}

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
          >
            ← Back
          </button>
        )}
        
              <button
                onClick={startCamera}
                disabled={cameraLoading || cameraInitializing}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cameraInitializing ? '⚙️ Initializing...' : cameraLoading ? '🔄 Starting...' : '📷 Restart Camera'}
              </button>
      </div>

      {/* Score */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
          <p className="text-lg font-semibold">Score: {score}</p>
          <p className="text-sm">Collected: {collectedCoins.size}/{coins.length}</p>
        </div>
      </div>

            {/* Camera Error */}
            {cameraError && (
              <div className="absolute top-20 left-4 right-4 z-10">
                <div className="bg-red-900 bg-opacity-80 text-red-100 p-4 rounded-lg">
                  <p className="text-sm">{cameraError}</p>
                  <button
                    onClick={() => setCameraError(null)}
                    className="mt-2 px-3 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Debug Info */}
            <div className="absolute bottom-4 left-4 z-10 text-white text-xs bg-black bg-opacity-50 p-2 rounded">
              <p>Camera: {cameraStream ? 'Connected' : 'Not connected'}</p>
              <p>Loading: {cameraLoading ? 'Yes' : 'No'}</p>
              <p>Initializing: {cameraInitializing ? 'Yes' : 'No'}</p>
              <p>Video element: {videoRef.current ? 'Ready' : 'Not ready'}</p>
            </div>

      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 0, 0], fov: 75 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ARScene
          coins={coins}
          collectedCoins={collectedCoins}
          onCoinCollect={handleCoinCollect}
        />
      </Canvas>

      {/* Collection Feedback */}
      {score > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
            <p className="text-lg font-semibold">🎉 +1 Coin Collected!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleAR;
