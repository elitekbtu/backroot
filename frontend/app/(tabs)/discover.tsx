import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
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
            <Ionicons name="search" size={48} color="#007AFF" />
            <Text style={styles.title}>Поиск</Text>
            <Text style={styles.subtitle}>
              Функция поиска находится в разработке
            </Text>
          </View>
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
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
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
}); 