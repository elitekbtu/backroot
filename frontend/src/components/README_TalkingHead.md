# TalkingHead Implementation

A comprehensive 3D avatar system with lip-sync capabilities based on the [met4citizen/TalkingHead](https://github.com/met4citizen/talkinghead) repository, adapted for React/TypeScript with Ready Player Me support.

## Features

### ✅ Core Features
- **Ready Player Me Integration**: Support for full-body 3D avatars with ARKit morph targets
- **Advanced Lip Sync**: Proper viseme-to-morph-target mapping using Oculus visemes
- **Mood-based Expressions**: Dynamic facial expressions based on content sentiment
- **Idle Animations**: Realistic breathing, eye contact, and subtle head movements
- **Progressive Loading**: Loading progress indicators with error handling
- **Performance Optimized**: Efficient Three.js rendering with proper cleanup

### 🎭 Supported Visemes
The system supports the full Oculus viseme set mapped to ARKit blend shapes:
- **sil** - Silence (mouth closed)
- **PP** - p, b, m sounds (lip closure)
- **FF** - f, v sounds (lip-teeth contact)
- **TH** - th sounds (tongue-teeth contact)
- **DD** - t, d sounds (tongue-alveolar contact)
- **kk** - k, g sounds (tongue-soft palate contact)
- **CH** - ch, j, sh, zh sounds (tongue-palate contact)
- **SS** - s, z sounds (tongue-alveolar fricative)
- **nn** - n, ng sounds (nasal)
- **RR** - r sounds (liquid)
- **aa** - a (as in "father") - open vowel
- **E** - e (as in "bed") - mid-front vowel
- **I** - i (as in "bit") - high-front vowel
- **O** - o (as in "hot") - mid-back vowel
- **U** - u (as in "book") - high-back vowel

## File Structure

```
src/
├── lib/
│   └── talkinghead.ts          # Core TalkingHead engine
├── components/
│   ├── TalkingHead.tsx         # React component wrapper
│   ├── TalkingHeadDemo.tsx     # Demo/example component
│   └── README_TalkingHead.md   # This documentation
└── types/
    └── v2v.ts                  # TypeScript type definitions
```

## Usage

### Basic Implementation

```tsx
import React, { useState } from 'react';
import TalkingHead from './TalkingHead';
import type { AvatarConfig, LipSyncData } from '../types/v2v';

const MyComponent: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [lipSyncData, setLipSyncData] = useState<LipSyncData | null>(null);

  const avatarConfig: AvatarConfig = {
    url: 'https://models.readyplayer.me/your-avatar-id.glb?morphTargets=ARKit,Oculus+Visemes',
    body: 'F',
    lipsyncLang: 'en',
    avatarMood: 'neutral'
  };

  return (
    <TalkingHead
      avatarConfig={avatarConfig}
      lipSyncData={lipSyncData}
      isPlaying={isPlaying}
      mood="happy"
      onReady={() => setIsReady(true)}
      onError={(error) => console.error(error)}
      options={{
        cameraView: 'upper',
        lightAmbientIntensity: 2,
        avatarIdleEyeContact: 0.3
      }}
    />
  );
};
```

### Advanced Configuration

```tsx
const advancedOptions: TalkingHeadOptions = {
  modelPixelRatio: window.devicePixelRatio,
  modelFPS: 30,
  cameraView: 'upper', // 'full' | 'upper' | 'head'
  cameraDistance: 0,
  cameraX: 0,
  cameraY: 0,
  lightAmbientColor: 0xffffff,
  lightAmbientIntensity: 2,
  lightDirectColor: 0x8888aa,
  lightDirectIntensity: 30,
  avatarMood: 'neutral',
  avatarMute: false,
  avatarIdleEyeContact: 0.3,      // 0-1, eye contact level while idle
  avatarIdleHeadMove: 0.5,        // 0-1, head movement level while idle
  avatarSpeakingEyeContact: 0.7,  // 0-1, eye contact level while speaking
  avatarSpeakingHeadMove: 0.3     // 0-1, head movement level while speaking
};
```

### Lip Sync Data Format

```tsx
const lipSyncData: LipSyncData = {
  visemes: ['sil', 'PP', 'aa', 'DD', 'sil'],
  times: [0, 0.2, 0.4, 0.6, 0.8],
  durations: [0.2, 0.2, 0.2, 0.2, 0.2],
  timing: [
    { viseme: 'sil', start_time: 0, duration: 0.2 },
    { viseme: 'PP', start_time: 0.2, duration: 0.2 },
    { viseme: 'aa', start_time: 0.4, duration: 0.2 },
    { viseme: 'DD', start_time: 0.6, duration: 0.2 },
    { viseme: 'sil', start_time: 0.8, duration: 0.2 }
  ]
};
```

## Props

### TalkingHead Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | CSS classes for styling |
| `onReady` | `() => void` | `undefined` | Callback when avatar is loaded |
| `onError` | `(error: Error) => void` | `undefined` | Error callback |
| `lipSyncData` | `LipSyncData \| null` | `null` | Lip sync timing data |
| `isPlaying` | `boolean` | `false` | Whether avatar is speaking |
| `avatarConfig` | `AvatarConfig` | `undefined` | Avatar configuration |
| `mood` | `string` | `'neutral'` | Current mood |
| `options` | `TalkingHeadOptions` | `{}` | Engine options |

### AvatarConfig Interface

```tsx
interface AvatarConfig {
  url: string;                    // GLB/GLTF model URL
  body?: 'M' | 'F';              // Body type
  lipsyncLang?: string;          // Language for lip sync
  ttsLang?: string;              // TTS language
  ttsVoice?: string;             // TTS voice name
  avatarMood?: string;           // Initial mood
  avatarMute?: boolean;          // Muted state
  avatarIdleEyeContact?: number; // Eye contact level (0-1)
  avatarIdleHeadMove?: number;   // Head movement level (0-1)
  avatarSpeakingEyeContact?: number;
  avatarSpeakingHeadMove?: number;
}
```

## Ready Player Me Integration

### Required Morph Targets

When creating Ready Player Me avatars, ensure these morph targets are enabled:
- **ARKit**: Essential for facial expressions
- **Oculus Visemes**: Required for lip sync
- **Additional**: mouthOpen, mouthSmile, eyesClosed, eyesLookUp, eyesLookDown

### Avatar URL Format

```
https://models.readyplayer.me/{AVATAR_ID}.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png
```

## Moods and Expressions

### Supported Moods
- **neutral**: Default expression
- **happy**: Smile with raised eyebrows
- **sad**: Frown with lowered eyebrows
- **angry**: Lowered, furrowed eyebrows

### Custom Mood Implementation

```tsx
// The engine automatically detects mood from text content
const detectMood = (text: string): string => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('happy') || lowerText.includes('great')) return 'happy';
  if (lowerText.includes('sad') || lowerText.includes('sorry')) return 'sad';
  if (lowerText.includes('angry') || lowerText.includes('frustrated')) return 'angry';
  return 'neutral';
};
```

## Performance Considerations

### Optimization Tips
1. **Texture Size**: Use `textureSizeLimit=1024` for better performance
2. **Model Complexity**: Choose avatars with appropriate polygon counts
3. **Morph Targets**: Only enable required morph targets
4. **Rendering**: The engine uses efficient Three.js rendering with proper cleanup
5. **Memory**: Avatars are properly disposed when components unmount

### Browser Compatibility
- **WebGL 2.0**: Required for morph targets
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 14+
- **Mobile**: iOS Safari 14+, Chrome Mobile 80+

## Integration with Voice Services

### TTS Integration Example

```tsx
const handleVoiceResponse = (response: VoiceResponseMessage) => {
  // Set mood based on response content
  const mood = detectMoodFromText(response.ai_response);
  setAvatarMood(mood);
  
  // Generate lip sync data (in real implementation, this comes from TTS)
  const lipSyncData = generateLipSyncFromText(response.ai_response);
  setCurrentLipSyncData(lipSyncData);
  
  // Play audio
  playAudioResponse(response.audio_response);
  
  // Clear lip sync after speech
  setTimeout(() => {
    setCurrentLipSyncData(null);
  }, estimatedDuration);
};
```

## Troubleshooting

### Common Issues

1. **Avatar not loading**: 
   - Check if the URL is accessible
   - Verify morph targets are included
   - Check browser console for CORS errors

2. **No lip sync**:
   - Ensure `lipSyncData` is properly formatted
   - Verify morph target names match ARKit standards
   - Check if `isPlaying` is set to true

3. **Performance issues**:
   - Reduce texture size in avatar URL
   - Lower `modelPixelRatio` for older devices
   - Check for memory leaks in browser dev tools

4. **Expressions not working**:
   - Verify ARKit morph targets are enabled
   - Check mood values are supported
   - Ensure avatar has facial blend shapes

### Debug Mode

```tsx
// Enable console logging
const options = {
  debug: true, // Custom option for debugging
  ...otherOptions
};

// Check avatar morph targets
useEffect(() => {
  if (avatarReady && talkingHeadRef.current) {
    const avatar = talkingHeadRef.current.getAvatar();
    console.log('Available morph targets:', avatar?.children[0]?.morphTargetDictionary);
  }
}, [avatarReady]);
```

## License

Based on the MIT Licensed [met4citizen/TalkingHead](https://github.com/met4citizen/talkinghead) project.

## Contributing

When contributing to the TalkingHead implementation:

1. **Viseme Mapping**: Ensure new visemes follow ARKit standards
2. **Performance**: Test with various avatar complexities
3. **Browser Testing**: Verify compatibility across browsers
4. **Documentation**: Update this README for new features
5. **Type Safety**: Maintain TypeScript type definitions

## Future Enhancements

### Planned Features
- [ ] Real-time TTS integration with proper timing
- [ ] Custom morph target mapping for different avatar types
- [ ] Gesture and body language support
- [ ] Advanced emotion detection and expression
- [ ] Multi-language phoneme support
- [ ] VRM avatar format support
- [ ] WebXR/VR compatibility
