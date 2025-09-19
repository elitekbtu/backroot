# BackRoot - AR Voice-to-Voice AI Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-19.1.1-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/FastAPI-0.104.1-green?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.3-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Latest-blue?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Docker-Compose-blue?style=for-the-badge&logo=docker" />
</div>

## 🚀 О проекте

**BackRoot** - это инновационная платформа, объединяющая технологии дополненной реальности (AR), искусственного интеллекта и голосового взаимодействия. Проект позволяет пользователям взаимодействовать с AI-аватарами через голос в реальном времени, управлять виртуальными криптовалютными монетами в AR-пространстве и получать контекстную информацию на основе геолокации.

## ✨ Основные возможности

### 🎤 Voice-to-Voice AI
- **Реальное время**: Голосовое общение с AI-аватаром без задержек
- **Многоязычность**: Поддержка английского и казахского языков
- **Lip Sync**: Синхронизация движений губ аватара с речью
- **Эмоции**: Динамическое изменение настроения аватара на основе контекста

### 🥽 Augmented Reality
- **AR Coin System**: Создание и управление виртуальными криптовалютными монетами
- **3D Модели**: Загрузка и отображение 3D-моделей в AR-пространстве
- **Интерактивность**: Взаимодействие с виртуальными объектами
- **Масштабирование**: Настройка размера и позиционирования объектов

### 📍 Геолокация и контекст
- **Умная геолокация**: Автоматическое определение местоположения
- **Контекстная информация**: Получение данных о городе, достопримечательностях
- **Погодные данные**: Интеграция с погодными API
- **Временные зоны**: Поддержка различных часовых поясов

### 🎨 Современный UI/UX
- **Адаптивный дизайн**: Оптимизация для мобильных устройств и киосков
- **Темная тема**: Современный интерфейс с поддержкой темной темы
- **Интуитивность**: Простой и понятный пользовательский интерфейс

## 🏗️ Архитектура

### Frontend (React + TypeScript)
- **React 19.1.1** с современными хуками
- **TypeScript** для типобезопасности
- **Tailwind CSS** для стилизации
- **Three.js** для 3D-графики и AR
- **WebRTC** для голосового взаимодействия

### Backend (FastAPI + Python)
- **FastAPI** для высокопроизводительного API
- **WebSocket** для real-time коммуникации
- **PostgreSQL** для хранения данных
- **Alembic** для миграций базы данных
- **JWT** для аутентификации

### AI/ML Сервисы
- **OpenAI GPT-4** для обработки естественного языка
- **OpenAI TTS/STT** для преобразования речи
- **Groq** как альтернативный AI-провайдер
- **Custom Lip Sync** алгоритмы для синхронизации

## 🚀 Быстрый старт

### Предварительные требования
- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)
- Python 3.9+ (для локальной разработки)

### Установка

1. **Клонирование репозитория**
```bash
git clone https://github.com/elitekbtu/backroot.git
cd backroot
```

2. **Настройка окружения**
```bash
cp env.example .env
```

