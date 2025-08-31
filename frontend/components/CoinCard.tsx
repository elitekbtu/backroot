import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CoinWithDistance } from '@/services/api';

interface CoinCardProps {
  coin: CoinWithDistance;
  onCollect?: () => void;
  canCollect?: boolean;
  isUpdating?: boolean;
}

export const CoinCard: React.FC<CoinCardProps> = ({ 
  coin, 
  onCollect, 
  canCollect = false,
  isUpdating = false 
}) => {
  const distanceAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isUpdating) {
      // Pulse animation when updating
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isUpdating]);

  const getDistanceColor = (distance?: number) => {
    if (!distance) return '#666';
    if (distance <= 50) return '#4CAF50'; // Green - can collect
    if (distance <= 200) return '#FF9800'; // Orange - close
    return '#F44336'; // Red - far
  };

  const getDistanceText = (distance?: number) => {
    if (!distance) return 'Unknown distance';
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const getDistanceIcon = (distance?: number) => {
    if (!distance) return 'location-outline';
    if (distance <= 50) return 'location'; // Green - can collect
    if (distance <= 200) return 'location-outline'; // Orange - close
    return 'location-outline'; // Red - far
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ scale: pulseAnimation }]
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={coin.is_collected ? "checkmark-circle" : "trophy"} 
            size={32} 
            color={coin.is_collected ? "#4CAF50" : "#FFD700"} 
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>
            {coin.name || `Achievement #${coin.id}`}
          </Text>
          {coin.description && (
            <Text style={styles.description} numberOfLines={2}>
              {coin.description}
            </Text>
          )}
          <View style={styles.pointsContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.pointsText}>{coin.points} points</Text>
          </View>
        </View>
        <View style={styles.status}>
          {coin.is_collected ? (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          ) : (
            <View style={styles.distanceContainer}>
              <Ionicons 
                name={getDistanceIcon(coin.distance_meters)} 
                size={16} 
                color={getDistanceColor(coin.distance_meters)} 
              />
              <Animated.Text 
                style={[
                  styles.distance, 
                  { color: getDistanceColor(coin.distance_meters) }
                ]}
              >
                {getDistanceText(coin.distance_meters)}
              </Animated.Text>
              {isUpdating && (
                <View style={styles.updatingIndicator}>
                  <Ionicons name="refresh" size={12} color="#007AFF" />
                </View>
              )}
            </View>
          )}
        </View>
      </View>
      
      {!coin.is_collected && canCollect && (
        <TouchableOpacity style={styles.collectButton} onPress={onCollect}>
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.collectButtonText}>Launch AR</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  status: {
    alignItems: 'flex-end',
  },
  distanceContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  updatingIndicator: {
    marginLeft: 8,
  },
  collectButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  collectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

