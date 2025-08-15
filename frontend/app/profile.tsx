import { useRef, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideUpAnimation = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    Alert.alert(
      'Выход из аккаунта',
      'Вы уверены, что хотите выйти?',
      [
        { 
          text: 'Отмена', 
          style: 'cancel',
          onPress: () => Haptics.selectionAsync()
        },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Используем setTimeout для избежания проблем с состоянием
              setTimeout(() => {
                router.replace('/welcome');
              }, 100);
            } catch (error) {
              console.error('Logout error:', error);
              // В случае ошибки все равно перенаправляем
              setTimeout(() => {
                router.replace('/welcome');
              }, 100);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      router.replace('/welcome');
    }
  }, [isAuthenticated, user, loading]);

  // Показываем загрузку пока проверяется аутентификация
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const InfoRow = ({ 
    icon, 
    label, 
    value,
    last = false
  }: { 
    icon: string; 
    label: string; 
    value: string;
    last?: boolean;
  }) => (
    <View style={styles.rowContainer}>
      <View style={[styles.row, !last && styles.rowWithBorder]}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon as any} size={20} color="#636366" />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowValue}>{value}</Text>
        </View>
        {!last && <View style={styles.rowSeparator} />}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnimation }}>
          {/* Header */}
          <Animated.View style={[styles.header, { transform: [{ translateY: slideUpAnimation }] }]}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.name}>
              {user.first_name || user.username}
            </Text>
            
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: user.is_active ? '#34C759' : '#FF3B30' }]} />
              <Text style={styles.statusText}>
                {user.is_active ? 'Активный' : 'Неактивный'}
              </Text>
            </View>
          </Animated.View>

          {/* Profile Section */}
          <Animated.View style={[styles.section, { transform: [{ translateY: slideUpAnimation }] }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Информация</Text>
            </View>
            <View style={styles.sectionContent}>
              <InfoRow
                icon="person"
                label="Имя пользователя"
                value={user.username}
              />
              {user.first_name && (
                <InfoRow
                  icon="person-outline"
                  label="Имя"
                  value={user.first_name}
                />
              )}
              {user.last_name && (
                <InfoRow
                  icon="people-outline"
                  label="Фамилия"
                  value={user.last_name}
                />
              )}
              <InfoRow
                icon="card"
                label="ID пользователя"
                value={`#${user.id}`}
                last
              />
            </View>
          </Animated.View>

          {/* Actions Section */}
          <Animated.View style={[styles.section, { transform: [{ translateY: slideUpAnimation }] }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Действия</Text>
            </View>
            <View style={styles.sectionContent}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  Haptics.selectionAsync();
                  Alert.alert('Настройки', 'Функция в разработке');
                }}
              >
                <Ionicons name="settings-outline" size={22} color="#007AFF" />
                <Text style={styles.actionButtonText}>Настройки</Text>
                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
              </TouchableOpacity>
              
              <View style={styles.separator} />
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.destructiveButton]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                <Text style={[styles.actionButtonText, styles.destructiveText]}>Выйти</Text>
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
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '500',
    color: '#636366',
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#636366',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#636366',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  rowContainer: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  rowWithBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    color: '#636366',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 17,
    color: '#1C1C1E',
    fontWeight: '400',
  },
  rowSeparator: {
    position: 'absolute',
    left: 60,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 17,
    color: '#007AFF',
    marginLeft: 16,
  },
  destructiveButton: {
    backgroundColor: '#FFFFFF',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 60,
  },
});