3. **Настройка переменных окружения**
Отредактируйте файл `.env`:
```env
# База данных
POSTGRES_DB=backdb
POSTGRES_USER=backroot
POSTGRES_PASSWORD=backpass
DATABASE_URL=postgresql+psycopg2://backroot:backpass@postgres_db:5432/backdb

# Безопасность
SECRET_KEY=your_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=120
REFRESH_TOKEN_EXPIRE_DAYS=14

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
OPENAI_TTS_MODEL=tts-1
OPENAI_STT_MODEL=whisper-1

# Groq (альтернативный AI)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

4. **Запуск приложения**
```bash
docker-compose up --build -d
```

5. **Доступ к приложению**
- Frontend: http://localhost:443
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📁 Структура проекта

```
backroot/
├── frontend/                 # React приложение
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── api/            # API клиенты
│   │   ├── context/        # React контексты
│   │   ├── hooks/          # Кастомные хуки
│   │   └── types/          # TypeScript типы
│   └── public/             # Статические файлы
├── backend/                 # FastAPI приложение
│   ├── app/
│   │   ├── api/            # API роутеры
│   │   ├── core/           # Основная конфигурация
│   │   ├── database/       # Модели базы данных
│   │   └── services/       # Бизнес-логика
│   └── alembic/            # Миграции БД
├── docker-compose.yml       # Docker конфигурация
└── README.md               # Документация
```

## 🔧 Разработка

### Локальная разработка Frontend
```bash
cd frontend
npm install
npm run dev
```

### Локальная разработка Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Миграции базы данных
```bash
cd backend
alembic upgrade head
```

## 🎯 Основные функции

### 1. Аутентификация
- Регистрация и вход пользователей
- JWT токены для безопасности
- Защищенные маршруты

### 2. Voice-to-Voice AI
- Запись голоса в реальном времени
- Преобразование речи в текст (STT)
- Обработка запросов через AI
- Преобразование ответов в речь (TTS)
- Синхронизация движений губ

### 3. AR Coin System
- Создание виртуальных криптовалютных монет
- Загрузка 3D-моделей
- Настройка позиционирования в AR
- Управление коллекцией монет

### 4. Геолокация
- Автоматическое определение местоположения
- Получение информации о городе
- Интеграция с погодными сервисами
- Контекстные рекомендации

## 🌐 API Endpoints

### Аутентификация
- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход
- `POST /api/v1/auth/refresh` - Обновление токена

### Voice-to-Voice
- `WebSocket /api/v1/realtime/ws/{user_id}` - Realtime соединение
- `WebSocket /api/v1/realtime/ws/{user_id}/audio` - Аудио обработка

### AR Coins
- `GET /api/v1/coins` - Получить список монет
- `POST /api/v1/coins` - Создать монету
- `PUT /api/v1/coins/{id}` - Обновить монету
- `DELETE /api/v1/coins/{id}` - Удалить монету

### Геолокация
- `GET /api/v1/location/current` - Текущее местоположение
- `GET /api/v1/location/context` - Контекстная информация

## 🛠️ Технологии

### Frontend
- **React 19.1.1** - UI библиотека
- **TypeScript 5.8.3** - Типизация
- **Vite 7.1.2** - Сборщик
- **Tailwind CSS 3.4.17** - Стилизация
- **Three.js 0.180.0** - 3D графика
- **React Three Fiber** - React интеграция с Three.js
- **AR.js** - Дополненная реальность

### Backend
- **FastAPI** - Web фреймворк
- **PostgreSQL** - База данных
- **SQLAlchemy** - ORM
- **Alembic** - Миграции
- **Pydantic** - Валидация данных
- **WebSockets** - Real-time коммуникация

### AI/ML
- **OpenAI API** - GPT-4, TTS, STT
- **Groq API** - Альтернативный AI
- **Custom Lip Sync** - Синхронизация губ

### DevOps
- **Docker** - Контейнеризация
- **Docker Compose** - Оркестрация
- **Nginx** - Reverse proxy
- **SSL/TLS** - Безопасность

## 👥 Команда

| Роль | Имя | Описание |
|------|-----|----------|
| **Капитан команды** | Birkhanym Kazhymukhamet | Руководство проектом, стратегическое планирование |
| **CTO** | Beknur Tanibergen | Database, Разработка models |
| **ML Engineer** | Almas Issakov | AI/ML алгоритмы, голосовые технологии |
| **Sorfware Engineer** | Satbaldiyev Turarbek | End-to-end разработка, UI/UX |

## 📈 Roadmap

### Phase 1 (Текущая) ✅
- [x] Базовая аутентификация
- [x] Voice-to-Voice AI
- [x] AR Coin System
- [x] Геолокация

### Phase 2 (В разработке) 🚧
- [ ] Расширенная аналитика
- [ ] Мобильное приложение
- [ ] Социальные функции
- [ ] Платежная интеграция

### Phase 3 (Планируется) 📋
- [ ] VR поддержка
- [ ] Blockchain интеграция
- [ ] Enterprise функции
- [ ] Многоязычная поддержка

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста, следуйте следующим шагам:

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 📞 Контакты

- **Email**: team@theb2r.com
- **Website**: https://theb2r.com
- **GitHub**: https://github.com/elitekbtu/backroot

## 🙏 Благодарности

- OpenAI за предоставление мощных AI API
- Three.js сообществу за отличную 3D библиотеку
- React команде за инновационный фреймворк
- FastAPI за высокопроизводительный backend

---

<div align="center">
  <p>Сделано с ❤️ командой BackRoot</p>
  <p>© 2024 BackRoot. Все права защищены.</p>
</div>
