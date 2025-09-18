/**
 * TalkingHead - A simplified implementation based on met4citizen/talkinghead
 * Adapted for React/TypeScript with Ready Player Me avatar support
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { LipSyncData, AvatarConfig } from '../types/v2v';

// Oculus Viseme to ARKit Blend Shape mapping for Ready Player Me
// Based on ARKit blend shapes and Ready Player Me morph targets
const VISEME_TO_ARKIT: { [key: string]: { [key: string]: number } } = {
  'sil': { mouthClose: 1.0, mouthOpen: 0.0 }, // Silence - mouth closed
  'PP': { mouthPucker: 0.8, mouthClose: 0.4, mouthOpen: 0.1 }, // p, b, m - lips together
  'FF': { mouthLowerDownLeft: 0.7, mouthLowerDownRight: 0.7, mouthOpen: 0.2 }, // f, v - lower lip down
  'TH': { tongueOut: 0.8, mouthOpen: 0.3, jawOpen: 0.2 }, // th - tongue out
  'DD': { mouthOpen: 0.4, tongueOut: 0.4, jawOpen: 0.3 }, // t, d - tongue touches roof
  'kk': { mouthOpen: 0.5, jawOpen: 0.6, mouthClose: 0.2 }, // k, g - back of tongue
  'CH': { mouthPucker: 0.6, mouthOpen: 0.4, jawOpen: 0.3 }, // ch, j, sh, zh - rounded lips
  'SS': { mouthSmileLeft: 0.4, mouthSmileRight: 0.4, mouthOpen: 0.1, mouthClose: 0.3 }, // s, z - teeth together
  'nn': { mouthOpen: 0.3, tongueOut: 0.3, jawOpen: 0.2 }, // n, ng - tongue up
  'RR': { mouthFunnel: 0.5, mouthOpen: 0.3, jawOpen: 0.2 }, // r - rounded lips
  'aa': { jawOpen: 0.9, mouthOpen: 0.9, mouthClose: 0.0 }, // a (as in "father") - wide open
  'E': { mouthSmileLeft: 0.7, mouthSmileRight: 0.7, jawOpen: 0.4, mouthOpen: 0.5 }, // e (as in "bed") - smile
  'I': { mouthSmileLeft: 0.9, mouthSmileRight: 0.9, jawOpen: 0.2, mouthOpen: 0.3 }, // i (as in "bit") - wide smile
  'O': { mouthFunnel: 0.9, jawOpen: 0.6, mouthOpen: 0.6 }, // o (as in "hot") - rounded
  'U': { mouthPucker: 0.9, mouthFunnel: 0.8, jawOpen: 0.3, mouthOpen: 0.4 }, // u (as in "book") - very rounded
  'A': { jawOpen: 0.8, mouthOpen: 0.8, mouthClose: 0.0 }, // Generic open vowel
  // Additional visemes for better lip sync
  'EE': { mouthSmileLeft: 0.8, mouthSmileRight: 0.8, jawOpen: 0.3, mouthOpen: 0.4 }, // ee (as in "see")
  'OO': { mouthPucker: 0.8, mouthFunnel: 0.7, jawOpen: 0.4, mouthOpen: 0.5 }, // oo (as in "food")
  'AH': { jawOpen: 0.7, mouthOpen: 0.7, mouthClose: 0.0 }, // ah (as in "car")
  'OH': { mouthFunnel: 0.6, jawOpen: 0.5, mouthOpen: 0.5 }, // oh (as in "go")
};

// Default Ready Player Me morph target names (for reference)
// Commented out to avoid unused variable warning
// const RPM_MORPH_TARGETS = [
//   'mouthOpen', 'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
//   'mouthPucker', 'mouthFunnel', 'mouthClose', 'jawOpen', 'jawForward', 'jawLeft', 'jawRight',
//   'tongueOut', 'mouthLowerDownLeft', 'mouthLowerDownRight', 'mouthUpperUpLeft', 'mouthUpperUpRight',
//   'eyeBlinkLeft', 'eyeBlinkRight', 'eyeLookUpLeft', 'eyeLookUpRight', 'eyeLookDownLeft', 'eyeLookDownRight',
//   'eyeLookInLeft', 'eyeLookInRight', 'eyeLookOutLeft', 'eyeLookOutRight', 'eyeSquintLeft', 'eyeSquintRight',
//   'eyeWideLeft', 'eyeWideRight', 'browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
//   'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight', 'noseSneerLeft', 'noseSneerRight'
// ];

export interface TalkingHeadOptions {
  modelPixelRatio?: number;
  modelFPS?: number;
  cameraView?: 'full' | 'upper' | 'head';
  cameraDistance?: number;
  cameraX?: number;
  cameraY?: number;
  lightAmbientColor?: number;
  lightAmbientIntensity?: number;
  lightDirectColor?: number;
  lightDirectIntensity?: number;
  avatarMood?: string;
  avatarMute?: boolean;
  avatarIdleEyeContact?: number;
  avatarIdleHeadMove?: number;
  avatarSpeakingEyeContact?: number;
  avatarSpeakingHeadMove?: number;
}

export class TalkingHead {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private avatar: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private clock: THREE.Clock;
  private loader!: GLTFLoader;
  private dracoLoader!: DRACOLoader;
  
  private isReady = false;
  private isPlaying = false;
  private currentLipSyncData: LipSyncData | null = null;
  private lipSyncStartTime = 0;
  
  // Avatar components
  private headMesh: THREE.Mesh | null = null;
  private morphTargetMeshes: THREE.Mesh[] = [];
  private currentMood = 'neutral';
  
  // Animation properties
  private headRotationBase = new THREE.Euler();
  private idleAnimationTime = 0;
  
  private options: Required<TalkingHeadOptions>;

  constructor(container: HTMLElement, options: TalkingHeadOptions = {}) {
    this.container = container;
    this.clock = new THREE.Clock();
    
    // Default options
    this.options = {
      modelPixelRatio: window.devicePixelRatio || 1,
      modelFPS: 30,
      cameraView: 'upper',
      cameraDistance: 0,
      cameraX: 0,
      cameraY: 0,
      lightAmbientColor: 0xffffff,
      lightAmbientIntensity: 2,
      lightDirectColor: 0x8888aa,
      lightDirectIntensity: 30,
      avatarMood: 'neutral',
      avatarMute: false,
      avatarIdleEyeContact: 0.3,
      avatarIdleHeadMove: 0.5,
      avatarSpeakingEyeContact: 0.7,
      avatarSpeakingHeadMove: 0.3,
      ...options
    };

    this.initScene();
    this.initLoaders();
    this.setupLighting();
    this.createPlaceholderAvatar();
    this.startAnimationLoop();
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private initScene() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    
    // Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.setCameraView(this.options.cameraView);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(this.options.modelPixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    this.container.appendChild(this.renderer.domElement);
  }

  private initLoaders() {
    this.loader = new GLTFLoader();
    
    // Setup Draco loader for compressed models
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  private setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      this.options.lightAmbientColor, 
      this.options.lightAmbientIntensity
    );
    this.scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(
      this.options.lightDirectColor, 
      this.options.lightDirectIntensity
    );
    directionalLight.position.set(2, 4, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, 2, 3);
    this.scene.add(fillLight);
    
    // Rim light
    const rimLight = new THREE.DirectionalLight(0x8888ff, 0.5);
    rimLight.position.set(0, 2, -3);
    this.scene.add(rimLight);
  }

  private setCameraView(view: 'full' | 'upper' | 'head') {
    switch (view) {
      case 'full':
        this.camera.position.set(0, 1.2, 4);
        break;
      case 'upper':
        this.camera.position.set(0, 1.6, 2.5);
        break;
      case 'head':
        this.camera.position.set(0, 1.7, 1.5);
        break;
    }
    this.camera.lookAt(0, 1.6, 0);
  }

  private createPlaceholderAvatar() {
    // Create a simple placeholder until real avatar loads
    const group = new THREE.Group();
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 32, 32);
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
    const eyeGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 1.65, 0.2);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 1.65, 0.2);
    
    // Mouth
    const mouthGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const mouthMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 1.55, 0.2);
    mouth.scale.set(1, 0.3, 1);
    
    group.add(head, leftEye, rightEye, mouth);
    group.name = 'PlaceholderAvatar';
    
    this.avatar = group;
    this.scene.add(this.avatar);
    this.isReady = true;
  }

  private startAnimationLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      
      const deltaTime = this.clock.getDelta();
      this.idleAnimationTime += deltaTime;
      
      // Update mixer
      if (this.mixer) {
        this.mixer.update(deltaTime);
      }
      
      // Update lip sync
      if (this.isPlaying && this.currentLipSyncData) {
        this.updateLipSync();
      }
      
      // Update idle animations
      this.updateIdleAnimations(deltaTime);
      
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }

  private updateLipSync() {
    if (!this.currentLipSyncData || !this.avatar) return;
    
    const currentTime = this.clock.getElapsedTime() - this.lipSyncStartTime;
    
    // Find current viseme with interpolation
    let activeViseme = 'sil';
    let nextViseme = 'sil';
    let interpolationFactor = 0;
    
    if (this.currentLipSyncData.timing) {
      // Use timing array if available
      for (let i = 0; i < this.currentLipSyncData.timing.length; i++) {
        const timing = this.currentLipSyncData.timing[i];
        const nextTiming = this.currentLipSyncData.timing[i + 1];
        
        if (currentTime >= timing.start_time && 
            currentTime <= timing.start_time + timing.duration) {
          activeViseme = timing.viseme;
          
          // Calculate interpolation for smooth transitions
          if (nextTiming) {
            nextViseme = nextTiming.viseme;
            const timeInCurrentViseme = currentTime - timing.start_time;
            const currentVisemeDuration = timing.duration;
            interpolationFactor = Math.min(timeInCurrentViseme / currentVisemeDuration, 1);
          }
          break;
        }
      }
    } else {
      // Use arrays format
      const { visemes, times, durations } = this.currentLipSyncData;
      for (let i = 0; i < visemes.length; i++) {
        if (currentTime >= times[i] && currentTime <= times[i] + durations[i]) {
          activeViseme = visemes[i];
          
          // Calculate interpolation for smooth transitions
          if (i < visemes.length - 1) {
            nextViseme = visemes[i + 1];
            const timeInCurrentViseme = currentTime - times[i];
            const currentVisemeDuration = durations[i];
            interpolationFactor = Math.min(timeInCurrentViseme / currentVisemeDuration, 1);
          }
          break;
        }
      }
    }
    
    // Apply viseme with interpolation
    this.applyVisemeWithInterpolation(activeViseme, nextViseme, interpolationFactor);
  }

  private resetMorphTargets() {
    this.morphTargetMeshes.forEach(mesh => {
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences.fill(0);
      }
    });
  }


  private applyVisemeWithInterpolation(currentViseme: string, nextViseme: string, interpolationFactor: number) {
    const currentMorphTargets = VISEME_TO_ARKIT[currentViseme] || VISEME_TO_ARKIT['sil'];
    const nextMorphTargets = VISEME_TO_ARKIT[nextViseme] || VISEME_TO_ARKIT['sil'];
    
    this.morphTargetMeshes.forEach(mesh => {
      if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;
      
      // Get all unique target names from both visemes
      const allTargetNames = new Set([
        ...Object.keys(currentMorphTargets),
        ...Object.keys(nextMorphTargets)
      ]);
      
      allTargetNames.forEach(targetName => {
        if (mesh.morphTargetDictionary) {
          const index = mesh.morphTargetDictionary[targetName];
          if (index !== undefined && mesh.morphTargetInfluences && index < mesh.morphTargetInfluences.length) {
            const currentValue = currentMorphTargets[targetName] || 0;
            const nextValue = nextMorphTargets[targetName] || 0;
            
            // Interpolate between current and next viseme
            const interpolatedValue = currentValue + (nextValue - currentValue) * interpolationFactor;
            
            // Apply with additional smoothing
            const currentInfluence = mesh.morphTargetInfluences[index];
            const lerpFactor = 0.4; // Adjust for responsiveness
            mesh.morphTargetInfluences[index] = currentInfluence + (interpolatedValue - currentInfluence) * lerpFactor;
          }
        }
      });
    });
  }

  private updateIdleAnimations(_deltaTime: number) {
    if (!this.avatar) return;
    
    const eyeContactLevel = this.isPlaying ? 
      this.options.avatarSpeakingEyeContact : 
      this.options.avatarIdleEyeContact;
    
    const headMoveLevel = this.isPlaying ? 
      this.options.avatarSpeakingHeadMove : 
      this.options.avatarIdleHeadMove;
    
    // Subtle head movements
    if (this.headMesh) {
      const time = this.idleAnimationTime;
      
      // Breathing-like movement
      this.headMesh.position.y = 1.6 + Math.sin(time * 0.5) * 0.002 * headMoveLevel;
      
      // Subtle head rotation
      this.headMesh.rotation.x = this.headRotationBase.x + 
        Math.sin(time * 0.3) * 0.02 * headMoveLevel;
      this.headMesh.rotation.y = this.headRotationBase.y + 
        Math.sin(time * 0.2) * 0.03 * headMoveLevel;
      this.headMesh.rotation.z = this.headRotationBase.z + 
        Math.sin(time * 0.25) * 0.01 * headMoveLevel;
    }
    
    // Eye contact simulation
    if (eyeContactLevel > 0 && this.morphTargetMeshes.length > 0) {
      const lookIntensity = 0.3 * eyeContactLevel;
      const time = this.idleAnimationTime * 0.8;
      
      this.morphTargetMeshes.forEach(mesh => {
        if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;
        
        // Subtle eye movements
        const lookUpIndex = mesh.morphTargetDictionary['eyeLookUpLeft'];
        const lookDownIndex = mesh.morphTargetDictionary['eyeLookDownLeft'];
        
        if (lookUpIndex !== undefined) {
          mesh.morphTargetInfluences[lookUpIndex] = 
            Math.max(0, Math.sin(time) * lookIntensity);
        }
        if (lookDownIndex !== undefined) {
          mesh.morphTargetInfluences[lookDownIndex] = 
            Math.max(0, -Math.sin(time) * lookIntensity);
        }
      });
    }
  }

  public async loadAvatar(config: AvatarConfig, onProgress?: (progress: ProgressEvent) => void): Promise<boolean> {
    try {
      console.log('Loading avatar:', config.url);
      
      // Remove existing avatar
      if (this.avatar) {
        this.scene.remove(this.avatar);
        this.avatar = null;
      }
      
      // Reset references
      this.headMesh = null;
      this.morphTargetMeshes = [];
      this.isReady = false;
      
      // Load GLTF model
      const gltf = await new Promise<any>((resolve, reject) => {
        this.loader.load(
          config.url,
          resolve,
          onProgress,
          reject
        );
      });
      
      this.avatar = gltf.scene;
      if (this.avatar) {
        this.avatar.name = 'Avatar';
        
        // Scale and position
        this.avatar.scale.setScalar(1);
        this.avatar.position.set(0, 0, 0);
        
        // Find meshes with morph targets
        this.findMorphTargetMeshes(this.avatar);
        
        // Setup animations
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.avatar);
          
          // Play idle animations
          gltf.animations.forEach((animation: THREE.AnimationClip) => {
            if (animation.name.toLowerCase().includes('idle')) {
              const action = this.mixer!.clipAction(animation);
              action.play();
            }
          });
        }
        
        // Add to scene
        this.scene.add(this.avatar);
      }
      
      // Apply initial mood
      this.setMood(config.avatarMood || this.options.avatarMood);
      
      this.isReady = true;
      console.log('Avatar loaded successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to load avatar:', error);
      this.createPlaceholderAvatar();
      return false;
    }
  }

  private findMorphTargetMeshes(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetInfluences) {
        this.morphTargetMeshes.push(child);
        
        // Create morph target dictionary for faster lookup
        if (child.morphTargetDictionary === undefined) {
          child.morphTargetDictionary = {};
          if (child.morphTargetInfluences && (child as any).morphTargets) {
            (child as any).morphTargets.forEach((target: any, index: number) => {
              if (target.name) {
                child.morphTargetDictionary![target.name] = index;
              }
            });
          }
        }
        
        // Find head mesh (Ready Player Me specific naming)
        const name = child.name.toLowerCase();
        if (name.includes('head') || name.includes('face') || 
            name.includes('wolf3d_head') || name.includes('wolf3d_teeth') ||
            name.includes('headmesh') || name.includes('head_mesh')) {
          this.headMesh = child;
        }
      }
    });
    
    console.log(`Found ${this.morphTargetMeshes.length} meshes with morph targets`);
    
    // Log available morph targets for debugging
    if (this.morphTargetMeshes.length > 0) {
      const firstMesh = this.morphTargetMeshes[0];
      if (firstMesh.morphTargetDictionary) {
        const availableTargets = Object.keys(firstMesh.morphTargetDictionary);
        console.log('Available morph targets:', availableTargets);
      }
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
    // Reset mouth to neutral
    this.resetMorphTargets();
  }

  public setMood(mood: string) {
    if (this.currentMood === mood) return; // No change needed
    
    this.currentMood = mood;
    
    if (!this.avatar) return;
    
    // Apply mood-based expressions
    this.morphTargetMeshes.forEach(mesh => {
      if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;
      
      // Reset mood-related morph targets
      const moodTargets = ['mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight', 'browDownLeft', 'browDownRight', 'browInnerUp'];
      moodTargets.forEach(target => {
        if (mesh.morphTargetDictionary) {
          const index = mesh.morphTargetDictionary[target];
          if (index !== undefined && mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[index] = 0;
          }
        }
      });
      
      // Apply mood
      switch (mood) {
        case 'happy':
          this.setMorphTarget(mesh, 'mouthSmileLeft', 0.3);
          this.setMorphTarget(mesh, 'mouthSmileRight', 0.3);
          this.setMorphTarget(mesh, 'browInnerUp', 0.2);
          break;
        case 'sad':
          this.setMorphTarget(mesh, 'mouthFrownLeft', 0.4);
          this.setMorphTarget(mesh, 'mouthFrownRight', 0.4);
          this.setMorphTarget(mesh, 'browDownLeft', 0.3);
          this.setMorphTarget(mesh, 'browDownRight', 0.3);
          break;
        case 'angry':
          this.setMorphTarget(mesh, 'browDownLeft', 0.6);
          this.setMorphTarget(mesh, 'browDownRight', 0.6);
          break;
        default:
          // Neutral - already reset above
          break;
      }
    });
  }

  private setMorphTarget(mesh: THREE.Mesh, targetName: string, value: number) {
    if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;
    
    const index = mesh.morphTargetDictionary[targetName];
    if (index !== undefined && index < mesh.morphTargetInfluences.length) {
      mesh.morphTargetInfluences[index] = value;
    }
  }

  public async speakText(text: string, lipSyncData?: LipSyncData) {
    if (lipSyncData) {
      this.setLipSyncData(lipSyncData);
    }
    
    this.startSpeaking();
    
    // This would typically trigger TTS and get audio duration
    // For now, we'll simulate speaking for a duration based on text length
    const estimatedDuration = text.length * 100; // rough estimate
    
    setTimeout(() => {
      this.stopSpeaking();
    }, estimatedDuration);
  }

  private onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    // Clean up Three.js resources
    this.renderer.dispose();
    this.dracoLoader.dispose();
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    // Clean up avatar
    if (this.avatar) {
      this.scene.remove(this.avatar);
    }
    
    // Clean up mixer
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    
    // Remove DOM element
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }

  public getReady(): boolean {
    return this.isReady;
  }

  public getAvatar(): THREE.Group | null {
    return this.avatar;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
}

export default TalkingHead;
