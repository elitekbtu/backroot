import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  collected?: boolean;
  distance?: number;
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

interface POIMapProps {
  userLocation: UserLocation | null;
  pois: POI[];
  onPOIClick?: (poi: POI) => void;
  onMapReady?: (map: google.maps.Map) => void;
}

const POIMap: React.FC<POIMapProps> = ({ userLocation, pois, onPOIClick, onMapReady }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Инициализация карты
  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDjXEeoTqkwQ2sidjXGsErUfobmBI1gXqg',
          version: 'weekly',
          libraries: ['places']
        });

        const google = await loader.load();
        
        if (!mapRef.current) return;

        // Создаем карту
        const map = new google.maps.Map(mapRef.current, {
          zoom: 15,
          center: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : { lat: 51.1283, lng: 71.4305 }, // Астана по умолчанию
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'all',
              elementType: 'geometry.fill',
              stylers: [{ color: '#f5f5f5' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry.fill',
              stylers: [{ color: '#e5e5e5' }]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#ffffff' }]
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#666666' }]
            }
          ]
        });

        mapInstanceRef.current = map;
        setIsLoaded(true);
        setError(null);
        
        // Передаем экземпляр карты родительскому компоненту
        if (onMapReady) {
          onMapReady(map);
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Не удалось загрузить карту. Проверьте API ключ Google Maps.');
      }
    };

    initMap();
  }, []);

  // Обновление маркера пользователя
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    // Удаляем старый маркер пользователя
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    // Создаем новый маркер пользователя
    const userMarker = new google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map: mapInstanceRef.current,
      title: 'Your location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#000000',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      },
      zIndex: 1000
    });

    // Добавляем круг точности
    const accuracyCircle = new google.maps.Circle({
      strokeColor: '#000000',
      strokeOpacity: 0.3,
      strokeWeight: 1,
      fillColor: '#000000',
      fillOpacity: 0.1,
      map: mapInstanceRef.current,
      center: { lat: userLocation.lat, lng: userLocation.lng },
      radius: userLocation.accuracy
    });

    userMarkerRef.current = userMarker;

    // Центрируем карту на пользователе
    mapInstanceRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });

    return () => {
      if (userMarker) userMarker.setMap(null);
      accuracyCircle.setMap(null);
    };
  }, [userLocation]);

  // Обновление маркеров POI
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Очищаем старые маркеры
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Создаем новые маркеры для POI
    pois.forEach(poi => {
      const marker = new google.maps.Marker({
        position: { lat: poi.lat, lng: poi.lng },
        map: mapInstanceRef.current,
        title: poi.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: poi.collected ? 12 : 8,
          fillColor: poi.collected ? '#000000' : (poi.distance && poi.distance <= 50 ? '#666666' : '#999999'),
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        zIndex: poi.collected ? 100 : 50
      });

      // Добавляем информационное окно
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 class="font-medium text-gray-900 text-sm">${poi.name}</h3>
            <p class="text-xs text-gray-500 mt-1">${poi.city}</p>
            ${poi.distance ? `<p class="text-xs text-gray-400 mt-1">Distance: ${Math.round(poi.distance)}m</p>` : ''}
            ${poi.collected ? '<p class="text-xs text-gray-900 font-medium mt-1">✓ Collected</p>' : ''}
            ${poi.distance && poi.distance <= 50 && !poi.collected ? '<p class="text-xs text-gray-600 font-medium mt-1">Close! +10 coins</p>' : ''}
          </div>
        `
      });

      // Обработчик клика на маркер
      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        if (onPOIClick) {
          onPOIClick(poi);
        }
      });

      markersRef.current.push(marker);
    });
  }, [pois, isLoaded, onPOIClick]);

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-500 mr-2">⚠️</div>
          <div className="text-gray-900">{error}</div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Add VITE_GOOGLE_MAPS_API_KEY to .env file
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <div className="text-gray-600">Loading map...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POIMap;
