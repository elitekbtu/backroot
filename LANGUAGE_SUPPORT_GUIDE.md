# 🌐 Language Support Implementation Guide

## Overview
This implementation adds comprehensive language support to the V2V (Voice-to-Voice) application, allowing users to select between Kazakh (Қазақша), Russian (Русский), and English languages for AI responses.

## 🚀 Features Implemented

### Frontend Components
- **LanguageSelector**: Interactive dropdown component for language selection
- **LanguageContext**: React context for managing language state across the application
- **Persistent Storage**: Language preference saved in localStorage
- **Responsive Design**: Works on mobile, desktop, and kiosk modes

### Backend Services
- **Language-aware Prompts**: AI system prompts generated based on selected language
- **Voice Mapping**: Different TTS voices for different languages
- **Location Context**: Location information provided in the selected language
- **API Integration**: Language parameter passed through all API calls

## 📁 Files Modified/Created

### Frontend
- `frontend/src/context/LanguageContext.tsx` - Language context management
- `frontend/src/components/LanguageSelector.tsx` - Language selection UI
- `frontend/src/pages/V2V.tsx` - Updated to include language selector
- `frontend/src/api/v2v.ts` - Updated to pass language parameter
- `frontend/src/App.tsx` - Added LanguageProvider wrapper

### Backend
- `backend/app/services/voice/v2v_service.py` - Language-aware prompt generation
- `backend/app/services/voice/openai_client.py` - Language-specific TTS voices
- `backend/app/services/voice/router.py` - Added HTTP endpoint for text processing

## 🎯 How It Works

### 1. Language Selection
Users can select their preferred language using the dropdown in the location status panel:
- 🇰🇿 Қазақша (Kazakh)
- 🇷🇺 Русский (Russian)  
- 🇺🇸 English (English)

### 2. Language Persistence
The selected language is automatically saved to localStorage and restored on page reload.

### 3. AI Response Generation
When a user sends a text message:
1. The selected language is sent to the backend
2. The AI generates a response using language-specific prompts
3. The response is converted to speech using the appropriate voice
4. The response is returned in the selected language

### 4. Voice Selection
Different languages use different TTS voices for optimal pronunciation:
- Kazakh: `alloy` voice
- Russian: `nova` voice  
- English: `alloy` voice

## 🔧 Usage

### For Users
1. Navigate to the V2V page
2. In the location status panel, find the "Язык ответа" section
3. Click the language dropdown and select your preferred language
4. Send text messages - AI will respond in the selected language

### For Developers
```typescript
// Using the language context
import { useLanguage } from '../context/LanguageContext';

const MyComponent = () => {
  const { language, setLanguage, getLanguageName } = useLanguage();
  
  return (
    <div>
      <p>Current language: {getLanguageName(language)}</p>
      <button onClick={() => setLanguage('ru')}>
        Switch to Russian
      </button>
    </div>
  );
};
```

## 🧪 Testing

Run the language support tests:
```bash
python3 simple_language_test.py
```

This will verify:
- Language codes are valid
- Voice mapping works correctly
- Prompt templates contain expected keywords
- Frontend integration is working

## 🌍 Language-Specific Features

### Kazakh (Қазақша)
- Uses Kazakh language prompts
- Includes Kazakh cultural context
- Optimized for Kazakh pronunciation

### Russian (Русский)
- Uses Russian language prompts
- Includes Russian cultural context
- Uses `nova` voice for better Russian pronunciation

### English (English)
- Uses English language prompts
- Includes English cultural context
- Uses `alloy` voice for clear English pronunciation

## 🔮 Future Enhancements

Potential improvements for the language support system:
1. **More Languages**: Add support for additional languages
2. **Auto-Detection**: Detect user's preferred language from browser settings
3. **Voice Customization**: Allow users to select different voices
4. **Translation**: Add translation capabilities between languages
5. **Cultural Adaptation**: More sophisticated cultural context adaptation

## 🐛 Troubleshooting

### Common Issues
1. **Language not persisting**: Check if localStorage is enabled
2. **Wrong voice used**: Verify voice mapping in `openai_client.py`
3. **AI responds in wrong language**: Check prompt generation in `v2v_service.py`

### Debug Mode
Enable debug logging to see language selection in action:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📝 Notes

- Language selection is per-session and persists across page reloads
- The system defaults to Kazakh if no language is selected
- All location context information is provided in the selected language
- Voice selection is automatic based on the chosen language