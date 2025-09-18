# HTTPS Setup Guide

## Текущая конфигурация

Проект настроен для работы с HTTPS с использованием самоподписанных сертификатов для разработки.

### Что было настроено:

1. **SSL сертификаты**: Созданы самоподписанные сертификаты в директории `ssl/`
2. **Nginx конфигурация**: Обновлена для поддержки HTTPS с редиректом с HTTP на HTTPS
3. **Docker конфигурация**: Добавлены порты 443 и монтирование SSL сертификатов
4. **CORS настройки**: Обновлены для поддержки HTTPS доменов

## Запуск с HTTPS

```bash
# Пересобрать контейнеры
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Проверить логи
docker-compose logs frontend
```

## Доступ к приложению

- HTTP: http://46.101.187.24 (автоматически редиректит на HTTPS)
- HTTPS: https://46.101.187.24

**Примечание**: Браузер покажет предупреждение о самоподписанном сертификате. Это нормально для разработки.

## Настройка для продакшена

### 1. Получение реального SSL сертификата

Для продакшена рекомендуется использовать Let's Encrypt:

```bash
# Установить certbot
sudo apt-get update
sudo apt-get install certbot

# Получить сертификат
sudo certbot certonly --standalone -d yourdomain.com

# Сертификаты будут в /etc/letsencrypt/live/yourdomain.com/
```

### 2. Обновление nginx.conf для продакшена

Замените пути к сертификатам:

```nginx
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

### 3. Автоматическое обновление сертификатов

Добавьте в crontab:

```bash
# Обновление сертификатов каждые 2 месяца
0 0 1 */2 * certbot renew --quiet && docker-compose restart frontend
```

### 4. Обновление CORS для продакшена

В `backend/app/core/config.py` замените:

```python
BACKEND_CORS_ORIGINS: list[str] = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    # Удалите "*" для безопасности
]
```

## Безопасность

1. **HSTS**: Включен заголовок Strict-Transport-Security
2. **SSL протоколы**: Используются только TLSv1.2 и TLSv1.3
3. **Шифрование**: Настроены безопасные cipher suites
4. **Заголовки безопасности**: Добавлены X-Frame-Options, X-Content-Type-Options и др.

## Проверка SSL

```bash
# Проверить SSL конфигурацию
openssl s_client -connect 46.101.187.24:443 -servername 46.101.187.24

# Проверить с помощью curl
curl -I https://46.101.187.24
```

## Troubleshooting

1. **Ошибка "SSL certificate problem"**: Убедитесь, что сертификаты правильно смонтированы в контейнер
2. **Порт 443 недоступен**: Проверьте, что порт 443 открыт в файрволе
3. **CORS ошибки**: Убедитесь, что HTTPS домен добавлен в BACKEND_CORS_ORIGINS
