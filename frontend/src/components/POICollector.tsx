import React, { useState, useEffect, useCallback } from 'react';
import POIMap from './POIMap';

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

// Данные POI для городов
const POI_DATA: POI[] = [
  // АСТАНА (30 мест)
  { id: 'astana-1', name: 'Baiterek Tower', lat: 51.1283, lng: 71.4305, city: 'Астана' },
  { id: 'astana-2', name: 'Hazrat Sultan Mosque', lat: 51.125636, lng: 71.471892, city: 'Астана' },
  { id: 'astana-3', name: 'Ak Orda Presidential Palace', lat: 51.12583, lng: 71.44639, city: 'Астана' },
  { id: 'astana-4', name: 'Astana Opera Theatre', lat: 51.13556, lng: 71.410917, city: 'Астана' },
  { id: 'astana-5', name: 'Palace of Peace and Reconciliation', lat: 51.1269, lng: 71.4675, city: 'Астана' },
  { id: 'astana-6', name: 'Independence Square / Kazakh Eli', lat: 51.1290, lng: 71.4600, city: 'Астана' },
  { id: 'astana-7', name: 'Nurjol Boulevard', lat: 51.1280, lng: 71.4300, city: 'Астана' },
  { id: 'astana-8', name: 'Astana Botanical Garden', lat: 51.1325, lng: 71.5100, city: 'Астана' },
  { id: 'astana-9', name: 'Triumphal Arch Mäñgilik El', lat: 51.1325, lng: 71.4500, city: 'Астана' },
  { id: 'astana-10', name: 'Palace of Independence', lat: 51.1265, lng: 71.4680, city: 'Астана' },
  { id: 'astana-11', name: 'Shabyt Palace of Creativity', lat: 51.1285, lng: 71.4450, city: 'Астана' },
  { id: 'astana-12', name: 'National Museum of Kazakhstan', lat: 51.1290, lng: 71.4425, city: 'Астана' },
  { id: 'astana-13', name: 'Astana Circus', lat: 51.1280, lng: 71.5200, city: 'Астана' },
  { id: 'astana-14', name: 'Central Concert Hall', lat: 51.1320, lng: 71.4490, city: 'Астана' },
  { id: 'astana-15', name: 'Duman Entertainment Center', lat: 51.1230, lng: 71.4700, city: 'Астана' },
  { id: 'astana-16', name: 'Park of Lovers', lat: 51.1150, lng: 71.5000, city: 'Астана' },
  { id: 'astana-17', name: 'Khan Shatyr', lat: 51.1280, lng: 71.4300, city: 'Астана' },
  { id: 'astana-18', name: 'City Government District', lat: 51.1250, lng: 71.4450, city: 'Астана' },
  { id: 'astana-19', name: 'Nur-Astana Mosque', lat: 51.126508, lng: 71.415574, city: 'Астана' },
  { id: 'astana-20', name: 'Saryarka Velodrome', lat: 51.104722, lng: 71.405000, city: 'Астана' },
  { id: 'astana-21', name: 'Qaraötkel Bridge', lat: 51.142110, lng: 71.481858, city: 'Астана' },
  { id: 'astana-22', name: 'EXPO Nur Alem Sphere', lat: 51.1270, lng: 71.4270, city: 'Астана' },
  { id: 'astana-23', name: 'Astana Arena Stadium', lat: 51.1100, lng: 71.4400, city: 'Астана' },
  { id: 'astana-24', name: 'Atameken Map of Kazakhstan', lat: 51.1030, lng: 71.4830, city: 'Астана' },
  { id: 'astana-25', name: 'Monument to Pushkin', lat: 51.1700, lng: 71.4270, city: 'Астана' },
  { id: 'astana-26', name: 'Has Sanat Art Center', lat: 51.1350, lng: 71.4050, city: 'Астана' },
  { id: 'astana-27', name: 'Russian Drama Theatre Gorky', lat: 51.1310, lng: 71.4180, city: 'Астана' },
  { id: 'astana-28', name: 'Assumption Cathedral', lat: 51.1370, lng: 71.4300, city: 'Астана' },
  { id: 'astana-29', name: 'Presidential Park', lat: 51.1270, lng: 71.4520, city: 'Астана' },
  { id: 'astana-30', name: 'Nur Alem Expo Area', lat: 51.1285, lng: 71.4180, city: 'Астана' },

  // АЛМАТЫ (20 мест)
  { id: 'almaty-1', name: 'Medeu Ice Rink', lat: 43.157500, lng: 77.058611, city: 'Алматы' },
  { id: 'almaty-2', name: 'Shymbulak Resort', lat: 43.128060, lng: 77.080830, city: 'Алматы' },
  { id: 'almaty-3', name: 'Kok-Tobe Hill', lat: 43.233060, lng: 76.976110, city: 'Алматы' },
  { id: 'almaty-4', name: 'Almaty TV Tower', lat: 43.228890, lng: 76.976110, city: 'Алматы' },
  { id: 'almaty-5', name: 'Zenkov Cathedral', lat: 43.258611, lng: 76.953333, city: 'Алматы' },
  { id: 'almaty-6', name: 'Panfilov Park', lat: 43.258833, lng: 76.953819, city: 'Алматы' },
  { id: 'almaty-7', name: 'Big Almaty Lake', lat: 43.050600, lng: 76.985000, city: 'Алматы' },
  { id: 'almaty-8', name: 'Republic Square', lat: 43.238330, lng: 76.945280, city: 'Алматы' },
  { id: 'almaty-9', name: 'Central State Museum', lat: 43.235830, lng: 76.950830, city: 'Алматы' },
  { id: 'almaty-10', name: 'Kasteev Art Museum', lat: 43.235600, lng: 76.919500, city: 'Алматы' },
  { id: 'almaty-11', name: 'Green Bazaar', lat: 43.263611, lng: 76.953611, city: 'Алматы' },
  { id: 'almaty-12', name: 'Botanical Garden', lat: 43.220000, lng: 76.915000, city: 'Алматы' },
  { id: 'almaty-13', name: 'Arbat Pedestrian Street', lat: 43.2600, lng: 76.9500, city: 'Алматы' },
  { id: 'almaty-14', name: 'First President Park', lat: 43.1927, lng: 76.8773, city: 'Алматы' },
  { id: 'almaty-15', name: 'Dostyk Plaza', lat: 43.2361, lng: 76.9450, city: 'Алматы' },
  { id: 'almaty-16', name: 'National Library', lat: 43.2420, lng: 76.9455, city: 'Алматы' },
  { id: 'almaty-17', name: 'Almaty Opera and Ballet Theatre', lat: 43.2565, lng: 76.9430, city: 'Алматы' },
  { id: 'almaty-18', name: 'Almaty Zoo', lat: 43.2483, lng: 76.9647, city: 'Алматы' },
  { id: 'almaty-19', name: 'Almaty Botanical Garden East', lat: 43.2210, lng: 76.9220, city: 'Алматы' },
  { id: 'almaty-20', name: 'Esentai Mall', lat: 43.2125, lng: 76.9150, city: 'Алматы' },

  // ШЫМКЕНТ (20 мест)
  { id: 'shymkent-1', name: 'Ordabasy Square', lat: 42.316600, lng: 69.594800, city: 'Шымкент' },
  { id: 'shymkent-2', name: 'Shymkent Central Park', lat: 42.315900, lng: 69.603800, city: 'Шымкент' },
  { id: 'shymkent-3', name: 'Baydibek Bi Monument', lat: 42.296900, lng: 69.631200, city: 'Шымкент' },
  { id: 'shymkent-4', name: 'Independence Park', lat: 42.3144, lng: 69.6097, city: 'Шымкент' },
  { id: 'shymkent-5', name: 'Abay Park', lat: 42.3110, lng: 69.5950, city: 'Шымкент' },
  { id: 'shymkent-6', name: 'Shymkent Zoo', lat: 42.3192, lng: 69.6240, city: 'Шымкент' },
  { id: 'shymkent-7', name: 'Shymkent Circus', lat: 42.3155, lng: 69.6095, city: 'Шымкент' },
  { id: 'shymkent-8', name: 'Arboretum', lat: 42.3178, lng: 69.6212, city: 'Шымкент' },
  { id: 'shymkent-9', name: 'Museum of Victims of Political Repression', lat: 42.3140, lng: 69.5995, city: 'Шымкент' },
  { id: 'shymkent-10', name: 'Shymkent Museum of Fine Arts', lat: 42.3172, lng: 69.6040, city: 'Шымкент' },
  { id: 'shymkent-11', name: 'Kenesary Khan Monument', lat: 42.3125, lng: 69.6025, city: 'Шымкент' },
  { id: 'shymkent-12', name: 'Ken Baba Ethnic Park', lat: 42.3090, lng: 69.6100, city: 'Шымкент' },
  { id: 'shymkent-13', name: 'Tauke Khan Avenue (main street POI)', lat: 42.3185, lng: 69.6000, city: 'Шымкент' },
  { id: 'shymkent-14', name: 'Shymkent Plaza Mall', lat: 42.3220, lng: 69.6090, city: 'Шымкент' },
  { id: 'shymkent-15', name: 'Kazhymukan Stadium', lat: 42.3120, lng: 69.6170, city: 'Шымкент' },
  { id: 'shymkent-16', name: 'Regional Drama Theatre', lat: 42.3150, lng: 69.5975, city: 'Шымкент' },
  { id: 'shymkent-17', name: 'Dendropark Entrance', lat: 42.3205, lng: 69.6180, city: 'Шымкент' },
  { id: 'shymkent-18', name: 'Technopark Shymkent', lat: 42.3135, lng: 69.6155, city: 'Шымкент' },
  { id: 'shymkent-19', name: 'Music Fountain Square', lat: 42.3170, lng: 69.6070, city: 'Шымкент' },
  { id: 'shymkent-20', name: 'Al-Farabi Square', lat: 42.3160, lng: 69.6040, city: 'Шымкент' },
];

// Формула Haversine для расчета расстояния между двумя точками
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Радиус Земли в метрах
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Расстояние в метрах
};

const POICollector: React.FC = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [collectedPOIs, setCollectedPOIs] = useState<Set<string>>(new Set());
  const [nearestPOIs, setNearestPOIs] = useState<POI[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Загрузка сохраненных данных из localStorage
  useEffect(() => {
    const savedCoins = localStorage.getItem('poi-coins');
    const savedCollected = localStorage.getItem('poi-collected');
    
    if (savedCoins) {
      setCoins(parseInt(savedCoins, 10));
    }
    
    if (savedCollected) {
      setCollectedPOIs(new Set(JSON.parse(savedCollected)));
    }
  }, []);

  // Сохранение данных в localStorage
  useEffect(() => {
    localStorage.setItem('poi-coins', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('poi-collected', JSON.stringify(Array.from(collectedPOIs)));
  }, [collectedPOIs]);

  // Обновление ближайших POI
  const updateNearestPOIs = useCallback((location: UserLocation) => {
    const poisWithDistance = POI_DATA.map(poi => ({
      ...poi,
      distance: calculateDistance(location.lat, location.lng, poi.lat, poi.lng),
      collected: collectedPOIs.has(poi.id)
    }));

    const sortedPOIs = poisWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Показываем 10 ближайших

    setNearestPOIs(sortedPOIs);
  }, [collectedPOIs]);

  // Проверка на сбор коинов
  const checkForCoinCollection = useCallback((location: UserLocation) => {
    POI_DATA.forEach(poi => {
      if (collectedPOIs.has(poi.id)) return; // Уже собрано

      const distance = calculateDistance(location.lat, location.lng, poi.lat, poi.lng);
      
      if (distance <= 50) { // В радиусе 50 метров
        const newCoins = coins + 10;
        setCoins(newCoins);
        setCollectedPOIs(prev => new Set([...prev, poi.id]));
        
        // Показываем уведомление
        setNotification(`✅ Вы получили +10 коинов за ${poi.name}`);
        setTimeout(() => setNotification(null), 3000);
      }
    });
  }, [coins, collectedPOIs]);

  // Обработка геолокации
  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    const location: UserLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy
    };
    
    setUserLocation(location);
    setLocationError(null);
    updateNearestPOIs(location);
    checkForCoinCollection(location);
  }, [updateNearestPOIs, checkForCoinCollection]);

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Не удалось получить геолокацию';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Доступ к геолокации запрещен';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Геолокация недоступна';
        break;
      case error.TIMEOUT:
        errorMessage = 'Время ожидания геолокации истекло';
        break;
    }
    
    setLocationError(errorMessage);
  }, []);

  // Начать отслеживание геолокации
  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Геолокация не поддерживается браузером');
      return;
    }

    setIsTracking(true);
    navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Остановить отслеживание
  const stopTracking = () => {
    setIsTracking(false);
    // В реальном приложении здесь нужно сохранить ID watchPosition и вызвать clearWatch
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Уведомления */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          {notification}
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">💰</div>
          <div className="text-2xl font-bold text-gray-800">{coins}</div>
          <div className="text-gray-600">Коинов</div>
        </div>
        
        <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">📍</div>
          <div className="text-sm text-gray-600">
            {userLocation ? (
              <>
                <div>Широта: {userLocation.lat.toFixed(6)}</div>
                <div>Долгота: {userLocation.lng.toFixed(6)}</div>
                <div className="text-xs text-gray-500">
                  Точность: ±{Math.round(userLocation.accuracy)}м
                </div>
              </>
            ) : (
              'Геолокация не активна'
            )}
          </div>
        </div>
        
        <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">🏆</div>
          <div className="text-2xl font-bold text-gray-800">{collectedPOIs.size}</div>
          <div className="text-gray-600">Мест посещено</div>
        </div>
      </div>

      {/* Управление */}
      <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Отслеживание геолокации
            </h2>
            <p className="text-gray-600">
              {isTracking 
                ? 'Отслеживание активно - приближайтесь к точкам интереса!' 
                : 'Нажмите "Начать отслеживание" для сбора коинов'
              }
            </p>
          </div>
          
          <div className="flex gap-2">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                🚀 Начать отслеживание
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                ⏹️ Остановить
              </button>
            )}
          </div>
        </div>

        {locationError && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            ⚠️ {locationError}
          </div>
        )}
      </div>

        {/* Карта с POI */}
        <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🗺️ Карта с точками интереса
          </h2>
          
          <POIMap 
            userLocation={userLocation}
            pois={nearestPOIs}
            onPOIClick={(poi) => {
              console.log('Clicked POI:', poi);
            }}
            onMapReady={(map) => {
              setMapInstance(map);
            }}
          />
          
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Не посещено</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Близко (≤50м)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Собрано</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Ваше местоположение</span>
            </div>
          </div>
        </div>

        {/* Ближайшие POI */}
        <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📍 Ближайшие места
          </h2>
          
          {nearestPOIs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {userLocation 
                ? 'Загрузка ближайших мест...' 
                : 'Включите отслеживание геолокации для просмотра ближайших мест'
              }
            </div>
          ) : (
            <div className="space-y-3">
              {nearestPOIs.map((poi) => (
                <div
                  key={poi.id}
                  className={`p-4 rounded-lg border-2 transition-colors cursor-pointer hover:shadow-md ${
                    poi.collected
                      ? 'bg-green-50 border-green-200'
                      : poi.distance! <= 50
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => {
                    // Центрируем карту на выбранном POI
                    if (mapInstance) {
                      mapInstance.setCenter({ lat: poi.lat, lng: poi.lng });
                      mapInstance.setZoom(18);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {poi.name}
                        {poi.collected && <span className="ml-2 text-green-600">✅</span>}
                      </h3>
                      <p className="text-sm text-gray-600">{poi.city}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        poi.collected
                          ? 'text-green-600'
                          : poi.distance! <= 50
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`}>
                        {poi.distance ? Math.round(poi.distance) : '?'}м
                      </div>
                      {poi.distance! <= 50 && !poi.collected && (
                        <div className="text-xs text-yellow-600 font-medium">
                          Близко! +10 коинов
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

    </div>
  );
};

export default POICollector;
