import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '@/hooks/useLocation';
import { apiService, CoinWithDistance } from '@/services/api';
import { CoinCard } from '@/components/CoinCard';
import { useAuth } from '@/contexts/AuthContext';
import ARGameScreen from '@/components/ar/ARGameScreen';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { location, errorMsg, loading: locationLoading, refreshLocation } = useLocation();                                                                                                                                             
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [coins, setCoins] = useState<CoinWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CoinWithDistance | null>(null);
  const [showARGame, setShowARGame] = useState(false);
  const [isUpdatingDistances, setIsUpdatingDistances] = useState(false);

  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideUpAnimation = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnimation, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadCoins = async () => {
    if (!location) {
      console.log('❌ LoadCoins: No location available');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('❌ LoadCoins: User not authenticated');
      Alert.alert('Authentication Required', 'Please log in to discover achievements');
      return;
    }
    
    console.log('📍 LoadCoins: Location available', { lat: location.latitude, lon: location.longitude });
    console.log('👤 LoadCoins: User authenticated', { userId: user?.id });
    
    try {
      setLoading(true);
      console.log('🔄 LoadCoins: Calling API...');
      
      const response = await apiService.discoverCoins(
        location.latitude,
        location.longitude
      );
      
      console.log('📨 LoadCoins: API Response', response);
      
      if (response.success && response.data) {
        console.log('✅ LoadCoins: Success, got coins:', response.data.items.length);
        // Sort by distance (closest first)
        const sortedCoins = response.data.items.sort((a, b) => {
          const distanceA = a.distance_meters || Infinity;
          const distanceB = b.distance_meters || Infinity;
          return distanceA - distanceB;
        });
        setCoins(sortedCoins);
        console.log('🎯 LoadCoins: Coins sorted by distance');
      } else {
        console.log('❌ LoadCoins: API Error', response.error);
        Alert.alert('Error', response.error || 'Failed to load achievements');
      }
    } catch (error) {
      console.log('💥 LoadCoins: Exception caught', error);
      Alert.alert('Error', 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const updateDistances = async () => {
    if (!location || !isAuthenticated) return;
    
    try {
      setIsUpdatingDistances(true);
      console.log('🔄 UpdateDistances: Updating distances...');
      
      const response = await apiService.discoverCoins(
        location.latitude,
        location.longitude
      );
      
      if (response.success && response.data?.items) {
        // Update existing coins with new distances
        setCoins(prevCoins => {
          const updatedCoins = prevCoins.map(prevCoin => {
            const newCoin = response.data!.items.find((item: CoinWithDistance) => item.id === prevCoin.id);
            if (newCoin) {
              return {
                ...prevCoin,
                distance_meters: newCoin.distance_meters,
              };
            }
            return prevCoin;
          });
          
          // Sort by new distances
          return updatedCoins.sort((a, b) => {
            const distanceA = a.distance_meters || Infinity;
            const distanceB = b.distance_meters || Infinity;
            return distanceA - distanceB;
          });
        });
        
        console.log('✅ UpdateDistances: Distances updated');
      }
    } catch (error) {
      console.log('💥 UpdateDistances: Error updating distances', error);
    } finally {
      setIsUpdatingDistances(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCoins();
    setRefreshing(false);
  };

  useEffect(() => {
    // For development: Allow testing without authentication
    if (!authLoading) {
      if (location && isAuthenticated) {
        // Load real data from API if authenticated
        loadCoins();
      } else {
        // Show mock data for unauthenticated users (development only)
        setCoins(mockCoins);
        setLoading(false);
      }
    }
  }, [location, isAuthenticated, authLoading]);

  // Update distances when location changes (but don't reload all coins)
  useEffect(() => {
    if (location && isAuthenticated && coins.length > 0) {
      // Only update distances, don't reload everything
      updateDistances();
    }
  }, [location?.latitude, location?.longitude]);

  const handleCollectCoin = (coin: CoinWithDistance) => {
    if (!location) {
      Alert.alert('Error', 'Location not available');
      return;
    }
    
    if (coin.distance_meters && coin.distance_meters > 50) {
      Alert.alert('Too Far', 'You need to be within 50 meters to collect this achievement');
      return;
    }
    
    // Запускаем AR игру
    setSelectedCoin(coin);
    setShowARGame(true);
  };

  const handleARGameSuccess = async () => {
    if (!selectedCoin) return;
    
    try {
      if (isAuthenticated && location) {
        // Call API to collect coin if authenticated
        const response = await apiService.collectCoin(
          selectedCoin.id,
          location.latitude,
          location.longitude
        );
        
        if (response.success) {
          // Update local state
          setCoins(prev => 
            prev.map(coin => 
              coin.id === selectedCoin.id 
                ? { ...coin, is_collected: true }
                : coin
            )
          );
          
          Alert.alert('Success! 🎉', `${selectedCoin.name} collected!\n+${selectedCoin.points} points`);
        } else {
          Alert.alert('Error', response.error || 'Failed to collect achievement');
        }
      } else {
        // For development: just update local state without API call
        setCoins(prev => 
          prev.map(coin => 
            coin.id === selectedCoin.id 
              ? { ...coin, is_collected: true }
              : coin
          )
        );
        
        Alert.alert('Success! 🎉', `${selectedCoin.name} collected!\n+${selectedCoin.points} points\n(Demo mode - not saved to server)`);
      }
      
    } catch (error) {
      Alert.alert('Error', 'Failed to collect achievement');
    } finally {
      setShowARGame(false);
      setSelectedCoin(null);
    }
  };

  const handleARGameClose = () => {
    setShowARGame(false);
    setSelectedCoin(null);
  };

  const canCollectCoin = (coin: CoinWithDistance) => {
    return !coin.is_collected && coin.distance_meters && coin.distance_meters <= 50;
  };

  // Mock data for development/testing without authentication
  const mockCoins: CoinWithDistance[] = [
    {
      id: 1,
      name: "Expo 2017",
      icon: "🏛️",
      points: 100,
      distance_meters: 25, // Very close for testing
      map_name: "Astana City",
      map_description: "Capital city of Kazakhstan",
      is_collected: false,
      collected_by_id: null,
      collected_at: null,
      created_at: new Date().toISOString(),
      updated_at: null,
      map_id: 1,
      latitude: 51.09076,
      longitude: 71.41784,
      description: "Visit the iconic Expo 2017 site",
      rarity: "rare"
    },
    {
      id: 2,
      name: "ADD Table Tennis Center",
      icon: "🏓",
      points: 50,
      distance_meters: 80, // Too far for collection
      map_name: "Astana City", 
      map_description: "Capital city of Kazakhstan",
      is_collected: false,
      collected_by_id: null,
      collected_at: null,
      created_at: new Date().toISOString(),
      updated_at: null,
      map_id: 1,
      latitude: 51.10441,
      longitude: 71.40153,
      description: "Table tennis center in Astana",
      rarity: "common"
    },
    {
      id: 3,
      name: "Baiterek Tower",
      icon: "🗼",
      points: 75,
      distance_meters: 15, // Very close for testing
      map_name: "Astana City",
      map_description: "Capital city of Kazakhstan", 
      is_collected: false,
      collected_by_id: null,
      collected_at: null,
      created_at: new Date().toISOString(),
      updated_at: null,
      map_id: 1,
      latitude: 51.1283,
      longitude: 71.4306,
      description: "Famous tower in Astana",
      rarity: "uncommon"
    }
  ];

  if (locationLoading || authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="location" size={48} color="#007AFF" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="location-off" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Location Error</Text>
          <Text style={styles.errorSubtext}>{errorMsg}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Animated.View style={[
        styles.header,
        {
          opacity: fadeAnimation,
          transform: [{ translateY: slideUpAnimation }]
        }
      ]}>
        <Ionicons name="trophy" size={32} color="#FFD700" />
        <Text style={styles.title}>Discover Achievements</Text>
        <Text style={styles.subtitle}>
          {isAuthenticated ? 
            'Find and collect achievements around you' : 
            'Demo mode - Login for real achievements'
          }
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 60 + insets.bottom }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <Ionicons name="refresh" size={32} color="#007AFF" />
            <Text style={styles.loadingText}>Loading achievements...</Text>
          </View>
        ) : coins.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons name="search" size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>No achievements found nearby</Text>
            <Text style={styles.emptySubtext}>
              Try moving around or check back later
            </Text>
          </View>
        ) : (
          coins.map((coin) => (
            <CoinCard
              key={coin.id}
              coin={coin}
              onCollect={() => handleCollectCoin(coin)}
              canCollect={canCollectCoin(coin)}
              isUpdating={isUpdatingDistances}
            />
          ))
        )}
      </ScrollView>

      {/* AR Game Modal */}
      <Modal
        visible={showARGame}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {selectedCoin && (
          <ARGameScreen
            achievement={{
              id: selectedCoin.id,
              name: selectedCoin.name || `Achievement #${selectedCoin.id}`,
              icon: selectedCoin.icon || '🏆',
              points: selectedCoin.points || 50,
              distance_meters: selectedCoin.distance_meters,
            }}
            onCollect={handleARGameSuccess}
            onClose={handleARGameClose}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 