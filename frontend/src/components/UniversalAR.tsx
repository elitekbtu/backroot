import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  useGLTF, 
  Environment, 
  Html, 
  OrbitControls,
  Text,
  Sphere,
  Cylinder,
  Ring
} from '@react-three/drei';
import { Mesh, Group } from 'three';
import { getCoinsForAR } from '../api/coin';
import { 
  getARCapabilities, 
  generateCoinPositions, 
  getCoinColor,
  getAvailableCameras
} from '../lib/ar-utils';
import type { CoinResponse } from '../types/coin';

interface UniversalARProps {
  onBack?: () => void;
}

interface Coin3DWithGLBProps {
  coin: CoinResponse;
  position: [number, number, number];
  onClick?: () => void;
  isCollected?: boolean;
}

// Error Boundary for GLTF Loading
class GLTFErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('GLTF Error Boundary caught an error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('GLTF Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// GLB Model Loader Component
const GLBCoin: React.FC<Coin3DWithGLBProps> = ({ coin, position, onClick, isCollected }) => {
  const meshRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Validate and prepare GLB URL
  const getGLBUrl = (url: string): string => {
    if (!url) return '/coin.glb'; // Fallback to default coin model
    
    // If it's a relative URL, make it absolute
    if (url.startsWith('/')) {
      return url;
    }
    
    // If it's a full URL, use it as is
    if (url.startsWith('http')) {
      return url;
    }
    
    // Otherwise, treat as relative path
    return url.startsWith('/') ? url : `/${url}`;
  };

  const glbUrl = getGLBUrl(coin.ar_model_url || '');
  
  // Use useGLTF hook at the top level - this is required by Rules of Hooks
  const gltf = useGLTF(glbUrl);

  useFrame((state, delta) => {
    if (!meshRef.current || isCollected) return;
    
    // Smooth rotation
    meshRef.current.rotation.y += delta * 0.3;
    
    // Hover scaling
    const targetScale = hovered ? 1.2 : (coin.ar_scale || 1);
    const currentScale = meshRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * delta * 5;
    meshRef.current.scale.setScalar(newScale);
    
    // Click animation
    if (clicked) {
      const clickScale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
      meshRef.current.scale.setScalar(newScale * clickScale);
    }
  });

  const handleClick = () => {
    if (isCollected) return;
    setClicked(true);
    setTimeout(() => setClicked(false), 200);
    onClick?.();
  };

  if (isCollected) {
    return null; // Don't render collected coins
  }

  // If GLB loading failed, fallback to Coin3D
  if (!gltf || !gltf.scene) {
    return <FallbackCoin3D coin={coin} position={position} onClick={onClick} isCollected={isCollected} />;
  }

  return (
    <group position={position} ref={meshRef}>
      <primitive 
        object={gltf.scene.clone()} 
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={coin.ar_scale || 1}
      />
      
      {/* Collection indicator */}
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

// Fallback Coin3D Component (when no GLB model)
const FallbackCoin3D: React.FC<Coin3DWithGLBProps> = ({ coin, position, onClick, isCollected }) => {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const colors = {
    base: getCoinColor(coin.symbol),
    hover: '#FFFFFF',
    glow: getCoinColor(coin.symbol),
    ring: '#C0C0C0'
  };

  useFrame((state, delta) => {
    if (!meshRef.current || isCollected) return;
    
    // Smooth rotation
    meshRef.current.rotation.y += delta * 0.3;
    
    // Hover scaling
    const targetScale = hovered ? 1.2 : (coin.ar_scale || 1);
    const currentScale = meshRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * delta * 5;
    meshRef.current.scale.setScalar(newScale);
    
    // Click animation
    if (clicked) {
      const clickScale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
      meshRef.current.scale.setScalar(newScale * clickScale);
    }
    
    // Glow animation
    if (glowRef.current && hovered) {
      glowRef.current.rotation.y -= delta * 0.2;
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.9;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  const handleClick = () => {
    if (isCollected) return;
    setClicked(true);
    setTimeout(() => setClicked(false), 200);
    onClick?.();
  };

  if (isCollected) {
    return null; // Don't render collected coins
  }

  return (
    <group position={position}>
      {/* Main coin body */}
      <Cylinder
        ref={meshRef}
        args={[1, 1, 0.2, 16]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={hovered ? colors.hover : colors.base}
          metalness={0.8}
          roughness={0.2}
          emissive={hovered ? colors.base : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </Cylinder>
      
      {/* Coin edge/rim */}
      <Ring args={[0.95, 1.05, 16]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={hovered ? colors.hover : colors.ring}
          metalness={1}
          roughness={0.1}
        />
      </Ring>
      
      {/* Symbol text */}
      <Text
        position={[0, 0, 0.11]}
        fontSize={0.4}
        color={hovered ? colors.base : '#FFFFFF'}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {coin.symbol}
      </Text>
      
      {/* Glow effect when hovered */}
      {hovered && (
        <Sphere ref={glowRef} args={[1.3, 12, 12]} position={[0, 0, 0]}>
          <meshBasicMaterial
            color={colors.glow}
            transparent
            opacity={0.2}
          />
        </Sphere>
      )}
      
      {/* Collection indicator */}
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

// Coin Collection System
interface CoinCollectionSystemProps {
  coins: CoinResponse[];
  onCoinCollect: (coin: CoinResponse) => void;
  collectedCoins: Set<number>;
}

const CoinCollectionSystem: React.FC<CoinCollectionSystemProps> = ({ 
  coins, 
  onCoinCollect, 
  collectedCoins 
}) => {
  const coinPositions = generateCoinPositions(coins);

  return (
    <>
      {coinPositions.map(({ coin, position }) => {
        const isCollected = collectedCoins.has(coin.id);
        
        return coin.ar_model_url ? (
          <GLTFErrorBoundary
            key={coin.id}
            fallback={
              <FallbackCoin3D
                coin={coin}
                position={position}
                onClick={() => onCoinCollect(coin)}
                isCollected={isCollected}
              />
            }
          >
            <Suspense fallback={
              <FallbackCoin3D
                coin={coin}
                position={position}
                onClick={() => onCoinCollect(coin)}
                isCollected={isCollected}
              />
            }>
              <GLBCoin
                coin={coin}
                position={position}
                onClick={() => onCoinCollect(coin)}
                isCollected={isCollected}
              />
            </Suspense>
          </GLTFErrorBoundary>
        ) : (
          <FallbackCoin3D
            key={coin.id}
            coin={coin}
            position={position}
            onClick={() => onCoinCollect(coin)}
            isCollected={isCollected}
          />
        );
      })}
    </>
  );
};

// AR Scene Component
interface ARSceneProps {
  coins: CoinResponse[];
  collectedCoins: Set<number>;
  onCoinCollect: (coin: CoinResponse) => void;
  mode: 'ar' | '3d';
}

const ARScene: React.FC<ARSceneProps> = ({ coins, collectedCoins, onCoinCollect, mode }) => {
  const { camera, gl } = useThree();

  useEffect(() => {
    if (mode === 'ar') {
      // Configure camera for AR with back camera
      camera.position.set(0, 0, 0);
      camera.lookAt(0, 0, -1);
      // Set field of view appropriate for mobile AR (only for PerspectiveCamera)
      if ('fov' in camera) {
        (camera as any).fov = 60;
        camera.updateProjectionMatrix();
      }
    } else {
      // Configure camera for 3D
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      if ('fov' in camera) {
        (camera as any).fov = 75;
        camera.updateProjectionMatrix();
      }
    }
  }, [camera, mode]);

  // Handle WebGL context loss
  useEffect(() => {
    const canvas = gl.domElement;
    
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost. Attempting to restore...');
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');
      // Force a re-render to restore the scene
      gl.forceContextRestore();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  return (
    <>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* Environment */}
          <Environment preset="city" />

      {/* Controls for 3D mode */}
      {mode === '3d' && (
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
          enableDamping={true}
          dampingFactor={0.05}
        />
      )}

      {/* Coin Collection System */}
      <CoinCollectionSystem
        coins={coins}
        onCoinCollect={onCoinCollect}
        collectedCoins={collectedCoins}
      />

          {/* Instructions */}
          <Html
        position={[0, mode === 'ar' ? -1.5 : -2, 0]}
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
        {mode === 'ar' 
          ? 'Look around to see coins • Tap coins to collect • Move to explore'
          : 'Use mouse/touch to rotate, zoom, and explore • Click coins to collect'
        }
          </Html>
    </>
  );
};

// Main UniversalAR Component
const UniversalAR: React.FC<UniversalARProps> = ({ onBack }) => {
  const [coins, setCoins] = useState<CoinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'ar' | '3d'>('3d');
  const [collectedCoins, setCollectedCoins] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
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
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);

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

  // Load available cameras
  const loadCameras = useCallback(async () => {
    try {
      const cameras = await getAvailableCameras();
      setAvailableCameras(cameras);
      setCanSwitchCamera(cameras.length > 1);
      console.log('Available cameras:', cameras.map(c => ({ id: c.deviceId, label: c.label })));
    } catch (error) {
      console.error('Error loading cameras:', error);
    }
  }, []);

  // Check AR capabilities
  useEffect(() => {
    const checkCapabilities = async () => {
      const capabilities = await getARCapabilities();
      setArCapabilities(capabilities);
    };
    checkCapabilities();
    loadCoins();
    loadCameras();
  }, [loadCoins, loadCameras]);

  // Auto-start AR when cameras are available
  useEffect(() => {
    if (arCapabilities?.canRunAR && availableCameras.length > 0 && mode !== 'ar') {
      console.log('Auto-starting AR mode...');
      setMode('ar');
    }
  }, [arCapabilities, availableCameras.length, mode]);

  // Handle coin collection
  const handleCoinCollect = useCallback((coin: CoinResponse) => {
    if (collectedCoins.has(coin.id)) return;
    
    setCollectedCoins(prev => new Set([...prev, coin.id]));
    setScore(prev => prev + 1);
    
    // Show collection feedback
    console.log(`Collected ${coin.symbol}! Score: ${score + 1}`);
  }, [collectedCoins, score]);

  // Request camera permission for AR
  const requestCameraPermission = useCallback(async () => {
    setIsRequestingCamera(true);
    setCameraError(null);
    
    try {
      // Stop current stream if exists
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }

      const constraints = availableCameras.length > 0 
        ? { 
            video: { 
              deviceId: { exact: availableCameras[currentCameraIndex].deviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          }
        : { 
            video: { 
              facingMode: 'environment', // Back camera for AR
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCurrentStream(stream);
      
      const capabilities = await getARCapabilities();
      setArCapabilities(capabilities);
      
      if (capabilities.cameraAccess) {
    setMode('ar');
      }
    } catch (error: any) {
      console.error('Camera permission error:', error);
      setCameraError(getCameraErrorMessage(error));
    } finally {
      setIsRequestingCamera(false);
    }
  }, [availableCameras, currentCameraIndex, currentStream]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!canSwitchCamera || availableCameras.length <= 1) return;
    
    setIsRequestingCamera(true);
    setCameraError(null);
    
    try {
      // Stop current stream
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }

      // Switch to next camera
      const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
      setCurrentCameraIndex(nextIndex);
      
      const constraints = { 
        video: { 
          deviceId: { exact: availableCameras[nextIndex].deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCurrentStream(stream);
      
      console.log(`Switched to camera: ${availableCameras[nextIndex].label || 'Unknown'}`);
    } catch (error: any) {
      console.error('Camera switch error:', error);
      setCameraError(getCameraErrorMessage(error));
    } finally {
      setIsRequestingCamera(false);
    }
  }, [canSwitchCamera, availableCameras, currentCameraIndex, currentStream]);

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

  // Reset collection
  const resetCollection = useCallback(() => {
    setCollectedCoins(new Set());
    setScore(0);
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentStream]);

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
      <div className="relative h-screen w-full bg-black">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
        {arCapabilities?.canRunAR && mode !== 'ar' && (
          <button
            onClick={requestCameraPermission}
            disabled={isRequestingCamera}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isRequestingCamera ? 'Requesting...' : '🥽 Start AR'}
          </button>
        )}
        
        {mode === 'ar' && (
          <>
            <button
              onClick={() => setMode('3d')}
              className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
            >
              💻 3D Mode
            </button>
            
            {canSwitchCamera && (
              <button
                onClick={switchCamera}
                disabled={isRequestingCamera}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title={`Switch camera (${availableCameras[currentCameraIndex]?.label || 'Unknown'})`}
              >
                {isRequestingCamera ? 'Switching...' : '📷 Switch Camera'}
              </button>
            )}
          </>
        )}
        
          <button
            onClick={loadCoins}
            className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
          >
            🔄 Refresh
          </button>
        
        <button
          onClick={resetCollection}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
        >
          🔄 Reset Score
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

      {/* Score Display */}
        <div className="absolute top-4 right-4 z-10">
          <div className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg">
          <div className="text-sm">
            <div>Score: {score}</div>
            <div>Collected: {collectedCoins.size}/{coins.length}</div>
            <div>Mode: {mode === 'ar' ? '🥽 AR' : '💻 3D'}</div>
          </div>
        </div>
      </div>

      {/* Camera Info */}
      {mode === 'ar' && availableCameras.length > 0 && (
        <div className="absolute top-20 left-4 z-10">
          <div className="bg-black bg-opacity-50 text-white p-3 rounded-lg">
            <p className="text-sm">
              📷 Camera: {availableCameras[currentCameraIndex]?.label || `Camera ${currentCameraIndex + 1}`}
            </p>
            {canSwitchCamera && (
              <p className="text-xs text-gray-300 mt-1">
                {availableCameras.length} cameras available
              </p>
            )}
          </div>
        </div>
      )}

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

      {/* Camera Video Stream for AR */}
      {mode === 'ar' && currentStream && (
        <video
          ref={(video) => {
            if (video && currentStream) {
              video.srcObject = currentStream;
              video.play();
            }
          }}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1
          }}
        />
      )}

      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 0, mode === 'ar' ? 0 : 5], fov: 75 }}
        style={{ 
          background: mode === 'ar' 
            ? 'transparent' 
            : 'linear-gradient(to bottom, #87CEEB, #98FB98)',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: mode === 'ar' ? 2 : 1
        }}
        gl={{ 
          antialias: true, 
          alpha: mode === 'ar',
          powerPreference: 'high-performance'
        }}
        onCreated={({ gl }) => {
          if (mode === 'ar') {
            gl.setClearColor(0x000000, 0);
          } else {
            gl.setClearColor(0x87CEEB, 1);
          }
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = 2; // PCFSoftShadowMap
        }}
      >
        <ARScene
          coins={coins}
          collectedCoins={collectedCoins}
          onCoinCollect={handleCoinCollect}
          mode={mode}
        />
      </Canvas>

      {/* Collection Feedback */}
      {score > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
            🎉 Great! You've collected {score} coin{score !== 1 ? 's' : ''}!
        </div>
        </div>
      )}
    </div>
  );
};

export default UniversalAR;