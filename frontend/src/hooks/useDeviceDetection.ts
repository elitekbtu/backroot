import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'kiosk';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isKiosk: boolean;
  isTouch: boolean;
  screenWidth: number;
  screenHeight: number;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isKiosk: false,
    isTouch: false,
    screenWidth: 1920,
    screenHeight: 1080,
  });

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Определяем тип устройства на основе размера экрана и других факторов
      let type: DeviceType = 'desktop';
      let isMobile = false;
      let isTablet = false;
      let isDesktop = false;
      let isKiosk = false;

      // Критерии для определения типа устройства
      if (width <= 768) {
        type = 'mobile';
        isMobile = true;
      } else if (width <= 1024) {
        type = 'tablet';
        isTablet = true;
      } else if (width >= 1920 && height >= 1080 && isTouch) {
        // Большой сенсорный экран - вероятно киоск
        type = 'kiosk';
        isKiosk = true;
      } else {
        type = 'desktop';
        isDesktop = true;
      }

      // Дополнительные проверки для киоска
      if (width >= 1920 && height >= 1080 && isTouch && width >= height) {
        type = 'kiosk';
        isKiosk = true;
        isDesktop = false;
      }

      setDeviceInfo({
        type,
        isMobile,
        isTablet,
        isDesktop,
        isKiosk,
        isTouch,
        screenWidth: width,
        screenHeight: height,
      });
    };

    // Первоначальное определение
    detectDevice();

    // Слушаем изменения размера окна
    window.addEventListener('resize', detectDevice);
    
    // Слушаем изменения ориентации
    window.addEventListener('orientationchange', () => {
      setTimeout(detectDevice, 100);
    });

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return deviceInfo;
};