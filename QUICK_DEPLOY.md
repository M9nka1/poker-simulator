# ⚡ Быстрый деплой покерного симулятора

## 🚀 За 5 минут в интернет!

### 1️⃣ GitHub (2 минуты)

```bash
# В папке проекта
git init
git add .
git commit -m "Initial commit"

# Создайте репозиторий на github.com, затем:
git remote add origin https://github.com/YOUR_USERNAME/poker-simulator.git
git push -u origin main
```

### 2️⃣ Heroku (3 минуты)

```bash
# Установите Heroku CLI, затем:
heroku login
heroku create your-poker-app
git push heroku main
heroku open
```

**Готово! Ваш сайт онлайн! 🎉**

---

### 🌟 Альтернативы (еще проще):

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Railway:**
1. Зайдите на railway.app
2. Подключите GitHub репозиторий
3. Автоматический деплой!

---

**Подробная инструкция:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) 