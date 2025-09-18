# 🗺️ Настройка Google Maps для POI Collector

## Получение API ключа

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите следующие API:
   - **Maps JavaScript API**
   - **Places API** (опционально, для дополнительных функций)
4. Перейдите в "Credentials" → "Create Credentials" → "API Key"
5. Скопируйте полученный ключ

## Настройка в проекте

### Вариант 1: Переменные окружения (рекомендуется)

1. Создайте файл `.env` в папке `frontend/`:
```bash
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

2. Перезапустите сервер разработки:
```bash
npm run dev
```

### Вариант 2: Прямая замена в коде

В файле `frontend/src/components/POIMap.tsx` замените:
```typescript
apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE',
```

на:
```typescript
apiKey: 'your_actual_api_key_here',
```

## Ограничения API ключа (рекомендуется)

Для безопасности настройте ограничения:

1. **HTTP referrers**: Добавьте домены вашего сайта
   - `localhost:*` (для разработки)
   - `yourdomain.com/*` (для продакшена)

2. **API restrictions**: Ограничьте только нужными API
   - Maps JavaScript API
   - Places API (если используется)

## Тестирование

После настройки API ключа:

1. Откройте приложение в браузере
2. Перейдите в раздел "POI Collector"
3. Должна загрузиться интерактивная карта с маркерами POI

## Возможные ошибки

- **"For development purposes only"**: Нормально для тестирования
- **"This page can't load Google Maps correctly"**: Проверьте API ключ
- **"RefererNotAllowedMapError"**: Добавьте домен в ограничения API ключа

## Стоимость

- **Maps JavaScript API**: $7 за 1000 загрузок карты
- **Places API**: $17 за 1000 запросов
- **Бесплатный лимит**: $200 в месяц (достаточно для разработки)

## Альтернативы

Если не хотите использовать Google Maps, можно заменить на:
- **OpenStreetMap** с Leaflet (бесплатно)
- **Mapbox** (есть бесплатный тариф)
- **Yandex Maps** (для России/СНГ)
