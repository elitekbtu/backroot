import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const AR: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // AR Button
    document.body.appendChild(XRButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // Lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

    // Load Coin Model
    const loader = new GLTFLoader();
    loader.load('/models/coin.glb', gltf => {
      const coin = gltf.scene;
      coin.scale.set(0.2, 0.2, 0.2);
      scene.add(coin);
    });

    // Animation Loop
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // Handle Resize
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement.parentNode) containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />;
};

export default AR;