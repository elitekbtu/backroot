import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Achievement {
  id: number;
  name: string;
  icon: string;
  points: number;
  distance_meters?: number;
}

interface ARGameScreenProps {
  achievement: Achievement;
  onCollect: () => void;
  onClose: () => void;
}

export default function ARGameScreen({ achievement, onCollect, onClose }: ARGameScreenProps) {
  const [gameState, setGameState] = useState<'loading' | 'ready' | 'playing' | 'success' | 'failed'>('loading');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState<Array<{id: number, x: number, y: number, collected: boolean}>>([]);

  useEffect(() => {
    // Симуляция загрузки AR
    setTimeout(() => {
      setGameState('ready');
      initializeGame();
    }, 2000);
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      endGame();
    }
  }, [gameState, timeLeft]);

  const initializeGame = () => {
    // Создаем случайные цели для сбора
    const newTargets = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 300 + 50,
      y: Math.random() * 400 + 100,
      collected: false
    }));
    setTargets(newTargets);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
  };

  const collectTarget = (targetId: number) => {
    setTargets(prev => 
      prev.map(target => 
        target.id === targetId 
          ? { ...target, collected: true }
          : target
      )
    );
    setScore(prev => prev + 10);

    // Проверяем, все ли цели собраны
    const updatedTargets = targets.map(target => 
      target.id === targetId ? { ...target, collected: true } : target
    );
    
    if (updatedTargets.every(target => target.collected)) {
      setGameState('success');
    }
  };

  const endGame = () => {
    if (score >= 30) { // Минимум 3 цели из 5
      setGameState('success');
    } else {
      setGameState('failed');
    }
  };

  const handleSuccess = () => {
    Alert.alert(
      'Поздравляем! 🎉',
      `Вы собрали ${achievement.name}!\nНабрано очков: ${score}`,
      [
        { text: 'Отлично!', onPress: onCollect }
      ]
    );
  };

  const renderGameContent = () => {
    switch (gameState) {
      case 'loading':
        return (
          <View style={styles.centerContent}>
            <Ionicons name="camera" size={64} color="#007AFF" />
            <Text style={styles.loadingText}>Инициализация AR камеры...</Text>
          </View>
        );

      case 'ready':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.instructions}>
              Соберите виртуальные объекты чтобы получить этот ачивмент!
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>Начать игру</Text>
            </TouchableOpacity>
          </View>
        );

      case 'playing':
        return (
          <View style={styles.gameArea}>
            <View style={styles.gameHeader}>
              <Text style={styles.scoreText}>Очки: {score}</Text>
              <Text style={styles.timerText}>Время: {timeLeft}с</Text>
            </View>
            
            <View style={styles.arSpace}>
              {targets.map(target => (
                !target.collected && (
                  <TouchableOpacity
                    key={target.id}
                    style={[
                      styles.target,
                      { left: target.x, top: target.y }
                    ]}
                    onPress={() => collectTarget(target.id)}
                  >
                    <Text style={styles.targetIcon}>💎</Text>
                  </TouchableOpacity>
                )
              ))}
            </View>
            
            <Text style={styles.instruction}>
              Нажимайте на алмазы чтобы собрать их!
            </Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.centerContent}>
            <Ionicons name="trophy" size={64} color="#FFD700" />
            <Text style={styles.successTitle}>Успех!</Text>
            <Text style={styles.successText}>
              Вы успешно собрали {achievement.name}!
            </Text>
            <Text style={styles.pointsText}>+{achievement.points} очков</Text>
            <TouchableOpacity style={styles.collectButton} onPress={handleSuccess}>
              <Text style={styles.collectButtonText}>Собрать награду</Text>
            </TouchableOpacity>
          </View>
        );

      case 'failed':
        return (
          <View style={styles.centerContent}>
            <Ionicons name="sad" size={64} color="#FF3B30" />
            <Text style={styles.failTitle}>Не удалось</Text>
            <Text style={styles.failText}>
              Попробуйте еще раз! Нужно набрать минимум 30 очков.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={startGame}>
              <Text style={styles.retryButtonText}>Попробовать снова</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AR Achievement</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderGameContent()}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  achievementIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  achievementName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  gameArea: {
    flex: 1,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  arSpace: {
    flex: 1,
    position: 'relative',
  },
  target: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  targetIcon: {
    fontSize: 24,
  },
  instruction: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 32,
  },
  collectButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  collectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  failTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  failText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});






