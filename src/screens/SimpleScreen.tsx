import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SimpleAR from '../components/SimpleAR';

const achievements = [
  { id: 1, name: 'Expo 2017', icon: '🏛️', points: 100 },
  { id: 2, name: 'NYC Skyline', icon: '🏙️', points: 50 },
  { id: 3, name: 'Central Park', icon: '🌳', points: 25 },
];

export default function SimpleScreen() {
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [showAR, setShowAR] = useState(false);

  const handleCollect = () => {
    Alert.alert('Success', `${selectedAchievement?.name} collected! 🎉`);
    setShowAR(false);
    setSelectedAchievement(null);
  };

  const handleClose = () => {
    setShowAR(false);
    setSelectedAchievement(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AR Achievements</Text>
        <Text style={styles.subtitle}>Tap to launch AR experience</Text>
      </View>

      <View style={styles.content}>
        {achievements.map((achievement) => (
          <TouchableOpacity
            key={achievement.id}
            style={styles.card}
            onPress={() => {
              setSelectedAchievement(achievement);
              setShowAR(true);
            }}
          >
            <Text style={styles.icon}>{achievement.icon}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.name}>{achievement.name}</Text>
              <Text style={styles.points}>{achievement.points} points</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

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
  },
  arrow: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
