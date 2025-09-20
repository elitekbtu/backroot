# 🚀 Quick Start Guide

**Universal nginx setup - один конфиг для всех окружений!**

## ⚡ Быстрый запуск

```bash
# 🏠 Локальная разработка
./switch-mode.sh local
# → http://localhost

# 🌐 Production деплой
./switch-mode.sh prod  
# → https://theb2r.com
```

## 📋 Первоначальная настройка

1. **Настройте email для SSL:**
   ```bash
   nano init-letsencrypt.sh
   # Измените строку 13: email="ваш-email@example.com"
   ```

2. **Убедитесь что DNS настроен:**
   - `theb2r.com` → `46.101.187.24`
   - `www.theb2r.com` → `46.101.187.24`

## 🎛️ Команды управления

```bash
# Переключение режимов
./switch-mode.sh local      # Локальная разработка
./switch-mode.sh prod       # Production с SSL
./switch-mode.sh status     # Текущий статус

# Проверка конфигурации  
./check-ssl.sh             # Полная проверка
./check-ssl.sh local       # Только localhost
./check-ssl.sh prod        # Только production

# SSL управление
./init-letsencrypt.sh      # Первичная настройка SSL
./ssl-renew.sh            # Обновление сертификатов
```

## 🔄 Автообновление SSL

```bash
# Добавить в crontab
crontab -e

# Добавить эту строку для автообновления в полдень
0 12 * * * /path/to/your/project/ssl-renew.sh
```

## 🧪 Проверка работы

```bash
# Локально
curl -I http://localhost

# Production  
curl -I https://theb2r.com
```

## 📊 Различия режимов

| Функция | Local | Production |
|---------|-------|------------|
| Протокол | HTTP | HTTPS |
| SSL | ❌ | ✅ Let's Encrypt |
| Security Headers | ❌ | ✅ |
| Rate Limiting | ❌ | ✅ |
| Кэширование | 1 час | 1 год |
| Домен | localhost | theb2r.com |

## 🛠️ Troubleshooting

**Nginx не стартует?**
```bash
docker-compose logs frontend
```

**SSL не работает?**
```bash
./check-ssl.sh prod
```

**Порты заняты?**
```bash
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

## 📖 Подробная документация

См. [UNIVERSAL_NGINX_GUIDE.md](UNIVERSAL_NGINX_GUIDE.md)

---

**Главная особенность:** Один файл `nginx.conf` автоматически работает везде! 🎉
