# 🚀 Poker Simulator - Готов к деплою!

## ✅ Исправленные проблемы

### 1. Git установлен и настроен
- ✅ Git установлен через winget
- ✅ Настроены user.name и user.email
- ✅ Создан первый коммит

### 2. Исправлены ошибки TypeScript
- ✅ Удалены неиспользуемые переменные в HandRangeMatrix.tsx
- ✅ Удален неиспользуемый импорт PokerTable в GamePage.tsx
- ✅ Удалены неиспользуемые переменные betAmount и setBetAmount

### 3. Освобождены порты
- ✅ Остановлены процессы на портах 3000 и 5000
- ✅ Приложение готово к запуску

## 🎯 Быстрый деплой (5 минут)

### Шаг 1: Создайте GitHub репозиторий
1. Идите на https://github.com/new
2. Название: `poker-simulator`
3. Описание: `🎯 Multiplayer Poker Simulator with Hand Ranges`
4. Публичный репозиторий
5. Нажмите "Create repository"

### Шаг 2: Загрузите код
```bash
git remote add origin https://github.com/ВАШ_USERNAME/poker-simulator.git
git branch -M main
git push -u origin main
```

### Шаг 3: Деплой на Vercel (РЕКОМЕНДУЕТСЯ)
1. Идите на https://vercel.com
2. Войдите через GitHub
3. Нажмите "New Project"
4. Выберите ваш репозиторий `poker-simulator`
5. Настройки:
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/build`
   - **Install Command**: `npm install && cd client && npm install`
6. Нажмите "Deploy"

### Шаг 4: Настройка переменных окружения
В Vercel добавьте переменную:
- `NODE_ENV` = `production`

## 🌐 Альтернативные варианты деплоя

### Heroku
```bash
# Установите Heroku CLI
npm install -g heroku

# Войдите в Heroku
heroku login

# Создайте приложение
heroku create your-poker-app

# Деплой
git push heroku main

# Откройте приложение
heroku open
```

### Railway
1. Идите на https://railway.app
2. Войдите через GitHub
3. Нажмите "New Project"
4. Выберите "Deploy from GitHub repo"
5. Выберите ваш репозиторий
6. Railway автоматически определит настройки

### Netlify
1. Идите на https://netlify.com
2. Войдите через GitHub
3. Нажмите "New site from Git"
4. Выберите ваш репозиторий
5. Настройки:
   - **Build command**: `npm run build`
   - **Publish directory**: `client/build`

## 🔧 Локальный запуск

### Терминал 1 (Сервер):
```bash
npm run server
```

### Терминал 2 (Клиент):
```bash
cd client
npm start
```

Откройте http://localhost:3000

## 📋 Функции приложения

### ✅ Основные возможности
- 🎯 Мультиплеер покер симулятор
- 🎴 Настройка hand ranges для каждого игрока
- 📊 Анализ префлоп действий
- 🎮 Реальное время игры через WebSocket
- 📤 Экспорт Hand History для Hand2Note
- 🎨 Красивый современный интерфейс

### ✅ Технические особенности
- ⚡ React + TypeScript фронтенд
- 🚀 Node.js + Express + WebSocket бэкенд
- 🎴 Поддержка изображений карт
- 📱 Адаптивный дизайн
- 🔄 Автоматическое обновление состояния игры

## 🎮 Как играть

1. **Настройка сессии**:
   - Выберите hand ranges для каждого игрока
   - Загрузите префлоп файл (опционально)
   - Настройте размеры ставок

2. **Начало игры**:
   - Нажмите "Начать игру"
   - Каждый игрок присоединяется к своему столу
   - Играйте в реальном времени

3. **Анализ**:
   - Экспортируйте Hand History
   - Анализируйте в Hand2Note или других трекерах

## 🆘 Поддержка

Если возникли проблемы:

1. **Проверьте порты**: убедитесь что 3000 и 5000 свободны
2. **Обновите зависимости**: `npm install && cd client && npm install`
3. **Очистите кэш**: `npm run clean` (если есть)
4. **Проверьте логи**: откройте Developer Tools в браузере

## 🎉 Готово!

Ваш покер симулятор готов к использованию! 

**Следующие шаги**:
1. Создайте GitHub репозиторий
2. Выберите платформу для деплоя (рекомендуется Vercel)
3. Поделитесь ссылкой с друзьями
4. Наслаждайтесь игрой! 🎯

---

*Создано с ❤️ для покерного сообщества* 