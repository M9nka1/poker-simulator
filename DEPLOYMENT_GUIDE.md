# 🚀 Руководство по размещению на GitHub и деплою

Пошаговое руководство по размещению покерного симулятора на GitHub и развертыванию в интернете.

## 📋 Этап 1: Подготовка к GitHub

### 1.1 Установка Git (если не установлен)

**Windows:**
```bash
# Скачайте Git с официального сайта
https://git-scm.com/download/win
```

**Проверка установки:**
```bash
git --version
```

### 1.2 Настройка Git
```bash
# Настройте имя пользователя
git config --global user.name "Ваше Имя"

# Настройте email
git config --global user.email "your-email@example.com"
```

### 1.3 Создание аккаунта GitHub
1. Перейдите на [github.com](https://github.com)
2. Нажмите **"Sign up"**
3. Заполните форму регистрации
4. Подтвердите email

## 📦 Этап 2: Размещение на GitHub

### 2.1 Создание репозитория на GitHub

1. **Войдите в GitHub**
2. **Нажмите "+" в правом верхнем углу**
3. **Выберите "New repository"**
4. **Заполните данные:**
   - Repository name: `poker-simulator`
   - Description: `Профессиональный покерный симулятор`
   - ✅ Public (или Private по желанию)
   - ✅ Add a README file (снимите галочку, у нас уже есть)
   - ❌ Add .gitignore (у нас уже есть)
   - ❌ Choose a license (у нас уже есть в README)

5. **Нажмите "Create repository"**

### 2.2 Инициализация локального репозитория

Откройте PowerShell в папке проекта:

```bash
# Перейдите в папку проекта
cd C:\poker_SIM

# Инициализируйте Git репозиторий
git init

# Добавьте все файлы
git add .

# Создайте первый коммит
git commit -m "Initial commit: Poker Simulator v1.0"

# Добавьте удаленный репозиторий (замените YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/poker-simulator.git

# Отправьте код на GitHub
git branch -M main
git push -u origin main
```

### 2.3 Проверка загрузки
1. Обновите страницу репозитория на GitHub
2. Убедитесь, что все файлы загружены
3. Проверьте, что README.md отображается корректно

## 🌐 Этап 3: Деплой в интернет

### 🚀 Вариант 1: Heroku (Рекомендуется)

#### 3.1 Подготовка к Heroku

**Создайте файл Procfile:**
```bash
echo "web: node server/index.js" > Procfile
```

**Создайте файл Procfile в корне проекта:**
```
web: node server/index.js
```

**Убедитесь, что PORT настроен правильно (уже готово):**
```javascript
const PORT = process.env.PORT || 5000;
```

#### 3.2 Установка Heroku CLI

**Windows:**
1. Скачайте с [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
2. Установите и перезапустите терминал

**Проверка:**
```bash
heroku --version
```

#### 3.3 Деплой на Heroku

```bash
# Войдите в Heroku
heroku login

# Создайте приложение (замените YOUR_APP_NAME)
heroku create your-poker-simulator

# Добавьте buildpack для Node.js
heroku buildpacks:set heroku/nodejs

# Деплой
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main

# Откройте приложение
heroku open
```

**Ваше приложение будет доступно по адресу:**
`https://your-poker-simulator.herokuapp.com`

### 🌟 Вариант 2: Vercel (Простой)

#### 3.1 Подготовка для Vercel

**Создайте файл vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/build/$1"
    }
  ]
}
```

#### 3.2 Деплой на Vercel

```bash
# Установите Vercel CLI
npm install -g vercel

# Войдите в аккаунт
vercel login

# Деплой
vercel --prod
```

### 🚂 Вариант 3: Railway (Автоматический)

#### 3.1 Подготовка для Railway

**Создайте файл railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 3.2 Деплой на Railway

1. **Перейдите на [railway.app](https://railway.app)**
2. **Войдите через GitHub**
3. **Нажмите "New Project"**
4. **Выберите "Deploy from GitHub repo"**
5. **Выберите ваш репозиторий poker-simulator**
6. **Railway автоматически развернет приложение**

**Ваше приложение будет доступно по адресу:**
`https://your-app-name.up.railway.app`

### 🔧 Вариант 4: DigitalOcean App Platform

#### 4.1 Подготовка

**Создайте файл .do/app.yaml:**
```yaml
name: poker-simulator
services:
- name: web
  source_dir: /
  github:
    repo: YOUR_USERNAME/poker-simulator
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
```

#### 4.2 Деплой на DigitalOcean

