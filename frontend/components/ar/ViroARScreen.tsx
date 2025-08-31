import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  ViroARScene,
  ViroText,
  ViroConstants,
  ViroBox,
  ViroMaterials,
  ViroNode,
  ViroARSceneNavigator,
  ViroImage,
} from '@reactvision/react-viro';

// AR Scene Component
const ARScene = () => {
  const [text, setText] = useState('Initializing AR...');

  const onInitialized = (state: any, reason: any) => {
    if (state === ViroConstants.TRACKING_NORMAL) {
      setText('AR Ready! Tap to place objects');
    } else if (state === ViroConstants.TRACKING_NONE) {
      setText('No tracking available');
    }
  };

  const onTap = () => {
    setText('Object placed!');
  };

  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      <ViroNode position={[0, -1, -1]} dragType="FixedToWorld" onDrag={() => {}}>
        <ViroBox
          position={[0, 0.5, 0]}
          scale={[0.3, 0.3, 0.1]}
          materials={["grid"]}
          onTap={onTap}
        />
        <ViroText
          text={text}
          scale={[0.5, 0.5, 0.5]}
          position={[0, 0.8, 0]}
          style={styles.helloWorldTextStyle}
        />
      </ViroNode>
    </ViroARScene>
  );
};

// Materials
ViroMaterials.createMaterials({
  grid: {
    diffuseTexture: require('../../assets/images/flower.png'),
  },
});

const styles = StyleSheet.create({
  helloWorldTextStyle: {
    fontFamily: 'Arial',
    fontSize: 30,
    color: '#ffffff',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
});

interface ViroARScreenProps {
  onClose: () => void;
}

export default function ViroARScreen({ onClose }: ViroARScreenProps) {
  const [arState, setArState] = useState<'loading' | 'ready' | 'error'>('loading');

  const handleARError = (error: any) => {
    console.error('AR Error:', error);
    setArState('error');
    Alert.alert('AR Error', 'Failed to initialize AR. Please check camera permissions.');
  };

  const handleARReady = () => {
    setArState('ready');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AR Experience</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.arContainer}>
        {arState === 'error' ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
            <Text style={styles.errorText}>AR не поддерживается на этом устройстве</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setArState('loading')}>
              <Text style={styles.retryButtonText}>Попробовать снова</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ViroARSceneNavigator
            autofocus={true}
            initialScene={{
              scene: ARScene,
            }}
            style={styles.arView}
            onError={handleARError}
            onLoadEnd={handleARReady}
          />
        )}
      </View>

      <View style={styles.controls}>
        <Text style={styles.instructionText}>
          Наведите камеру на поверхность и нажмите для размещения объектов
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
  placeholder: {
    width: 40,
  },
  arContainer: {
    flex: 1,
  },
  arView: {
    flex: 1,
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
