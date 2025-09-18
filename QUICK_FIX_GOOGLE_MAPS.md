# 🚨 Быстрое исправление ошибки InvalidKeyMapError

## ❌ Проблема
```
Google Maps JavaScript API error: InvalidKeyMapError
```

## ✅ Решение за 5 минут

### 1. Получите новый API ключ
1. Идите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите **Maps JavaScript API**
4. Создайте API ключ в разделе "Credentials"
5. **ВАЖНО**: Включите биллинг (есть бесплатный лимит $200/месяц)

### 2. Замените ключ в файле
Откройте `poi-collector-standalone.html` и найдите строку:
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places&callback=initMap"></script>
```

Замените `YOUR_API_KEY_HERE` на ваш новый ключ:
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyC...&libraries=places&callback=initMap"></script>
```

### 3. Настройте ограничения (опционально)
В Google Cloud Console:
1. Выберите ваш API ключ
2. В "Application restrictions" выберите "HTTP referrers"
3. Добавьте: `localhost:*` и `127.0.0.1:*`

### 4. Тестирование
1. Откройте `test-google-maps.html` в браузере
2. Замените ключ в этом файле тоже
3. Если карта загрузилась - все работает!

## 🔧 Альтернативное решение

Если не хотите настраивать Google Maps, можно использовать OpenStreetMap (бесплатно):

1. Замените Google Maps на Leaflet
2. Никаких API ключей не нужно
3. Полностью бесплатно

Хотите, чтобы я переделал приложение на OpenStreetMap?

## 📞 Если не помогло

1. Проверьте, что биллинг включен
2. Убедитесь, что Maps JavaScript API включен
3. Проверьте, что ключ скопирован полностью
4. Попробуйте создать новый ключ

## 🎯 Тестовый файл

Используйте `test-google-maps.html` для проверки ключа - он покажет точную ошибку!
