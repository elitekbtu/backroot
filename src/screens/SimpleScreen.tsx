import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SimpleAR from '../components/SimpleAR';
import { useLocation } from '../hooks/useLocation';
import { LocationService } from '../services/LocationService';
import { Achievement } from '../types';

// Sample achievements with real Astana coordinates
const sampleAchievements: Achievement[] = [
  { 
    id: 1, 
    name: 'ADD table tennis Center Astana', 
    icon: '🏓', 
    points: 50,
    latitude: 51.10441,
    longitude: 71.40153,
  },
  { 
    id: 2, 
    name: 'Expo 2017', 
    icon: '🏛️', 
    points: 100,
    latitude: 51.0925,
    longitude: 71.4075,
  },
  { 
    id: 3, 
    name: 'Baiterek Tower', 
    icon: '🗼', 
    points: 75,
    latitude: 51.1283,
    longitude: 71.4306,
  },
  { 
    id: 4, 
    name: 'Khan Shatyr', 
    icon: '⛺', 
    points: 60,
    latitude: 51.1327,
    longitude: 71.4054,
  },
];

export default function SimpleScreen() {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAR, setShowAR] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const { location, error: locationError, loading: locationLoading, requestLocation } = useLocation();

  // Calculate distances and update achievements
  useEffect(() => {
    if (location) {
      const achievementsWithDistance = sampleAchievements.map(achievement => ({
        ...achievement,
        distance: LocationService.calculateDistance(
          location.latitude,
          location.longitude,
          achievement.latitude,
          achievement.longitude
        ),
      }));
      
      // Sort by distance (closest first)
      achievementsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setAchievements(achievementsWithDistance);
    } else {
      setAchievements(sampleAchievements);
    }
  }, [location]);

  const handleCollect = () => {
    if (!selectedAchievement) return;
    
    if (!location) {
      Alert.alert('Error', 'Location not available. Please enable location services.');
      return;
    }
    
    const distance = selectedAchievement.distance || 0;
    if (distance > 50) {
      Alert.alert(
        'Too Far Away', 
        `You need to be within 50 meters to collect this achievement. You are ${Math.round(distance)}m away.`
      );
      return;
    }
    
    Alert.alert('Success', `${selectedAchievement.name} collected! 🎉\n+${selectedAchievement.points} points`);
    setShowAR(false);
    setSelectedAchievement(null);
  };

  const handleClose = () => {
    setShowAR(false);
    setSelectedAchievement(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await requestLocation();
    setRefreshing(false);
  };

  const formatDistance = (distance?: number): string => {
    if (!distance) return '';
    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    } else {
      return `${(distance / 1000).toFixed(1)}km away`;
    }
  };

  const canCollect = (achievement: Achievement): boolean => {
    return !!(location && achievement.distance !== undefined && achievement.distance <= 50);
  };

  // Show location error screen
  if (locationError && !location) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❓</Text>
          <Text style={styles.errorTitle}>Location Error</Text>
          <Text style={styles.errorMessage}>{locationError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={requestLocation}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AR Achievements</Text>
        <Text style={styles.subtitle}>
          {location 
            ? `${achievements.length} achievements nearby` 
            : 'Getting your location...'}
        </Text>
        {locationLoading && (
          <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
        )}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {achievements.map((achievement) => (
          <TouchableOpacity
            key={achievement.id}
            style={[
              styles.card,
              canCollect(achievement) && styles.cardCollectable
            ]}
            onPress={() => {
              setSelectedAchievement(achievement);
              setShowAR(true);
            }}
          >
            <Text style={styles.icon}>{achievement.icon}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.name}>{achievement.name}</Text>
              <Text style={styles.points}>{achievement.points} points</Text>
              {achievement.distance !== undefined && (
                <Text style={[
                  styles.distance,
                  canCollect(achievement) && styles.distanceClose
                ]}>
                  {formatDistance(achievement.distance)}
                  {canCollect(achievement) && ' ✨'}
                </Text>
              )}
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}
        
        {achievements.length === 0 && !locationLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No achievements found</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAR}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {selectedAchievement && (
          <SimpleAR
            title={selectedAchievement.name}
            icon={selectedAchievement.icon}
            onCollect={handleCollect}
            onClose={handleClose}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loader: {
    marginTop: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardCollectable: {
    borderWidth: 2,
    borderColor: '#32D74B',
    backgroundColor: '#F0FFF4',
  },
  icon: {
    fontSize: 40,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  points: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '500',
    marginBottom: 4,
  },
  distance: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  distanceClose: {
    color: '#32D74B',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
