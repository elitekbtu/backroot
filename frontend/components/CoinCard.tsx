import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CoinWithDistance } from '@/services/api';

interface CoinCardProps {
  coin: CoinWithDistance;
  onCollect?: () => void;
  canCollect?: boolean;
}

export const CoinCard: React.FC<CoinCardProps> = ({ coin, onCollect, canCollect = false }) => {
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

  return (
    <View style={styles.container}>
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
            {coin.map_name || `Achievement #${coin.id}`}
          </Text>
          {coin.map_description && (
            <Text style={styles.description} numberOfLines={2}>
              {coin.map_description}
            </Text>
          )}
        </View>
        <View style={styles.status}>
          {coin.is_collected ? (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          ) : (
            <Text style={[styles.distance, { color: getDistanceColor(coin.distance_meters) }]}>
              {getDistanceText(coin.distance_meters)}
            </Text>
          )}
        </View>
      </View>
      
      {!coin.is_collected && canCollect && (
        <TouchableOpacity style={styles.collectButton} onPress={onCollect}>
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.collectButtonText}>Launch AR</Text>
        </TouchableOpacity>
      )}
    </View>
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
  },
  status: {
    alignItems: 'flex-end',
  },
  distance: {
    fontSize: 16,
    fontWeight: '600',
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

