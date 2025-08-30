# TalkingHead Integration with V2V Solution

Этот проект интегрирует [TalkingHead](https://github.com/met4citizen/TalkingHead) - JavaScript библиотеку для 3D аватаров с lip-sync - в ваше Voice-to-Voice (V2V) решение.

## 🚀 Возможности

- **3D Аватар с Lip-Sync**: Реалистичный 3D аватар, который синхронизирует движения губ с речью
- **Real-time Voice Processing**: Обработка голоса в реальном времени через WebSocket
- **Enhanced Phoneme Analysis**: Улучшенный анализ фонем для точной синхронизации
- **Multiple Avatar Support**: Поддержка различных типов аватаров
- **Cross-Platform**: Работает на iOS, Android и Web через React Native

## 🏗️ Архитектура

### Backend (Python/FastAPI)
```
backend/app/services/voice/
├── v2v_service.py          # Основной V2V сервис с lip-sync
├── websocket_handler.py    # WebSocket обработчик
├── router.py               # API роуты
├── openai_client.py        # OpenAI интеграция
└── audio_processor.py      # Обработка аудио
```

### Frontend (React Native)
```
frontend/components/
└── V2VComponent.tsx        # Основной компонент с TalkingHead
```

## 🔧 Установка и настройка

### 1. Backend Dependencies

Убедитесь, что у вас установлены все необходимые Python пакеты:

```bash
cd backend
pip install -r requirements.txt
```

### 2. Frontend Dependencies

Установите дополнительные зависимости для React Native:

```bash
cd frontend
npm install react-native-webview
```

### 3. OpenAI API Key

Создайте файл `.env` в корне backend директории:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## 🎯 Использование

### Запуск Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Запуск Frontend

```bash
cd frontend
npm start
```

## 🔄 Как это работает

### 1. Voice Input Processing

1. Пользователь записывает голос через React Native компонент
2. Аудио конвертируется в base64 и отправляется на backend
3. OpenAI Whisper преобразует аудио в текст
4. GPT генерирует ответ
5. OpenAI TTS преобразует ответ в аудио
6. Backend генерирует lip-sync данные

### 2. Lip-Sync Generation

```python
async def generate_lip_sync_data(self, text: str) -> Dict[str, Any]:
    # Анализ текста и генерация фонем
    phonemes = self._text_to_phonemes_enhanced(text)
    
    # Расчет времени произношения
    total_duration = self._calculate_speech_duration(text, word_count)
    
    # Генерация timing данных
    timing = self._generate_enhanced_timing_data(phonemes, total_duration)
    
    return {
        "type": "visemes",
        "visemes": phonemes,
        "timing": timing,
        "duration": total_duration,
        "language": "en"
    }
```

### 3. Frontend Integration

1. WebView загружает HTML с TalkingHead
2. TalkingHead инициализирует 3D сцену
3. Lip-sync данные отправляются через postMessage
4. Аватар выполняет анимацию губ в реальном времени

## 🎨 Настройка аватара

### Изменение аватара

```typescript
// Отправка кастомного аватара
webViewRef.current.postMessage(JSON.stringify({
  type: 'change_avatar',
  avatarUrl: 'https://your-custom-avatar.glb'
}));
```

### Настройка настроения

```typescript
webViewRef.current.postMessage(JSON.stringify({
  type: 'set_mood',
  mood: 'happy' // или 'sad', 'angry', 'surprised'
}));
```

## 📱 Поддерживаемые платформы

- ✅ iOS (через React Native)
- ✅ Android (через React Native)
- ✅ Web (через React Native Web)
- ✅ Expo (Managed и Bare workflow)

## 🚨 Ограничения

1. **WebView Performance**: На старых устройствах WebView может работать медленно
2. **Memory Usage**: 3D аватар потребляет значительное количество памяти
3. **Network Dependency**: Требует стабильное интернет-соединение для OpenAI API

## 🔧 Troubleshooting

### Аватар не загружается

1. Проверьте интернет-соединение
2. Убедитесь, что TalkingHead.js загружается корректно
3. Проверьте консоль браузера на ошибки

### Lip-sync не работает

1. Проверьте, что backend генерирует корректные lip-sync данные
2. Убедитесь, что WebSocket соединение активно
3. Проверьте формат данных в консоли

### Проблемы с производительностью

1. Уменьшите качество аватара
2. Отключите дополнительные эффекты
3. Используйте более легкие модели аватаров

## 📚 Дополнительные ресурсы

- [TalkingHead Documentation](https://github.com/met4citizen/TalkingHead)
- [Ready Player Me Avatars](https://readyplayer.me/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)

## 🤝 Вклад в проект

1. Fork репозиторий
2. Создайте feature branch
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

Этот проект использует MIT лицензию. TalkingHead также использует MIT лицензию.

## 🆘 Поддержка

Если у вас возникли проблемы:

1. Проверьте [Issues](https://github.com/your-repo/issues)
2. Создайте новый Issue с подробным описанием проблемы
3. Приложите логи и скриншоты

---

**Примечание**: Это экспериментальная интеграция. Функциональность может изменяться в будущих версиях.
