// AR Utility Functions
import type { CoinResponse } from '../types/coin';

// Check if WebXR AR is supported
export const isARSupported = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!navigator.xr) {
      resolve(false);
      return;
    }
    
    navigator.xr.isSessionSupported('immersive-ar')
      .then(resolve)
      .catch(() => resolve(false));
  });
};

// Check if device is mobile
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

// Check if device is iOS
export const isIOSDevice = (): boolean => {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent);
};

// Check if device is Android
export const isAndroidDevice = (): boolean => {
  const userAgent = navigator.userAgent;
  return /Android/.test(userAgent);
};

// Get available cameras
export const getAvailableCameras = async (): Promise<MediaDeviceInfo[]> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error getting cameras:', error);
    return [];
  }
};

// Check if device has camera access
export const hasCameraAccess = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment' // Back camera for AR
      } 
    });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
};

// Check if device has multiple cameras
export const hasMultipleCameras = async (): Promise<boolean> => {
  const cameras = await getAvailableCameras();
  return cameras.length > 1;
};

// Get device capabilities for AR
export const getARCapabilities = async () => {
  const [arSupported, cameraAccess] = await Promise.all([
    isARSupported(),
    hasCameraAccess()
  ]);

  const isMobile = isMobileDevice();
  const isIOS = isIOSDevice();
  const isAndroid = isAndroidDevice();

  return {
    arSupported,
    cameraAccess,
    canRunAR: arSupported && cameraAccess,
    isMobile,
    isIOS,
    isAndroid,
    deviceType: isMobile ? 'mobile' : 'desktop'
  };
};

// Generate coin positions in a circle
export const generateCoinPositions = (coins: CoinResponse[]): Array<{
  coin: CoinResponse;
  position: [number, number, number];
}> => {
  return coins
    .filter(coin => coin.is_active && coin.ar_model_url)
    .map((coin, index) => {
      const angle = (index / coins.length) * Math.PI * 2;
      const radius = 2 + Math.random() * 1; // Random radius between 2-3
      const height = (Math.random() - 0.5) * 0.5; // Random height variation
      
      return {
        coin,
        position: [
          Math.cos(angle) * radius,
          coin.ar_position_y + height,
          Math.sin(angle) * radius + coin.ar_position_z
        ] as [number, number, number]
      };
    });
};

// Calculate distance between two 3D points
export const calculateDistance = (
  pos1: [number, number, number],
  pos2: [number, number, number]
): number => {
  const dx = pos1[0] - pos2[0];
  const dy = pos1[1] - pos2[1];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Get coin color based on symbol
export const getCoinColor = (symbol: string): string => {
  const colors: Record<string, string> = {
    'BTC': '#F7931A',
    'ETH': '#627EEA',
    'BNB': '#F3BA2F',
    'ADA': '#0033AD',
    'SOL': '#9945FF',
    'DOT': '#E6007A',
    'MATIC': '#8247E5',
    'AVAX': '#E84142',
    'LINK': '#2A5ADA',
    'UNI': '#FF007A',
    'ATOM': '#2E3148',
    'NEAR': '#00D4AA',
    'FTM': '#1969FF',
    'ALGO': '#000000',
    'VET': '#15BDFF',
    'ICP': '#29B6F6',
    'FIL': '#0090FF',
    'TRX': '#FF060A',
    'XLM': '#7D00FF',
    'XRP': '#23292F',
    'LTC': '#BFBBBB',
    'BCH': '#8CC152',
    'EOS': '#000000',
    'XMR': '#FF6600',
    'DASH': '#1C75BC',
    'ZEC': '#F4B728',
    'DOGE': '#C2A633',
    'SHIB': '#FFA500',
    'USDT': '#26A17B',
    'USDC': '#2775CA',
    'DAI': '#F4B731',
    'WBTC': '#F7931A',
    'WETH': '#627EEA',
  };
  return colors[symbol] || '#FFD700';
};

// Validate AR model URL
export const isValidARModelURL = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const validExtensions = ['.glb', '.gltf', '.obj', '.fbx'];
    const pathname = urlObj.pathname.toLowerCase();
    
    return validExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
};

// Format coin data for AR display
export const formatCoinForAR = (coin: CoinResponse) => {
  return {
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    description: coin.description,
    color: getCoinColor(coin.symbol),
    scale: coin.ar_scale || 1,
    position: [
      coin.ar_position_x || 0,
      coin.ar_position_y || 0,
      coin.ar_position_z || -2
    ] as [number, number, number],
    modelUrl: coin.ar_model_url,
    isActive: coin.is_active
  };
};

// AR performance monitoring
export class ARPerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private isMonitoring = false;

  start() {
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.measureFPS();
  }

  stop() {
    this.isMonitoring = false;
  }

  private measureFPS() {
    if (!this.isMonitoring) return;

    const now = performance.now();
    this.frameCount++;

    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
    }

    requestAnimationFrame(() => this.measureFPS());
  }

  getFPS(): number {
    return this.fps;
  }

  getPerformanceStatus(): 'excellent' | 'good' | 'poor' {
    if (this.fps >= 50) return 'excellent';
    if (this.fps >= 30) return 'good';
    return 'poor';
  }
}

// AR session management
export class ARSessionManager {
  private session: XRSession | null = null;
  private isActive = false;

  async startSession(): Promise<boolean> {
    try {
      if (!navigator.xr) {
        throw new Error('WebXR not supported');
      }

      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['hit-test', 'anchors']
      });

      this.session = session;
      this.isActive = true;

      session.addEventListener('end', () => {
        this.isActive = false;
        this.session = null;
      });

      return true;
    } catch (error) {
      console.error('Failed to start AR session:', error);
      return false;
    }
  }

  endSession(): void {
    if (this.session) {
      this.session.end();
    }
    this.isActive = false;
    this.session = null;
  }

  isSessionActive(): boolean {
    return this.isActive;
  }

  getSession(): XRSession | null {
    return this.session;
  }
}

// Export default AR utilities
export default {
  isARSupported,
  hasCameraAccess,
  getARCapabilities,
  generateCoinPositions,
  calculateDistance,
  getCoinColor,
  isValidARModelURL,
  formatCoinForAR,
  ARPerformanceMonitor,
  ARSessionManager
};
