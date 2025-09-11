import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { LipSyncData } from '../types/v2v';

interface TalkingHeadProps {
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  lipSyncData?: LipSyncData | null;
  isPlaying?: boolean;
  avatarUrl?: string;
  mood?: string;
}

// Simplified TalkingHead implementation based on the GitHub repository
class TalkingHead3D {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private avatar: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private clock: THREE.Clock;
  private isReady = false;
  // private _currentMood = 'neutral';
  private isPlaying = false;
  private currentLipSyncData: LipSyncData | null = null;
  private lipSyncStartTime = 0;
  private loader: GLTFLoader;
  private mouthMesh: THREE.Mesh | null = null;
  private headMesh: THREE.Mesh | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.loader = new GLTFLoader();
    
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 3);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    container.appendChild(this.renderer.domElement);
    
    // Lighting
    this.setupLighting();
    
    // Create placeholder avatar
    this.createPlaceholderAvatar();
    
    // Start render loop
    this.animate();
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);
    
    // Point light for better face illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, 2, 2);
    this.scene.add(pointLight);
  }

  private createPlaceholderAvatar() {
    // Create a simple head placeholder
    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffdbac,
      transparent: true,
      opacity: 0.9
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    head.castShadow = true;
    head.receiveShadow = true;
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.7, 0.4);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.7, 0.4);
    
    // Mouth placeholder
    const mouthGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const mouthMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 1.5, 0.4);
    mouth.scale.set(1, 0.3, 1);
    
    // Create avatar group
    this.avatar = new THREE.Group();
    this.avatar.add(head);
    this.avatar.add(leftEye);
    this.avatar.add(rightEye);
    this.avatar.add(mouth);
    
    this.scene.add(this.avatar);
    this.isReady = true;
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // Update lip sync
    if (this.isPlaying && this.currentLipSyncData) {
      this.updateLipSync(deltaTime);
    }
    
    // Update avatar animations
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    
    // Gentle head movement
    if (this.avatar) {
      this.avatar.rotation.y = Math.sin(this.clock.getElapsedTime() * 0.5) * 0.1;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  private updateLipSync(_deltaTime: number) {
    if (!this.currentLipSyncData || !this.avatar) return;
    
    const currentTime = this.clock.getElapsedTime() - this.lipSyncStartTime;
    
    // Find current phoneme based on timing
    const timing = this.currentLipSyncData.timing;
    let currentPhoneme = 'A'; // Default open mouth
    
    for (const t of timing) {
      if (currentTime >= t.start_time && currentTime <= t.start_time + t.duration) {
        currentPhoneme = t.phoneme;
        break;
      }
    }
    
    // Apply lip sync to mouth
    const mouth = this.avatar.children.find(child => child.position.y === 1.5);
    if (mouth) {
      this.applyPhonemeToMouth(mouth, currentPhoneme);
    }
  }

  private applyPhonemeToMouth(mouth: THREE.Object3D, phoneme: string) {
    // Use the found mouth mesh if available, otherwise use the passed mouth object
    const targetMesh = this.mouthMesh || mouth;
    
    // Map phonemes to mouth shapes
    const mouthShapes: { [key: string]: { scale: [number, number, number], position: [number, number, number] } } = {
      'A': { scale: [1.2, 0.8, 1], position: [0, 1.5, 0.4] }, // Open mouth
      'E': { scale: [0.8, 0.6, 1], position: [0, 1.5, 0.4] }, // Smile
      'I': { scale: [0.6, 0.4, 1], position: [0, 1.5, 0.4] }, // Narrow
      'O': { scale: [1, 0.5, 1.2], position: [0, 1.5, 0.4] }, // Round
      'U': { scale: [0.8, 0.3, 1.3], position: [0, 1.5, 0.4] }, // Pucker
      'B': { scale: [0.3, 0.1, 1], position: [0, 1.5, 0.4] }, // Closed lips
      'F': { scale: [0.5, 0.2, 1], position: [0, 1.5, 0.4] }, // Lower lip
      'W': { scale: [0.7, 0.2, 1.1], position: [0, 1.5, 0.4] }, // Rounded
      'L': { scale: [0.6, 0.4, 1], position: [0, 1.5, 0.4] }, // Tongue
      'D': { scale: [0.4, 0.2, 1], position: [0, 1.5, 0.4] }, // Tongue tip
      'K': { scale: [0.5, 0.3, 1], position: [0, 1.5, 0.4] }, // Back tongue
      'S': { scale: [0.4, 0.1, 1], position: [0, 1.5, 0.4] }, // Fricative
      'SH': { scale: [0.5, 0.2, 1], position: [0, 1.5, 0.4] }, // Palatal
      'TH': { scale: [0.3, 0.1, 1], position: [0, 1.5, 0.4] }, // Interdental
      'R': { scale: [0.6, 0.3, 1], position: [0, 1.5, 0.4] }, // Retroflex
      'H': { scale: [0.7, 0.4, 1], position: [0, 1.5, 0.4] }, // Open
      'Y': { scale: [0.5, 0.3, 1], position: [0, 1.5, 0.4] }, // Palatal glide
      'P': { scale: [0.2, 0.1, 1], position: [0, 1.5, 0.4] }, // Pause/closed
      'X': { scale: [0.6, 0.3, 1], position: [0, 1.5, 0.4] }  // Neutral
    };
    
    const shape = mouthShapes[phoneme] || mouthShapes['X'];
    
    // Apply to the target mesh
    targetMesh.scale.set(...shape.scale);
    targetMesh.position.set(...shape.position);
    
    // For real 3D models, we might want to use blend shapes or morph targets
    // This is a simplified approach using scale and position
    if (targetMesh instanceof THREE.Mesh && targetMesh.morphTargetInfluences) {
      // If the model has morph targets, we could use them here
      // This would provide more accurate lip-sync
      this.applyMorphTargets(targetMesh, phoneme);
    }
  }

  private applyMorphTargets(mesh: THREE.Mesh, phoneme: string) {
    // This is a placeholder for morph target application
    // In a real implementation, you would map phonemes to specific morph target indices
    if (!mesh.morphTargetInfluences) return;
    
    // Reset all morph targets
    if (mesh.morphTargetInfluences) {
      for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
        mesh.morphTargetInfluences[i] = 0;
      }
      
      // Apply specific morph targets based on phoneme
      // This would require knowledge of the specific model's morph target setup
      const morphTargetMap: { [key: string]: number[] } = {
        'A': [0.8, 0, 0, 0, 0], // Open mouth
        'E': [0, 0.6, 0, 0, 0], // Smile
        'I': [0, 0, 0.4, 0, 0], // Narrow
        'O': [0, 0, 0, 0.5, 0], // Round
        'U': [0, 0, 0, 0, 0.3], // Pucker
        'B': [0, 0, 0, 0, 0],   // Closed
        'X': [0.1, 0.1, 0.1, 0.1, 0.1] // Neutral
      };
      
      const influences = morphTargetMap[phoneme] || morphTargetMap['X'];
      influences.forEach((influence, index) => {
        if (mesh.morphTargetInfluences && index < mesh.morphTargetInfluences.length) {
          mesh.morphTargetInfluences[index] = influence;
        }
      });
    }
  }

  public setLipSyncData(lipSyncData: LipSyncData) {
    this.currentLipSyncData = lipSyncData;
    this.lipSyncStartTime = this.clock.getElapsedTime();
  }

  public startSpeaking() {
    this.isPlaying = true;
  }

  public stopSpeaking() {
    this.isPlaying = false;
    // Reset mouth to neutral position
    if (this.avatar) {
      const mouth = this.avatar.children.find(child => child.position.y === 1.5);
      if (mouth) {
        mouth.scale.set(0.6, 0.3, 1);
      }
    }
  }

  public setMood(mood: string) {
    // this._currentMood = mood;
    // Apply mood-based facial expressions
    if (this.avatar) {
      // Simple mood implementation
      const head = this.avatar.children[0] as THREE.Mesh;
      if (head) {
        switch (mood) {
          case 'happy':
            head.rotation.x = 0.1;
            break;
          case 'sad':
            head.rotation.x = -0.1;
            break;
          case 'angry':
            head.rotation.z = 0.1;
            break;
          default:
            head.rotation.set(0, 0, 0);
        }
      }
    }
  }

  public async loadAvatar(url: string): Promise<boolean> {
    try {
      console.log('Loading avatar from:', url);
      
      // Remove existing avatar
      if (this.avatar) {
        this.scene.remove(this.avatar);
        this.avatar = null;
      }

      // Load GLB/GLTF model
      const gltf = await this.loader.loadAsync(url);
      
      // Find the main avatar group or use the scene
      this.avatar = gltf.scene;
      
      // Scale and position the avatar
      this.avatar.scale.setScalar(1);
      this.avatar.position.set(0, 0, 0);
      
      // Find head and mouth meshes for lip-sync
      this.findHeadAndMouthMeshes(this.avatar);
      
      // Add to scene
      this.scene.add(this.avatar);
      
      // Set up animations if available
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.avatar);
        gltf.animations.forEach(animation => {
          this.mixer!.clipAction(animation).play();
        });
      }
      
      console.log('Avatar loaded successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to load avatar:', error);
      // Fallback to placeholder avatar
      this.createPlaceholderAvatar();
      return false;
    }
  }

  private findHeadAndMouthMeshes(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        
        // Look for head mesh
        if (name.includes('head') || name.includes('face') || name.includes('skull')) {
          this.headMesh = child;
        }
        
        // Look for mouth mesh
        if (name.includes('mouth') || name.includes('lip') || name.includes('jaw')) {
          this.mouthMesh = child;
        }
      }
    });
    
    // If no specific mouth mesh found, use head mesh
    if (!this.mouthMesh && this.headMesh) {
      this.mouthMesh = this.headMesh;
    }
  }

  private onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    this.renderer.dispose();
    window.removeEventListener('resize', () => this.onWindowResize());
  }

  public getReady() {
    return this.isReady;
  }
}

