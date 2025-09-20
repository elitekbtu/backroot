import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { Group, Mesh } from 'three';
import { AlertTriangle, Settings, RefreshCw, Camera } from 'lucide-react';
import { getCoinsForAR } from '../api/coin';
import { collectCoinPublic } from '../api/coinCollection';
import type { CoinResponse } from '../types/coin';

interface SimpleARProps {
  onBack?: () => void;
  onCollectCoin?: (coinId: number) => Promise<void>;
  collectedCoinIds?: Set<number>;
  collectingCoinId?: number | null;
}

const GLBCoin: React.FC<{
  coin: CoinResponse;
  position: [number, number, number];
  onCollect: () => void;
  isCollected: boolean;
}> = ({ coin, position, onCollect, isCollected }) => {
  const meshRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const gltf = useGLTF(coin.ar_model_url || '/coin.glb');

  useFrame((_, delta) => {
    if (!meshRef.current || isCollected) return;
    
    meshRef.current.rotation.y += delta * 0.5;
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
          <div className="bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs">
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
          <div className="bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs">
            Click to collect {coin.symbol}
          </div>
        </Html>
      )}
    </mesh>
  );
};

// Coin Component
const Coin: React.FC<{
  coin: CoinResponse;
  position: [number, number, number];
  onCollect: () => void;
  isCollected: boolean;
}> = ({ coin, position, onCollect, isCollected }) => {
  return coin.ar_model_url ? (
    <GLBCoin
      coin={coin}
      position={position}
      onCollect={onCollect}
      isCollected={isCollected}
    />
  ) : (
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
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);
  }, [camera]);

  const coinPositions: [number, number, number][] = coins.map((_, index) => [
    (Math.random() - 0.5) * 10,
    0,
    -2 - index * 2
  ]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {coins.map((coin, index) => (
        <Coin
          key={coin.id}
          coin={coin}
          position={coinPositions[index]}
          onCollect={() => onCoinCollect(coin)}
          isCollected={collectedCoins.has(coin.id)}
        />
      ))}
      
      <Html position={[0, -2, 0]} center>
        <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded text-xs text-center">
          <p>Look around to find coins • Tap coins to collect them</p>
        </div>
      </Html>
    </>
  );
};

