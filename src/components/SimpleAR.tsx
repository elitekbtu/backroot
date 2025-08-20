import React, { useState } from 'react';
import {
  ViroARScene,
  ViroText,
  ViroConstants,
  ViroBox,
  ViroMaterials,
  ViroAmbientLight,
  ViroARPlaneSelector,
  ViroNode,
} from '@reactvision/react-viro';
import { StyleSheet } from 'react-native';

interface SimpleARProps {
  title: string;
  icon: string;
  onCollect: () => void;
  onClose: () => void;
}

export default function SimpleAR({ title, icon, onCollect, onClose }: SimpleARProps) {
  const [status, setStatus] = useState('Initializing AR...');
  const [isVisible, setIsVisible] = useState(false);

  const onInitialized = (state: any) => {
    if (state === ViroConstants.TRACKING_NORMAL) {
      setStatus('Point camera at a surface');
    } else if (state === ViroConstants.TRACKING_NONE) {
      setStatus('No tracking available');
    }
  };

  const onPlaneSelected = () => {
    setIsVisible(true);
    setStatus('Tap the cube to collect!');
  };

  const handleCollect = () => {
    onCollect();
    setStatus('Collected! 🎉');
  };

  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      <ViroAmbientLight color="#ffffff" intensity={200} />
      
      <ViroARPlaneSelector onPlaneSelected={onPlaneSelected}>
        <ViroNode position={[0, 0, -1]}>
          {isVisible && (
            <>
              <ViroText
                text={icon}
                scale={[0.4, 0.4, 0.4]}
                position={[0, 0.5, 0]}
                style={styles.icon}
              />
              
              <ViroText
                text={title}
                scale={[0.3, 0.3, 0.3]}
                position={[0, 0.2, 0]}
                style={styles.title}
              />
              
              <ViroBox
                position={[0, -0.2, 0]}
                scale={[0.2, 0.2, 0.2]}
                materials={["goldMaterial"]}
                onClick={handleCollect}
              />
              
              <ViroText
                text="✕"
                scale={[0.2, 0.2, 0.2]}
                position={[0.5, 0.5, 0]}
                style={styles.closeButton}
                onClick={onClose}
              />
            </>
          )}
        </ViroNode>
      </ViroARPlaneSelector>

      <ViroText
        text={status}
        scale={[0.4, 0.4, 0.4]}
        position={[0, -1, -1]}
        style={styles.status}
      />
    </ViroARScene>
  );
}

ViroMaterials.createMaterials({
  goldMaterial: {
    diffuseColor: "#FFD700",
    lightingModel: "PBR",
    metalness: 0.8,
    roughness: 0.2,
  },
});

const styles = StyleSheet.create({
  icon: {
    fontFamily: 'Arial',
    fontSize: 50,
    color: '#FFD700',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Arial',
    fontSize: 24,
    color: '#ffffff',
    textAlignVertical: 'center',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  closeButton: {
    fontFamily: 'Arial',
    fontSize: 20,
    color: '#ffffff',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  status: {
    fontFamily: 'Arial',
    fontSize: 16,
    color: '#ffffff',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
});