const TalkingHead: React.FC<TalkingHeadProps> = ({
  className = '',
  onReady,
  onError,
  lipSyncData,
  isPlaying = false,
  avatarUrl,
  mood = 'neutral'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const talkingHeadRef = useRef<TalkingHead3D | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Initialize TalkingHead
      talkingHeadRef.current = new TalkingHead3D(containerRef.current);
      
      // Set up ready callback
      const checkReady = () => {
        if (talkingHeadRef.current?.getReady()) {
          setIsInitialized(true);
          onReady?.();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize TalkingHead');
      setError(error.message);
      onError?.(error);
    }

    return () => {
      talkingHeadRef.current?.dispose();
    };
  }, [onReady, onError]);

  useEffect(() => {
    if (!talkingHeadRef.current || !lipSyncData) return;

    talkingHeadRef.current.setLipSyncData(lipSyncData);
  }, [lipSyncData]);

  useEffect(() => {
    if (!talkingHeadRef.current) return;

    if (isPlaying) {
      talkingHeadRef.current.startSpeaking();
    } else {
      talkingHeadRef.current.stopSpeaking();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!talkingHeadRef.current) return;

    talkingHeadRef.current.setMood(mood);
  }, [mood]);

  useEffect(() => {
    if (!talkingHeadRef.current || !avatarUrl) return;

    talkingHeadRef.current.loadAvatar(avatarUrl);
  }, [avatarUrl]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center text-red-600">
          <div className="text-4xl mb-2">⚠️</div>
          <p>Ошибка загрузки аватара</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef} 
        className="w-full h-96 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Загрузка аватара...</p>
          </div>
        </div>
      )}
      
      {/* Avatar Controls Overlay */}
      {isInitialized && (
        <div className="absolute top-4 right-4 space-y-2">
          <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {isPlaying ? '🗣️ Говорит' : '😐 Молчит'}
          </div>
          {lipSyncData && (
            <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              🎭 Lip-sync активен
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TalkingHead;
