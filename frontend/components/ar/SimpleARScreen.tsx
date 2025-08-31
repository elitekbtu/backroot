import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface SimpleARScreenProps {
  onClose: () => void;
}

export default function SimpleARScreen({ onClose }: SimpleARScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [arObjects, setArObjects] = useState<Array<{
    id: number;
    x: number;
    y: number;
    type: 'coin' | 'treasure';
    collected: boolean;
  }>>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      setHasPermission(cameraStatus === 'granted' && locationStatus === 'granted');
      
      if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
        Alert.alert(
          'Разрешения требуются',
          'Для работы AR необходимо разрешение на камеру и геолокацию'
        );
      }
    })();
  }, []);

  useEffect(() => {
    if (gameStarted) {
      // Создаем случайные AR объекты
      const objects = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 200) + 100,
        type: Math.random() > 0.5 ? 'coin' : 'treasure' as const,
        collected: false,
      }));
      setArObjects(objects);
    }
  }, [gameStarted]);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
  };

  const collectObject = (objectId: number) => {
    setArObjects(prev => 
      prev.map(obj => 
        obj.id === objectId 
          ? { ...obj, collected: true }
          : obj
      )
    );
    
    const object = arObjects.find(obj => obj.id === objectId);
    const points = object?.type === 'treasure' ? 20 : 10;
    setScore(prev => prev + points);
  };

  const handleScreenTap = (event: any) => {
    if (!gameStarted) return;
    
    const { locationX, locationY } = event.nativeEvent;
    
    // Проверяем, попали ли мы по объекту
    arObjects.forEach(object => {
      if (!object.collected) {
        const distance = Math.sqrt(
          Math.pow(locationX - object.x, 2) + Math.pow(locationY - object.y, 2)
        );
        
        if (distance < 50) { // Радиус клика
          collectObject(object.id);
        }
      }
    });
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Запрос разрешений...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
          <Text style={styles.errorText}>Нет доступа к камере</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onClose}>
            <Text style={styles.retryButtonText}>Вернуться</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AR Игра</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={cameraType}
          onTouchEnd={handleScreenTap}
        >
          {gameStarted && (
            <View style={styles.arOverlay}>
              {arObjects.map(object => (
                !object.collected && (
                  <TouchableOpacity
                    key={object.id}
                    style={[
                      styles.arObject,
                      {
                        left: object.x - 25,
                        top: object.y - 25,
                      },
                    ]}
                    onPress={() => collectObject(object.id)}
                  >
                    <Ionicons
                      name={object.type === 'coin' ? 'logo-bitcoin' : 'diamond'}
                      size={30}
                      color={object.type === 'coin' ? '#FFD700' : '#FF6B6B'}
                    />
                  </TouchableOpacity>
                )
              ))}
            </View>
          )}
        </Camera>
      </View>

      {!gameStarted && (
        <View style={styles.startOverlay}>
          <View style={styles.startContent}>
            <Ionicons name="camera" size={80} color="#007AFF" />
            <Text style={styles.startTitle}>AR Игра</Text>
            <Text style={styles.startDescription}>
              Нажмите на объекты в AR, чтобы собрать их!
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>Начать игру</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.controls}>
        <Text style={styles.instructionText}>
          {gameStarted 
            ? 'Нажимайте на объекты для сбора очков' 
            : 'Нажмите "Начать игру" для старта'
          }
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreContainer: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  arObject: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  startOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startContent: {
    alignItems: 'center',
    padding: 40,
  },
  startTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  startDescription: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 40,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
