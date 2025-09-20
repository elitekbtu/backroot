# Universal Nginx Configuration Guide

## 🎯 Что это?

**Один nginx.conf файл** для всех окружений! Автоматически работает:
- **Локально**: `http://localhost` (без SSL, быстрая разработка)
- **На сервере**: `https://theb2r.com` (с SSL, полная безопасность)

## ⚡ Быстрый старт

```bash
# Локальная разработка
./switch-mode.sh local

# Production деплой
./switch-mode.sh prod

# Проверка статуса
./switch-mode.sh status
```

## 🚀 Как это работает?

Nginx автоматически определяет окружение по `server_name`:

```nginx
# Если запрос к theb2r.com или www.theb2r.com → редирект на HTTPS
if ($host ~ ^(theb2r\.com|www\.theb2r\.com)$) {
    return 301 https://$host$request_uri;
}

# Если запрос к localhost → обслуживаем напрямую по HTTP
```

## 📁 Структура файлов

```
frontend/
└── nginx.conf              # ⭐ ЕДИНСТВЕННАЯ конфигурация для всего

docker-compose.yml          # Docker конфигурация (работает везде)

# Скрипты управления:
switch-mode.sh              # 🎛️  Переключение режимов (local/prod)
init-letsencrypt.sh         # 🔒 Первоначальная настройка SSL
ssl-renew.sh               # 🔄 Автообновление сертификатов
check-ssl.sh               # 🔍 Проверка конфигурации
```

## 🔧 Локальная разработка

```bash
# Простой способ
./switch-mode.sh local

# Или вручную
docker-compose up -d
```

**Доступ:**
- 🌐 http://localhost - ваше приложение
- 🔌 http://localhost/api - backend API  
- 🔄 ws://localhost/ws - WebSockets

**Особенности localhost:**
- ✅ HTTP (без SSL, быстро)
- ✅ Короткое кэширование (1 час)
- ✅ CORS разрешен
- ❌ Нет security headers
- ❌ Нет rate limiting

## 🌐 Production деплой

```bash
# Обновите email в init-letsencrypt.sh (строка 13)
nano init-letsencrypt.sh

# Простой способ
./switch-mode.sh prod

# Или вручную
./init-letsencrypt.sh
```

**Доступ:**
- 🌐 https://theb2r.com - основной сайт
- 🔒 https://www.theb2r.com - с www

**Особенности production:**
- ✅ HTTPS с Let's Encrypt
- ✅ HTTP → HTTPS редирект  
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ Rate limiting (защита от атак)
- ✅ Длинное кэширование (1 год)
- ✅ Блокировка доступа по IP

## 🔄 Управление режимами

### Переключение одной командой

```bash
# Локальная разработка
./switch-mode.sh local

# Production
./switch-mode.sh prod

# Проверка текущего статуса
./switch-mode.sh status
./switch-mode.sh        # то же самое
```

### Скрипты управления

```bash
# 🎛️ Переключение режимов
./switch-mode.sh local    # Локальная разработка
./switch-mode.sh prod     # Production деплой

# 🔍 Проверка конфигурации
./check-ssl.sh           # Проверить всё
./check-ssl.sh local     # Только localhost
./check-ssl.sh prod      # Только production

# 🔒 SSL управление
./init-letsencrypt.sh    # Первоначальная настройка
./ssl-renew.sh           # Обновление сертификатов
```

## 🧪 Тестирование

### Локальное тестирование

```bash
# Проверка HTTP
curl -I http://localhost

# Проверка API
curl http://localhost/api/health

# Проверка статики
curl -I http://localhost/coin.glb
```

### Production тестирование

```bash
# Проверка редиректа HTTP → HTTPS
curl -I http://theb2r.com

# Проверка HTTPS
curl -I https://theb2r.com

# Проверка SSL сертификата
./check-ssl.sh
```

## 📊 Различия между окружениями

| Функция | Localhost | Production |
|---------|-----------|------------|
| Протокол | HTTP | HTTPS |
| Порт | 80 | 80 → 443 |
| SSL | ❌ | ✅ |
| Security Headers | ❌ | ✅ |
| Rate Limiting | ❌ | ✅ |
| Кэширование | 1 час | 1 год |
| Логирование | Базовое | Детальное |
| ACME Challenge | ❌ | ✅ |
| IP блокировка | ❌ | ✅ |

## 🔧 Кастомизация

### Добавить новый домен

В `nginx.conf` найдите и обновите:

```nginx
server_name localhost theb2r.com www.theb2r.com your-new-domain.com;

if ($host ~ ^(theb2r\.com|www\.theb2r\.com|your-new-domain\.com)$) {
    return 301 https://$host$request_uri;
}
```

### Изменить время кэширования

```nginx
# Для localhost
set $cache_time "2h";  # было 1h

# Для production
if ($host ~ ^(theb2r\.com|www\.theb2r\.com)$) {
    set $cache_time "6M";  # было 1y
}
```

### Добавить новые API endpoints

```nginx
location /api/v2/ {
    proxy_pass http://backend:8000;
    # ... остальные настройки
}
```

## 🛠️ Troubleshooting

### Проблема: Nginx не стартует

1. **Отсутствуют SSL сертификаты**:
   ```bash
   # Временно закомментируйте HTTPS default_server блок
   # или используйте dev версию
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Конфликт портов**:
   ```bash
   # Проверьте что порты свободны
   netstat -tulpn | grep :80
   netstat -tulpn | grep :443
   ```

### Проблема: API не работает локально

```bash
# Проверьте что backend запущен
docker-compose -f docker-compose.dev.yml ps

# Проверьте логи
docker-compose -f docker-compose.dev.yml logs backend
```

### Проблема: SSL не работает на production

```bash
# Проверьте DNS
dig theb2r.com

# Проверьте сертификаты
./check-ssl.sh

# Пересоздайте сертификаты
./init-letsencrypt.sh
```

## 🎉 Преимущества этого подхода

1. **Один конфиг** - не нужно поддерживать разные файлы
2. **Автоматическое определение** - nginx сам понимает где он запущен
3. **Безопасность** - production получает все security features
4. **Удобство разработки** - localhost работает без SSL
5. **Легкий деплой** - один и тот же конфиг везде

Теперь у вас есть универсальная nginx конфигурация! 🚀
