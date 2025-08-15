import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { View, Text, Animated, StatusBar, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export default function IndexScreen() {
  const { isAuthenticated, loading, user } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideUpAnimation = useRef(new Animated.Value(30)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations with staggered timing for better effect
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(slideUpAnimation, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (!loading && shouldRedirect) {
      const timer = setTimeout(() => {
        if (isAuthenticated && user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/welcome');
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, user, shouldRedirect]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShouldRedirect(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Animated.View style={[styles.content, { 
        opacity: fadeAnimation,
        transform: [{ scale: scaleAnimation }]
      }]}>
        {/* App Icon - Flower with rotation */}
        <Animated.View style={[
          styles.logoContainer, 
          { 
            transform: [
              { translateY: slideUpAnimation },
              {
                rotate: logoRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }
            ] 
          }
        ]}>
          <Image 
            source={require('@/assets/images/flower.png')} 
            style={styles.flowerLogo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App Name with staggered animation */}
        <Animated.View style={{ 
          transform: [{ translateY: slideUpAnimation }],
          opacity: fadeAnimation
        }}>
          <Text style={styles.appName}>Back2Root</Text>
          <Text style={styles.subtitle}>Безопасная аутентификация</Text>
        </Animated.View>
      </Animated.View>

      {/* Next Button at the bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Далее</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    padding: 20,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  flowerLogo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
  },
}); 