import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, Cylinder, Ring } from '@react-three/drei';
import { Mesh } from 'three';
import type { CoinResponse } from '../types/coin';

interface Coin3DProps {
  coin: CoinResponse;
  position: [number, number, number];
  onClick?: () => void;
}

export const Coin3D: React.FC<Coin3DProps> = ({ coin, position, onClick }) => {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Optimized animation with reduced frequency
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Slower rotation for better performance
    meshRef.current.rotation.y += delta * 0.5;
    
    // Smooth scaling on hover with lerp
    const targetScale = hovered ? 1.15 : (coin.ar_scale || 1);
    meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as any, delta * 3);
    
    // Glow animation only when hovered
    if (glowRef.current && hovered) {
      glowRef.current.rotation.y -= delta * 0.3;
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 0.95;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  // Цвета в зависимости от символа монеты
  const getCoinColor = (symbol: string) => {
    const colors: Record<string, string> = {
      'BTC': '#F7931A',
      'ETH': '#627EEA',
      'BNB': '#F3BA2F',
      'ADA': '#0033AD',
      'SOL': '#9945FF',
      'DOT': '#E6007A',
    };
    return colors[symbol] || '#FFD700';
  };

  const baseColor = getCoinColor(coin.symbol);
  const hoverColor = hovered ? '#FFFFFF' : baseColor;

  return (
    <group position={position}>
      {/* Основная монета */}
      <Cylinder
        ref={meshRef}
        args={[1, 1, 0.15, 32]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hoverColor}
          metalness={0.9}
          roughness={0.1}
          emissive={hovered ? baseColor : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </Cylinder>
      
      {/* Ободок монеты */}
      <Ring args={[0.95, 1.05, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={hovered ? '#FFFFFF' : '#C0C0C0'}
          metalness={1}
          roughness={0}
        />
      </Ring>
      
      {/* Текст символа монеты (лицевая сторона) */}
      <Text
        position={[0, 0, 0.08]}
        fontSize={0.35}
        color={hovered ? baseColor : '#FFFFFF'}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap"
      >
        {coin.symbol}
      </Text>
      
      {/* Название монеты (обратная сторона) */}
      <Text
        position={[0, 0, -0.08]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.15}
        color={hovered ? baseColor : '#FFFFFF'}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        font="https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap"
      >
        {coin.name.length > 12 ? coin.name.substring(0, 12) + '...' : coin.name}
      </Text>
      
      {/* Свечение при наведении */}
      {hovered && (
        <Sphere ref={glowRef} args={[1.4, 16, 16]} position={[0, 0, 0]}>
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.15}
          />
        </Sphere>
      )}
      
      {/* Частицы вокруг монеты при наведении */}
      {hovered && (
        <>
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 1.8;
            return (
              <Sphere
                key={i}
                args={[0.03, 8, 8]}
                position={[
                  Math.cos(angle) * radius,
                  Math.sin(angle) * radius,
                  Math.sin(Date.now() * 0.001 + i) * 0.2
                ]}
              >
                <meshBasicMaterial
                  color={baseColor}
                  transparent
                  opacity={0.8}
                />
              </Sphere>
            );
          })}
        </>
      )}
    </group>
  );
};

export default Coin3D;
