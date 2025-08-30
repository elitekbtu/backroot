import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 36 + insets.bottom, // Уменьшили в 2.5 раза с 90 до 36
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 4,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={30} 
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}>
              <Tabs.Screen
          name="index"
          options={{
            title: 'Главная',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                name="home" 
                color={color} 
                focused={focused}
              />
            ),
          }}
        />
              <Tabs.Screen
          name="discover"
          options={{
            title: 'Поиск',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                name="search" 
                color={color} 
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Создать',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                name="mic" 
                color={color} 
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Уведомления',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                name="bell" 
                color={color} 
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Профиль',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                name="user" 
                color={color} 
                focused={focused}
              />
            ),
          }}
        />
    </Tabs>
  );
}

const getIconName = (name: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    'home': focused ? 'home' : 'home-outline',
    'search': focused ? 'search' : 'search-outline',
    'mic': 'mic',
    'bell': focused ? 'notifications' : 'notifications-outline',
    'user': focused ? 'person' : 'person-outline',
  };
  
  return iconMap[name] || 'help-outline';
};

const TabIcon = ({ name, color, focused }: any) => {
  return (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconBackground,
        focused && styles.activeIconBackground,
        { backgroundColor: focused ? color + '20' : 'transparent' }
      ]}>
        <Ionicons 
          size={20} 
          name={getIconName(name, focused)} 
          color={color} 
        />
      </View>
      {focused && (
        <View style={[
          styles.activeIndicator,
          { backgroundColor: color }
        ]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconBackground: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBackground: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});