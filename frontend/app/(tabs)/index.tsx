import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideUpAnimation = useRef(new Animated.Value(30)).current;
  const scaleAnimation = useRef(new Animated.Value(0.95)).current;

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
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleFeaturePress = async (feature: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Здесь можно добавить логику для каждой функции
    console.log(`Feature pressed: ${feature}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: 20 + insets.top,
            paddingBottom: 60 + insets.bottom,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ 
          opacity: fadeAnimation,
          transform: [{ scale: scaleAnimation }]
        }}>
          {/* Header */}
          <Animated.View style={[styles.header, { transform: [{ translateY: slideUpAnimation }] }]}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                Добро пожаловать{user?.first_name ? `, ${user.first_name}` : ''}!
              </Text>
              <Text style={styles.subtitleText}>
                Выберите нужную функцию
              </Text>
            </View>
          </Animated.View>

          {/* Features Grid */}
          <Animated.View style={[styles.featuresContainer, { transform: [{ translateY: slideUpAnimation }] }]}>
            <View style={styles.featuresGrid}>
              <TouchableOpacity 
                style={styles.featureCard}
                onPress={() => handleFeaturePress('security')}
                activeOpacity={0.8}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name="shield-checkmark" size={32} color="#007AFF" />
                </View>
                <Text style={styles.featureTitle}>Безопасность</Text>
                <Text style={styles.featureDescription}>
                  Проверка и управление безопасностью
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureCard}
                onPress={() => handleFeaturePress('analytics')}
                activeOpacity={0.8}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name="analytics" size={32} color="#34C759" />
                </View>
                <Text style={styles.featureTitle}>Аналитика</Text>
                <Text style={styles.featureDescription}>
                  Статистика и отчеты
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureCard}
                onPress={() => handleFeaturePress('settings')}
                activeOpacity={0.8}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name="settings" size={32} color="#FF9500" />
                </View>
                <Text style={styles.featureTitle}>Настройки</Text>
                <Text style={styles.featureDescription}>
                  Конфигурация системы
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureCard}
                onPress={() => handleFeaturePress('help')}
                activeOpacity={0.8}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name="help-circle" size={32} color="#AF52DE" />
                </View>
                <Text style={styles.featureTitle}>Помощь</Text>
                <Text style={styles.featureDescription}>
                  Справочная информация
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureCard}
                onPress={() => router.push('/ar-test')}
                activeOpacity={0.8}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name="camera" size={32} color="#FF3B30" />
                </View>
                <Text style={styles.featureTitle}>AR Опыт</Text>
                <Text style={styles.featureDescription}>
                  Дополненная реальность
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View style={[styles.quickActionsContainer, { transform: [{ translateY: slideUpAnimation }] }]}>
            <Text style={styles.sectionTitle}>Быстрые действия</Text>
            <View style={styles.quickActionsList}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleFeaturePress('scan')}
                activeOpacity={0.8}
              >
                <Ionicons name="scan" size={20} color="#007AFF" />
                <Text style={styles.quickActionText}>Сканировать</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleFeaturePress('backup')}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload" size={20} color="#34C759" />
                <Text style={styles.quickActionText}>Резервная копия</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleFeaturePress('update')}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color="#FF9500" />
                <Text style={styles.quickActionText}>Обновить</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => router.push('/ar-test')}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color="#AF52DE" />
                <Text style={styles.quickActionText}>AR Тест</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
    paddingTop: 20,
    paddingBottom: 60, // Базовый padding для tab bar
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickActionsList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
});