const SimpleAR: React.FC<SimpleARProps> = ({ 
  onBack, 
  onCollectCoin, 
  collectedCoinIds, 
  collectingCoinId 
}) => {
  const [coins, setCoins] = useState<CoinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectedCoins, setCollectedCoins] = useState<Set<number>>(collectedCoinIds || new Set());
  const [score, setScore] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playRequestedRef = useRef(false);
  const cameraInitializedRef = useRef(false);

  const attachStreamAndAutoplay = useCallback((stream: MediaStream, onDone?: () => void) => {
    const video = videoRef.current;
    if (!video) return;

    const cleanup = () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('playing', onPlaying);
    };

    try { video.pause(); } catch {}
    video.muted = true;
    // @ts-ignore
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    video.srcObject = stream;

    playRequestedRef.current = false;
    let attempts = 0;
    const maxAttempts = 10;

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
            console.warn('video.play() error:', error?.message || error);
          }
          playRequestedRef.current = false;
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

    const fallbackTimeout = setTimeout(() => {
      if (!playRequestedRef.current) tryPlay();
    }, 300);

    return () => {
      clearTimeout(fallbackTimeout);
      cleanup();
    };
  }, [videoRef]);

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

  const startCamera = useCallback(async () => {
    if (cameraInitializing) return;

    try {
      setCameraInitializing(true);
      setCameraError(null);
      setCameraLoading(true);
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      cameraInitializedRef.current = false;

      if (videoRef.current) {
        try { videoRef.current.pause(); } catch {}
        videoRef.current.srcObject = null;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          focusMode: 'continuous',
          facingMode: 'environment'
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setCameraStream(stream);
      cameraInitializedRef.current = true;
      
      if (videoRef.current) {
        attachStreamAndAutoplay(stream);
      }
    } catch (err: any) {
      console.error('Camera restart error:', err);
      setCameraError(`Failed to restart camera: ${err.message || 'Please allow camera access'}`);
      setCameraLoading(false);
      setCameraInitializing(false);
    }
  }, [cameraStream, cameraInitializing, attachStreamAndAutoplay]);

  const handleCoinCollect = useCallback(async (coin: CoinResponse) => {
    if (collectedCoins.has(coin.id) || collectingCoinId === coin.id) return;
    
    if (onCollectCoin) {
      try {
        await onCollectCoin(coin.id);
        setCollectedCoins(prev => new Set([...prev, coin.id]));
        setScore(prev => prev + 1);
      } catch (err) {
        console.error('Error collecting coin:', err);
      }
    } else {
      try {
        const response = await collectCoinPublic(coin.id);
        if (response.success) {
          setCollectedCoins(prev => new Set([...prev, coin.id]));
          setScore(prev => prev + 1);
        } else {
          console.error('Failed to collect coin:', response.error);
        }
      } catch (err) {
        console.error('Error collecting coin:', err);
      }
    }
  }, [collectedCoins, onCollectCoin, collectingCoinId]);

  const collectAllCoins = useCallback(async () => {
    if (coins.length === 0 || collectedCoins.size === coins.length) return;

    for (const coin of coins) {
      if (!collectedCoins.has(coin.id)) {
        try {
          if (onCollectCoin) {
            await onCollectCoin(coin.id);
          } else {
            await collectCoinPublic(coin.id);
          }
          setCollectedCoins(prev => new Set([...prev, coin.id]));
          setScore(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.error(`Error collecting coin ${coin.id}:`, err);
        }
      }
    }
  }, [coins, collectedCoins, onCollectCoin]);

  useEffect(() => {
    loadCoins();
  }, [loadCoins]);

  useEffect(() => {
    if (collectedCoinIds) {
      setCollectedCoins(collectedCoinIds);
    }
  }, [collectedCoinIds]);

  useEffect(() => {
    let mounted = true;
    let cleanupFunction: (() => void) | undefined;
    
    const initCamera = async () => {
      if (!mounted || cameraInitializing || cameraStream || cameraInitializedRef.current) return;
      
      try {
        setCameraInitializing(true);
        setCameraError(null);
        setCameraLoading(true);
        
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            focusMode: 'continuous',
            facingMode: 'environment'
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        setCameraStream(stream);
        cameraInitializedRef.current = true;
        
        if (videoRef.current) {
          cleanupFunction = attachStreamAndAutoplay(stream, () => {
            if (!mounted) return;
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-2"></div>
          <p className="text-sm">Loading AR experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">
          <AlertTriangle className="w-12 h-12" />
        </div>
          <p className="text-sm mb-3">{error}</p>
          <button
            onClick={loadCoins}
            className="px-4 py-2 bg-yellow-500 text-black rounded text-sm hover:bg-yellow-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 1 }}
      />
      
      {cameraLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center" style={{ zIndex: 3 }}>
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-2"></div>
            <p className="text-sm">Starting camera...</p>
          </div>
        </div>
      )}

      {needsUserGesture && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center" style={{ zIndex: 4 }}>
          <div className="text-center text-white space-y-2">
            <p className="text-xs opacity-80">Tap to enable camera</p>
            <button
              onClick={() => {
                const v = videoRef.current;
                if (!v) return;
                try { v.muted = true; } catch {}
                const p = v.play();
                if (p && typeof p.then === 'function') {
                  p.then(() => setNeedsUserGesture(false))
                   .catch(() => {});
                } else {
                  setNeedsUserGesture(false);
                }
              }}
              className="px-3 py-1 bg-yellow-500 text-black rounded text-sm hover:bg-yellow-400 transition"
            >
              Enable Camera
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-3 left-3 z-10 flex gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1 bg-black bg-opacity-50 text-white rounded text-sm hover:bg-opacity-70 transition-all"
          >
            ← Back
          </button>
        )}
        
        <button
          onClick={startCamera}
          disabled={cameraLoading || cameraInitializing}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
        >
            {cameraInitializing ? <Settings className="w-6 h-6" /> : cameraLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
        </button>

        <button
          onClick={collectAllCoins}
          disabled={collectedCoins.size === coins.length}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-all disabled:opacity-50"
        >
          💰 All
        </button>
      </div>

      <div className="absolute top-3 right-3 z-10">
        <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
          <p>Score: {score}</p>
          <p className="text-xs">{collectedCoins.size}/{coins.length}</p>
        </div>
      </div>

      {cameraError && (
        <div className="absolute top-14 left-3 right-3 z-10">
          <div className="bg-red-900 bg-opacity-80 text-red-100 p-2 rounded text-xs">
            <p>{cameraError}</p>
            <button
              onClick={() => setCameraError(null)}
              className="mt-1 px-2 py-0.5 bg-red-700 text-white rounded text-xs hover:bg-red-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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

      {score > 0 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-green-500 text-white px-4 py-2 rounded text-sm shadow-lg animate-bounce">
            <p>🎉 +{collectedCoins.size} Collected!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleAR;