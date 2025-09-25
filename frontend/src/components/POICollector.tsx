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

// POI data for cities
const POI_DATA: POI[] = [
  // ASTANA (30 places)
  { id: 'astana-1', name: 'Baiterek Tower', lat: 51.128333, lng: 71.430556, city: 'Astana' },
  { id: 'astana-2', name: 'Hazrat Sultan Mosque', lat: 51.125000, lng: 71.472200, city: 'Astana' },
  { id: 'astana-3', name: 'Ak Orda Presidential Palace', lat: 51.125830, lng: 71.446390, city: 'Astana' },
  { id: 'astana-4', name: 'Astana Opera Theatre', lat: 51.135560, lng: 71.410917, city: 'Astana' },
  { id: 'astana-5', name: 'Palace of Peace and Reconciliation', lat: 51.123060, lng: 71.463610, city: 'Astana' },
  { id: 'astana-6', name: 'National Museum of Kazakhstan', lat: 51.118490, lng: 71.468370, city: 'Astana' },
  { id: 'astana-7', name: 'Khan Shatyr Entertainment Center', lat: 51.132220, lng: 71.403890, city: 'Astana' },
  { id: 'astana-8', name: 'Astana Grand Mosque', lat: 51.073000, lng: 71.410500, city: 'Astana' },
  { id: 'astana-9', name: 'Nur-Astana Mosque', lat: 51.126508, lng: 71.415574, city: 'Astana' },
  { id: 'astana-10', name: 'Astana Arena Stadium', lat: 51.104833, lng: 71.401000, city: 'Astana' },
  { id: 'astana-11', name: 'Astana Botanical Garden', lat: 51.106320, lng: 71.416128, city: 'Astana' },
  { id: 'astana-12', name: 'Palace of Independence', lat: 51.120556, lng: 71.471944, city: 'Astana' },
  { id: 'astana-13', name: 'Kazakhstan Central Concert Hall', lat: 51.122778, lng: 71.441667, city: 'Astana' },
  { id: 'astana-14', name: 'Central Park', lat: 51.156852, lng: 71.419193, city: 'Astana' },
  { id: 'astana-15', name: 'Duman Oceanarium', lat: 51.147721, lng: 71.416798, city: 'Astana' },
  { id: 'astana-16', name: 'Nurly Zhol Railway Station', lat: 51.112389, lng: 71.531752, city: 'Astana' },
  { id: 'astana-17', name: 'Independence Square / Kazakh Eli', lat: 51.1290, lng: 71.4600, city: 'Astana' },
  { id: 'astana-18', name: 'Nurjol Boulevard', lat: 51.1280, lng: 71.4300, city: 'Astana' },
  { id: 'astana-19', name: 'Triumphal Arch Mäñgilik El', lat: 51.1325, lng: 71.4500, city: 'Astana' },
  { id: 'astana-20', name: 'Shabyt Palace of Creativity', lat: 51.1285, lng: 71.4450, city: 'Astana' },
  { id: 'astana-21', name: 'Astana Circus', lat: 51.1280, lng: 71.5200, city: 'Astana' },
  { id: 'astana-22', name: 'Park of Lovers', lat: 51.1150, lng: 71.5000, city: 'Astana' },
  { id: 'astana-23', name: 'City Government District', lat: 51.1250, lng: 71.4450, city: 'Astana' },
  { id: 'astana-24', name: 'Qaraötkel Bridge', lat: 51.142110, lng: 71.481858, city: 'Astana' },
  { id: 'astana-25', name: 'EXPO Nur Alem Sphere', lat: 51.1270, lng: 71.4270, city: 'Astana' },
  { id: 'astana-26', name: 'Atameken Map of Kazakhstan', lat: 51.1030, lng: 71.4830, city: 'Astana' },
  { id: 'astana-27', name: 'Monument to Pushkin', lat: 51.1700, lng: 71.4270, city: 'Astana' },
  { id: 'astana-28', name: 'Has Sanat Art Center', lat: 51.1350, lng: 71.4050, city: 'Astana' },
  { id: 'astana-29', name: 'Russian Drama Theatre Gorky', lat: 51.1310, lng: 71.4180, city: 'Astana' },
  { id: 'astana-30', name: 'Assumption Cathedral', lat: 51.1370, lng: 71.4300, city: 'Astana' },

  // ALMATY (20 places)
  { id: 'almaty-1', name: 'Medeu Ice Rink', lat: 43.154500, lng: 77.055200, city: 'Almaty' },
  { id: 'almaty-2', name: 'Shymbulak Resort', lat: 43.118700, lng: 77.086000, city: 'Almaty' },
  { id: 'almaty-3', name: 'Kok-Tobe Hill', lat: 43.233056, lng: 76.976111, city: 'Almaty' },
  { id: 'almaty-4', name: 'Almaty TV Tower', lat: 43.229530, lng: 76.976494, city: 'Almaty' },
  { id: 'almaty-5', name: 'Zenkov Cathedral', lat: 43.258789, lng: 76.953161, city: 'Almaty' },
  { id: 'almaty-6', name: 'Panfilov Park', lat: 43.258970, lng: 76.955860, city: 'Almaty' },
  { id: 'almaty-7', name: 'Big Almaty Lake', lat: 43.049444, lng: 76.985278, city: 'Almaty' },
  { id: 'almaty-8', name: 'Republic Square', lat: 43.238333, lng: 76.945278, city: 'Almaty' },
  { id: 'almaty-9', name: 'Central State Museum', lat: 43.235800, lng: 76.950900, city: 'Almaty' },
  { id: 'almaty-10', name: 'Kasteev Art Museum', lat: 43.235600, lng: 76.919500, city: 'Almaty' },
  { id: 'almaty-11', name: 'Green Bazaar', lat: 43.263611, lng: 76.953611, city: 'Almaty' },
  { id: 'almaty-12', name: 'Botanical Garden', lat: 43.220000, lng: 76.915000, city: 'Almaty' },
  { id: 'almaty-13', name: 'Arbat Pedestrian Street', lat: 43.261667, lng: 76.943056, city: 'Almaty' },
  { id: 'almaty-14', name: 'First President Park', lat: 43.188056, lng: 76.886944, city: 'Almaty' },
  { id: 'almaty-15', name: 'Dostyk Plaza', lat: 43.236944, lng: 76.946111, city: 'Almaty' },
  { id: 'almaty-16', name: 'National Library', lat: 43.238500, lng: 76.934100, city: 'Almaty' },
  { id: 'almaty-17', name: 'Almaty Opera and Ballet Theatre', lat: 43.248890, lng: 76.945830, city: 'Almaty' },
  { id: 'almaty-18', name: 'Almaty Zoo', lat: 43.263890, lng: 76.975560, city: 'Almaty' },
  { id: 'almaty-19', name: 'Almaty Botanical Garden East', lat: 43.221000, lng: 76.922000, city: 'Almaty' },
  { id: 'almaty-20', name: 'Esentai Mall', lat: 43.214060, lng: 76.945160, city: 'Almaty' },

  // SHYMKENT (20 places)
  { id: 'shymkent-1', name: 'Shymkent Zoo', lat: 42.376971, lng: 69.628091, city: 'Shymkent' },
  { id: 'shymkent-2', name: 'Dendropark (Arboretum)', lat: 42.370620, lng: 69.616810, city: 'Shymkent' },
  { id: 'shymkent-3', name: 'Ken Baba Ethnic Park', lat: 42.317930, lng: 69.605140, city: 'Shymkent' },
  { id: 'shymkent-4', name: 'Arbat Pedestrian Street', lat: 42.317407, lng: 69.585339, city: 'Shymkent' },
  { id: 'shymkent-5', name: 'Independence Park', lat: 42.306667, lng: 69.600000, city: 'Shymkent' },
  { id: 'shymkent-6', name: 'Altyn Shanirak Monument', lat: 42.306667, lng: 69.600000, city: 'Shymkent' },
  { id: 'shymkent-7', name: 'Shym Qala Fort', lat: 42.305752, lng: 69.596313, city: 'Shymkent' },
  { id: 'shymkent-8', name: 'Zher-Ana Monument', lat: 42.308620, lng: 69.599861, city: 'Shymkent' },
  { id: 'shymkent-9', name: 'Baydibek Bi Monument', lat: 42.387230, lng: 69.627780, city: 'Shymkent' },
  { id: 'shymkent-10', name: 'Shymkent Railway Station', lat: 42.298710, lng: 69.610300, city: 'Shymkent' },
  { id: 'shymkent-11', name: 'Shymkent International Airport', lat: 42.364201, lng: 69.478897, city: 'Shymkent' },
  { id: 'shymkent-12', name: 'St. Nicholas Cathedral', lat: 42.309840, lng: 69.618740, city: 'Shymkent' },
  { id: 'shymkent-13', name: 'Koshkar-Ata Mausoleum', lat: 42.298611, lng: 69.608056, city: 'Shymkent' },
  { id: 'shymkent-14', name: 'Ordabasy Square', lat: 42.316600, lng: 69.594800, city: 'Shymkent' },
  { id: 'shymkent-15', name: 'Shymkent Central Park', lat: 42.315900, lng: 69.603800, city: 'Shymkent' },
  { id: 'shymkent-16', name: 'Abay Park', lat: 42.3110, lng: 69.5950, city: 'Shymkent' },
  { id: 'shymkent-17', name: 'Shymkent Circus', lat: 42.3155, lng: 69.6095, city: 'Shymkent' },
  { id: 'shymkent-18', name: 'Museum of Victims of Political Repression', lat: 42.3140, lng: 69.5995, city: 'Shymkent' },
  { id: 'shymkent-19', name: 'Shymkent Museum of Fine Arts', lat: 42.3172, lng: 69.6040, city: 'Shymkent' },
  { id: 'shymkent-20', name: 'Kenesary Khan Monument', lat: 42.3125, lng: 69.6025, city: 'Shymkent' },
];

// Haversine formula for calculating distance between two points
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
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

  // Load saved data from localStorage
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

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('poi-coins', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('poi-collected', JSON.stringify(Array.from(collectedPOIs)));
  }, [collectedPOIs]);

  // Update nearest POIs
  const updateNearestPOIs = useCallback((location: UserLocation) => {
    const poisWithDistance = POI_DATA.map(poi => ({
      ...poi,
      distance: calculateDistance(location.lat, location.lng, poi.lat, poi.lng),
      collected: collectedPOIs.has(poi.id)
    }));

    const sortedPOIs = poisWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Show 10 nearest

    setNearestPOIs(sortedPOIs);
  }, [collectedPOIs]);

  // Check for coin collection
  const checkForCoinCollection = useCallback((location: UserLocation) => {
    POI_DATA.forEach(poi => {
      if (collectedPOIs.has(poi.id)) return; // Already collected

      const distance = calculateDistance(location.lat, location.lng, poi.lat, poi.lng);
      
      if (distance <= 50) { // Within 50 meters radius
        const newCoins = coins + 10;
        setCoins(newCoins);
        setCollectedPOIs(prev => new Set([...prev, poi.id]));
        
        // Show notification
        setNotification(`✅ You received +10 coins for ${poi.name}`);
        setTimeout(() => setNotification(null), 3000);
      }
    });
  }, [coins, collectedPOIs]);

  // Handle geolocation
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
    let errorMessage = 'Failed to get geolocation';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Geolocation access denied';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Geolocation unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Geolocation timeout';
        break;
    }
    
    setLocationError(errorMessage);
  }, []);

  // Start geolocation tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by browser');
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

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    // In a real application, save the watchPosition ID here and call clearWatch
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Notifications */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          {notification}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">💰</div>
          <div className="text-2xl font-bold text-gray-800">{coins}</div>
          <div className="text-gray-600">Coins</div>
        </div>
        
        <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">📍</div>
          <div className="text-sm text-gray-600">
            {userLocation ? (
              <>
                <div>Latitude: {userLocation.lat.toFixed(6)}</div>
                <div>Longitude: {userLocation.lng.toFixed(6)}</div>
                <div className="text-xs text-gray-500">
                  Accuracy: ±{Math.round(userLocation.accuracy)}m
                </div>
              </>
            ) : (
              'Geolocation not active'
            )}
          </div>
        </div>
        
        <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">🏆</div>
          <div className="text-2xl font-bold text-gray-800">{collectedPOIs.size}</div>
          <div className="text-gray-600">Places Visited</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Geolocation Tracking
            </h2>
            <p className="text-gray-600">
              {isTracking 
                ? 'Tracking active - approach points of interest!' 
                : 'Click "Start Tracking" to collect coins'
              }
            </p>
          </div>
          
          <div className="flex gap-2">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                🚀 Start Tracking
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                ⏹️ Stop
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

        {/* Map with POIs */}
        <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🗺️ Map with Points of Interest
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
              <span>Not Visited</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Nearby (≤50m)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Collected</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Your Location</span>
            </div>
          </div>
        </div>

        {/* Nearest POIs */}
        <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📍 Nearest Places
          </h2>
          
          {nearestPOIs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {userLocation 
                ? 'Loading nearest places...' 
                : 'Enable geolocation tracking to view nearest places'
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
                        {poi.distance ? Math.round(poi.distance) : '?'}m
                      </div>
                      {poi.distance! <= 50 && !poi.collected && (
                        <div className="text-xs text-yellow-600 font-medium">
                          Close! +10 coins
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
