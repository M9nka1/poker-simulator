# 🚀 Простой деплой - Решение проблемы 404

## ❌ Проблема
Ошибка `404: NOT_FOUND` при деплое означает, что платформа не может найти правильные файлы для сборки.

## ✅ Решение: 3 простых способа

### 🥇 Способ 1: Render (САМЫЙ ПРОСТОЙ)

1. **Идите на https://render.com**
2. **Войдите через GitHub**
3. **New → Web Service**
4. **Подключите репозиторий `M9nka1/poker-simulator`**
5. **Настройки:**
   ```
   Name: poker-simulator
   Environment: Node
   Build Command: npm install && cd client && npm install && npm run build
   Start Command: npm start
   ```
6. **Deploy**

### 🥈 Способ 2: Railway (АВТОМАТИЧЕСКИЙ)

1. **Идите на https://railway.app**
2. **Войдите через GitHub**
3. **New Project → Deploy from GitHub repo**
4. **Выберите `M9nka1/poker-simulator`**
5. **Railway автоматически определит настройки**
6. **Deploy**

### 🥉 Способ 3: Heroku (КЛАССИЧЕСКИЙ)

1. **Установите Heroku CLI**
2. **Выполните команды:**
   ```bash
   heroku login
   heroku create your-poker-app
   git push heroku main
   heroku open
   ```

## 🔧 Локальное тестирование

Перед деплоем убедитесь, что приложение работает локально:

### Терминал 1 (Сервер):
```bash
npm run server
```

### Терминал 2 (Клиент):
```bash
cd client
npm start
```

**Откройте:** http://localhost:3000

## 📋 Что исправлено

✅ Добавлена конфигурация `vercel.json`  
✅ Добавлена конфигурация `netlify.toml`  
✅ Обновлен `client/package.json` с `vercel-build`  
✅ Исправлены пути для статических файлов  

## 🎯 Рекомендация

**Используйте Render** - это самая простая платформа для деплоя Node.js + React приложений. Она автоматически определяет структуру проекта и не требует сложной конфигурации.

## 🆘 Если все еще не работает

1. **Проверьте GitHub репозиторий:** https://github.com/M9nka1/poker-simulator
2. **Убедитесь, что все файлы загружены**
3. **Попробуйте другую платформу из списка**

## 📞 Поддержка

- **GitHub Issues:** https://github.com/M9nka1/poker-simulator/issues
- **Документация:** См. файлы `FINAL_DEPLOYMENT_GUIDE.md`

---

**🎉 Ваш покер симулятор будет доступен онлайн через 5-10 минут!** 