1. **Перейдите на [cloud.digitalocean.com](https://cloud.digitalocean.com)**
2. **Создайте аккаунт**
3. **Перейдите в "Apps"**
4. **Нажмите "Create App"**
5. **Подключите GitHub репозиторий**
6. **Следуйте инструкциям мастера**

## 🔄 Этап 4: Синхронизация и обновления

### 4.1 Рабочий процесс разработки

```bash
# Внесите изменения в код
# Добавьте изменения в Git
git add .

# Создайте коммит с описанием
git commit -m "Добавлена новая функция: размер карт"

# Отправьте на GitHub
git push origin main

# Для Heroku (автоматический деплой при push)
git push heroku main
```

### 4.2 Настройка автоматического деплоя

#### Heroku + GitHub
1. **В панели Heroku перейдите в "Deploy"**
2. **Выберите "GitHub" как deployment method**
3. **Подключите репозиторий**
4. **Включите "Automatic deploys"**
5. **Выберите ветку "main"**

#### Vercel + GitHub
1. **Vercel автоматически отслеживает изменения**
2. **При каждом push происходит автоматический деплой**
3. **Получайте уведомления о статусе деплоя**

#### Railway + GitHub
1. **Railway автоматически деплоит при push**
2. **Настройте переменные окружения в панели**
3. **Мониторьте логи в реальном времени**

### 4.3 Переменные окружения

**Для продакшена добавьте переменные:**

```bash
# Heroku
heroku config:set NODE_ENV=production
heroku config:set PORT=5000

# Vercel (через панель управления)
NODE_ENV=production

# Railway (через панель управления)
NODE_ENV=production
```

## 🔍 Этап 5: Тестирование и мониторинг

### 5.1 Проверка работоспособности

**После деплоя проверьте:**
- ✅ Главная страница загружается
- ✅ Создание новой игры работает
- ✅ WebSocket соединение устанавливается
- ✅ Мультитейблинг функционирует
- ✅ Экспорт hand history работает

### 5.2 Мониторинг

**Heroku:**
```bash
# Просмотр логов
heroku logs --tail

# Мониторинг производительности
heroku ps
```

**Vercel:**
- Панель управления с аналитикой
- Автоматические уведомления об ошибках

**Railway:**
- Встроенный мониторинг
- Логи в реальном времени
- Метрики производительности

## 🛠️ Этап 6: Настройка домена (опционально)

### 6.1 Покупка домена
1. **Купите домен на [namecheap.com](https://namecheap.com) или [godaddy.com](https://godaddy.com)**
2. **Например: `poker-simulator.com`**

### 6.2 Настройка DNS

**Heroku:**
```bash
# Добавьте домен
heroku domains:add poker-simulator.com

# Получите DNS target
heroku domains
```

**Vercel:**
1. **В панели Vercel перейдите в "Domains"**
2. **Добавьте ваш домен**
3. **Настройте DNS записи у регистратора**

### 6.3 SSL сертификат
- **Heroku:** Автоматический SSL
- **Vercel:** Автоматический SSL
- **Railway:** Автоматический SSL

## 📊 Этап 7: Аналитика и SEO

### 7.1 Google Analytics

**Добавьте в client/public/index.html:**
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

### 7.2 SEO оптимизация

**Обновите client/public/index.html:**
```html
<meta name="description" content="Профессиональный покерный симулятор для изучения техасского холдема">
<meta name="keywords" content="покер, симулятор, техасский холдем, обучение">
<meta property="og:title" content="Покерный Симулятор">
<meta property="og:description" content="Изучайте покер с профессиональным симулятором">
<meta property="og:image" content="/poker-preview.jpg">
```

## 🎯 Итоговый чеклист

### ✅ GitHub
- [ ] Репозиторий создан
- [ ] Код загружен
- [ ] README.md оформлен
- [ ] .gitignore настроен

### ✅ Деплой
- [ ] Платформа выбрана (Heroku/Vercel/Railway)
- [ ] Приложение развернуто
- [ ] Домен настроен (опционально)
- [ ] SSL сертификат активен

### ✅ Функциональность
- [ ] Сайт открывается
- [ ] Игра работает
- [ ] WebSocket соединение стабильно
- [ ] Мультитейблинг функционирует

### ✅ Мониторинг
- [ ] Логи настроены
- [ ] Аналитика подключена
- [ ] Уведомления об ошибках настроены

## 🚀 Поздравляем!

Ваш покерный симулятор теперь доступен в интернете! 

**Поделитесь ссылкой с друзьями и наслаждайтесь игрой онлайн! 🎯♠️♥️♦️♣️**

---

**Нужна помощь?** Создайте issue в GitHub репозитории или обратитесь к документации выбранной платформы. 