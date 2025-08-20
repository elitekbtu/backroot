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

} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '@/hooks/useLocation';
import { apiService, CoinWithDistance } from '@/services/api';
import { CoinCard } from '@/components/CoinCard';


export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { location, errorMsg, loading: locationLoading } = useLocation();
  const [coins, setCoins] = useState<CoinWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  
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
    if (!location) return;
    
    try {
      setLoading(true);
      const response = await apiService.discoverCoins(
        location.latitude,
        location.longitude
      );
      
      if (response.success && response.data) {
        // Sort by distance (closest first)
        const sortedCoins = response.data.items.sort((a, b) => {
          const distanceA = a.distance_meters || Infinity;
          const distanceB = b.distance_meters || Infinity;
          return distanceA - distanceB;
        });
        setCoins(sortedCoins);
      } else {
        Alert.alert('Error', response.error || 'Failed to load achievements');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCoins();
    setRefreshing(false);
  };

  useEffect(() => {
    if (location) {
      loadCoins();
    }
  }, [location]);

  const handleCollectCoin = (coin: CoinWithDistance) => {
    if (!location) {
      Alert.alert('Error', 'Location not available');
      return;
    }
    
    if (coin.distance_meters && coin.distance_meters > 50) {
      Alert.alert('Too Far', 'You need to be within 50 meters to collect this achievement');
      return;
    }
    
    // Просто показываем уведомление о сборе
    Alert.alert('Success', `${coin.name} collected! 🎉`);
  };

  const canCollectCoin = (coin: CoinWithDistance) => {
    return !coin.is_collected && coin.distance_meters && coin.distance_meters <= 50;
  };

  if (locationLoading) {
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
          Find and collect achievements around you
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
            />
          ))
        )}
      </ScrollView>


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
}); 