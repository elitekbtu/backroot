import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, Cylinder, Ring } from '@react-three/drei';
import { Mesh } from 'three';
import type { CoinResponse } from '../types/coin';

interface Coin3DProps {
  coin: CoinResponse;
  position: [number, number, number];
  onClick?: () => void;
}

// Optimized coin colors based on symbol
const getCoinColor = (symbol: string): string => {
  const colors: Record<string, string> = {
    'BTC': '#F7931A',
    'ETH': '#627EEA',
    'BNB': '#F3BA2F',
    'ADA': '#0033AD',
    'SOL': '#9945FF',
    'DOT': '#E6007A',
    'MATIC': '#8247E5',
    'AVAX': '#E84142',
    'LINK': '#2A5ADA',
    'UNI': '#FF007A',
    'ATOM': '#2E3148',
    'NEAR': '#00D4AA',
    'FTM': '#1969FF',
    'ALGO': '#000000',
    'VET': '#15BDFF',
    'ICP': '#29B6F6',
    'FIL': '#0090FF',
    'TRX': '#FF060A',
    'XLM': '#7D00FF',
    'XRP': '#23292F',
  };
  return colors[symbol] || '#FFD700';
};

// Memoized coin component for better performance
export const Coin3D: React.FC<Coin3DProps> = React.memo(({ coin, position, onClick }) => {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Memoize colors to avoid recalculation
  const colors = useMemo(() => {
    const baseColor = getCoinColor(coin.symbol);
    return {
      base: baseColor,
      hover: '#FFFFFF',
      glow: baseColor,
      ring: '#C0C0C0'
    };
  }, [coin.symbol]);

  // Optimized animation with reduced frequency
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Smooth rotation - slower on mobile for better performance
    const rotationSpeed = window.innerWidth < 768 ? 0.1 : 0.3;
    meshRef.current.rotation.y += delta * rotationSpeed;
    
    // Hover scaling with smooth interpolation
    const targetScale = hovered ? 1.2 : (coin.ar_scale || 1);
    const currentScale = meshRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * delta * 5;
    meshRef.current.scale.setScalar(newScale);
    
    // Click animation
    if (clicked) {
      const clickScale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
      meshRef.current.scale.setScalar(newScale * clickScale);
    }
    
    // Glow animation only when hovered - reduced on mobile
    if (glowRef.current && hovered) {
      glowRef.current.rotation.y -= delta * 0.2;
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.9;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 200);
    onClick?.();
  };

  const handlePointerOver = () => {
    setHovered(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
  };

  return (
    <group position={position}>
      {/* Main coin body */}
      <Cylinder
        ref={meshRef}
        args={[1, 1, 0.2, 16]} // Reduced segments for better performance
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={hovered ? colors.hover : colors.base}
          metalness={0.8}
          roughness={0.2}
          emissive={hovered ? colors.base : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </Cylinder>
      
      {/* Coin edge/rim */}
      <Ring args={[0.95, 1.05, 16]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={hovered ? colors.hover : colors.ring}
          metalness={1}
          roughness={0.1}
        />
      </Ring>
      
      {/* Symbol text (front side) */}
      <Text
        position={[0, 0, 0.11]}
        fontSize={0.4}
        color={hovered ? colors.base : '#FFFFFF'}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2"
        maxWidth={1.8}
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {coin.symbol}
      </Text>
      
      {/* Name text (back side) */}
      <Text
        position={[0, 0, -0.11]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.12}
        color={hovered ? colors.base : '#FFFFFF'}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.6}
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {coin.name.length > 10 ? coin.name.substring(0, 10) + '...' : coin.name}
      </Text>
      
      {/* Glow effect when hovered */}
      {hovered && (
        <Sphere ref={glowRef} args={[1.3, 12, 12]} position={[0, 0, 0]}>
          <meshBasicMaterial
            color={colors.glow}
            transparent
            opacity={0.2}
          />
        </Sphere>
      )}
      
      {/* Floating particles when hovered */}
      {hovered && (
        <>
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 1.6;
            const time = Date.now() * 0.001;
            return (
              <Sphere
                key={i}
                args={[0.02, 6, 6]}
                position={[
                  Math.cos(angle + time) * radius,
                  Math.sin(angle + time) * radius,
                  Math.sin(time * 2 + i) * 0.1
                ]}
              >
                <meshBasicMaterial
                  color={colors.glow}
                  transparent
                  opacity={0.7}
                />
              </Sphere>
            );
          })}
        </>
      )}
    </group>
  );
});

Coin3D.displayName = 'Coin3D';

export default Coin3D;