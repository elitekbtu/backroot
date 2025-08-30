import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import V2VComponent from '../../components/V2VComponent';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideUpAnimation = useRef(new Animated.Value(30)).current;
  const [showV2V, setShowV2V] = useState(false);

  useEffect(() => {
    if (!showV2V) {
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
    }
  }, [showV2V]);

  const handleCreatePress = () => {
    setShowV2V(true);
  };

  const handleCloseV2V = () => {
    setShowV2V(false);
  };

  if (showV2V) {
    return (
      <V2VComponent
        userId="demo_user_123"
        serverUrl="ws://localhost:8000"
        onClose={handleCloseV2V}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: 60 + insets.bottom,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ 
          opacity: fadeAnimation,
          transform: [{ translateY: slideUpAnimation }]
        }}>
          <View style={styles.header}>
            <Ionicons name="add-circle" size={48} color="#007AFF" />
            <Text style={styles.title}>Создать</Text>
            <Text style={styles.subtitle}>
              Нажмите на кнопку ниже, чтобы начать голосовой чат
            </Text>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreatePress}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="mic" size={32} color="white" />
              <Text style={styles.buttonText}>Начать V2V Чат</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 60, // Базовый padding для tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
}); 