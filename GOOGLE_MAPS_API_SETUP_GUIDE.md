# 🗺️ Полное руководство по настройке Google Maps API

## ❌ Проблема: InvalidKeyMapError

Эта ошибка означает, что ваш API ключ недействителен или неправильно настроен.

## ✅ Решение: Пошаговая настройка

### Шаг 1: Создание проекта в Google Cloud Console

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Войдите в свой Google аккаунт
3. Нажмите "Создать проект" или выберите существующий
4. Дайте проекту название (например, "POI Collector")

### Шаг 2: Включение необходимых API

1. В левом меню выберите "APIs & Services" → "Library"
2. Найдите и включите следующие API:
   - **Maps JavaScript API** (обязательно)
   - **Places API** (опционально, для дополнительных функций)
   - **Geocoding API** (опционально)

### Шаг 3: Создание API ключа

1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "API Key"
3. Скопируйте созданный ключ (начинается с `AIza...`)

### Шаг 4: Настройка ограничений (рекомендуется)

1. Нажмите на созданный API ключ
2. В разделе "Application restrictions" выберите "HTTP referrers"
3. Добавьте разрешенные домены:
   - `localhost:*` (для разработки)
   - `127.0.0.1:*` (для локального тестирования)
   - `yourdomain.com/*` (для продакшена)
4. В разделе "API restrictions" выберите "Restrict key"
5. Выберите только нужные API (Maps JavaScript API, Places API)

### Шаг 5: Настройка биллинга

⚠️ **ВАЖНО**: Google Maps API требует включенный биллинг!

1. Перейдите в "Billing" в левом меню
2. Привяжите банковскую карту к проекту
3. Не волнуйтесь - есть бесплатный лимит $200/месяц

## 🔧 Настройка в приложении

### Для standalone версии:

1. Откройте `poi-collector-standalone.html`
2. Найдите строку:
   ```html
   <script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places&callback=initMap"></script>
   ```
3. Замените `YOUR_API_KEY_HERE` на ваш реальный ключ:
   ```html
   <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyC...&libraries=places&callback=initMap"></script>
   ```

### Для React версии:

1. Создайте файл `.env` в папке `frontend/`:
   ```bash
   REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyC...
   ```
2. Перезапустите сервер разработки:
   ```bash
   npm run dev
   ```

## 🧪 Тестирование

1. Откройте приложение в браузере
2. Откройте Developer Tools (F12)
3. Перейдите на вкладку "Console"
4. Если все настроено правильно, вы увидите карту без ошибок

## 💰 Стоимость

- **Maps JavaScript API**: $7 за 1000 загрузок карты
- **Places API**: $17 за 1000 запросов
- **Бесплатный лимит**: $200 в месяц
- **Для разработки**: Обычно бесплатно (в пределах лимита)

## 🚨 Частые ошибки

### 1. "This page can't load Google Maps correctly"
- **Причина**: Неправильный API ключ
- **Решение**: Проверьте ключ в Google Cloud Console

### 2. "RefererNotAllowedMapError"
- **Причина**: Домен не добавлен в ограничения
- **Решение**: Добавьте `localhost:*` в HTTP referrers

### 3. "BillingNotEnabledMapError"
- **Причина**: Не включен биллинг
- **Решение**: Привяжите карту в Google Cloud Console

### 4. "For development purposes only"
- **Причина**: Ключ работает, но есть предупреждение
- **Решение**: Это нормально для тестирования

## 🔒 Безопасность

1. **Никогда не коммитьте API ключи в Git**
2. **Используйте переменные окружения**
3. **Настройте ограничения по доменам**
4. **Регулярно ротируйте ключи**

## 📞 Поддержка

Если проблемы продолжаются:
1. Проверьте [Google Maps Error Messages](https://developers.google.com/maps/documentation/javascript/error-messages)
2. Обратитесь в [Google Cloud Support](https://cloud.google.com/support)
3. Проверьте статус API на [Google Cloud Status](https://status.cloud.google.com/)

## 🎯 Быстрый тест

Создайте простой HTML файл для тестирования:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Google Maps Test</title>
</head>
<body>
    <div id="map" style="height: 400px; width: 100%;"></div>
    <script>
        function initMap() {
            const map = new google.maps.Map(document.getElementById("map"), {
                zoom: 10,
                center: { lat: 51.1283, lng: 71.4305 },
            });
        }
    </script>
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=ВАШ_КЛЮЧ&callback=initMap"></script>
</body>
</html>
```

Если этот файл работает, значит ключ настроен правильно!
