import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useLocation } from '../hooks/useLocation';

export default function LocationDemo() {
  const { location, error, loading, requestLocation } = useLocation();

  const showLocationInfo = () => {
    if (location) {
      Alert.alert(
        'Current Location',
        `Latitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\nAccuracy: ${location.accuracy?.toFixed(2)}m`
      );
    } else {
      Alert.alert('Location', 'Location not available');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Geolocation Demo</Text>
      
      <View style={styles.infoContainer}>
        {loading && <Text style={styles.loading}>Getting location...</Text>}
        
        {error && <Text style={styles.error}>{error}</Text>}
        
        {location && (
          <View>
            <Text style={styles.label}>Current Location:</Text>
            <Text style={styles.coordinate}>Lat: {location.latitude.toFixed(6)}</Text>
            <Text style={styles.coordinate}>Lon: {location.longitude.toFixed(6)}</Text>
            {location.accuracy && (
              <Text style={styles.accuracy}>Accuracy: {location.accuracy.toFixed(2)}m</Text>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title="Refresh Location" onPress={requestLocation} />
        <Button title="Show Details" onPress={showLocationInfo} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loading: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
  error: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  coordinate: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#666',
    marginBottom: 5,
  },
  accuracy: {
    fontSize: 14,
    color: '#32D74B',
    marginTop: 5,
  },
  buttonContainer: {
    gap: 10,
  },
});






