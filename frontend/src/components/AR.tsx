import React, { useState, useEffect, useRef } from 'react';
import { getCoinsForAR } from '../api/coin';
import type { CoinResponse } from '../types/coin';

interface ARProps {
  className?: string;
}

export const AR: React.FC<ARProps> = ({ className = '' }) => {
  const [coins, setCoins] = useState<CoinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinResponse | null>(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check for AR support
  useEffect(() => {
    const checkARSupport = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setIsARSupported(true);
        } catch (err) {
          console.warn('AR not supported:', err);
          setIsARSupported(false);
        }
      }
    };
    checkARSupport();
  }, []);

  // Load coins for AR
  useEffect(() => {
    const loadCoins = async () => {
      try {
        setLoading(true);
        const response = await getCoinsForAR();
        if (response.success && response.data) {
          setCoins(response.data);
        } else {
          setError(response.error?.detail || 'Failed to load coins');
        }
      } catch (err) {
        setError('Failed to load coins for AR');
        console.error('Error loading coins:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCoins();
  }, []);

  // Initialize camera
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera');
    }
  };

  // Handle coin selection
  const handleCoinSelect = (coin: CoinResponse) => {
    setSelectedCoin(coin);
  };

  // Render 3D coin model (placeholder for now)
  const renderCoinModel = (coin: CoinResponse, index: number) => {
    const x = coin.ar_position_x || (index % 3) * 2 - 2;
    const y = coin.ar_position_y || Math.floor(index / 3) * 2 - 2;
    const z = coin.ar_position_z || -5;
    const scale = coin.ar_scale || 1;

    return (
      <div
        key={coin.id}
        className="absolute transform-gpu"
        style={{
          transform: `translate3d(${x * 100}px, ${y * 100}px, ${z * 100}px) scale(${scale})`,
          transformStyle: 'preserve-3d',
        }}
        onClick={() => handleCoinSelect(coin)}
      >
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg border-4 border-yellow-300 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200">
          <span className="text-white font-bold text-sm">{coin.symbol}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AR coins...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading AR</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isARSupported) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <div className="text-center">
          <div className="text-yellow-500 text-6xl mb-4">📱</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">AR Not Supported</h2>
          <p className="text-gray-600 mb-4">
            Your device doesn't support AR functionality. Please use a mobile device with camera access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-screen overflow-hidden ${className}`}>
      {/* Camera Feed */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          onLoadedMetadata={initializeCamera}
        />
        
        {/* AR Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full">
            {coins.map((coin, index) => renderCoinModel(coin, index))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <button
          onClick={initializeCamera}
          className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
        >
          📷 Camera
        </button>
        
        <div className="text-white bg-black bg-opacity-50 px-3 py-2 rounded-lg">
          <span className="text-sm">Coins: {coins.length}</span>
        </div>
      </div>

      {/* Coin Selection Panel */}
      {selectedCoin && (
        <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-95 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{selectedCoin.name}</h3>
            <button
              onClick={() => setSelectedCoin(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Symbol:</span> {selectedCoin.symbol}
            </p>
            {selectedCoin.description && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Description:</span> {selectedCoin.description}
              </p>
            )}
            <p className="text-sm text-gray-600">
              <span className="font-medium">AR Scale:</span> {selectedCoin.ar_scale}x
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Position:</span> ({selectedCoin.ar_position_x}, {selectedCoin.ar_position_y}, {selectedCoin.ar_position_z})
            </p>
            {selectedCoin.ar_model_url && (
              <a
                href={selectedCoin.ar_model_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-blue-600 hover:text-blue-800 underline"
              >
                View 3D Model →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-20 left-4 right-4 text-center">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
          Tap on coins to view details • Move your device to explore
        </div>
      </div>
    </div>
  );
};

export default AR;