# 🚀 Быстрый старт - Poker Simulator

## ✅ Проверка готовности
Убедитесь, что у вас установлены:
- Node.js 14+
- npm

## 🏃 Запуск приложения

### 1. Одной командой (рекомендуется)
```bash
npm run dev
```
Эта команда запустит одновременно:
- **Сервер** на http://localhost:5000 
- **Клиент** на http://localhost:3000

### 2. Раздельный запуск
```bash
# Терминал 1 - Сервер
npm run server

# Терминал 2 - Клиент  
npm run client
```

## 🌐 Доступ к приложению
После запуска откройте браузер и перейдите на:
**http://localhost:3000**

## 🎮 Первые шаги

1. **Выберите диапазоны рук** для Игрока 1 и Игрока 2
   - Кликайте по матрице или используйте быстрые кнопки
   - Минимум: выберите хотя бы несколько рук для каждого игрока

2. **Настройте борд** (опционально)
   - Флоп: случайный, двухмастный, радуга, монотонный, спаренный
   - Тёрн/Ривер: включить/отключить

3. **Загрузите префлоп историю** (опционально)
   - Перетащите .txt файл или используйте кнопку загрузки
   - Пример файла: `example-preflop.txt`

4. **Создайте сессию**
   - Нажмите "🚀 Создать игровую сессию"

5. **Играйте!**
   - Делайте действия: чек, бет, колл, фолд
   - После завершения руки нажмите "🎲 Новая рука"
   - Экспортируйте Hand History для Hand2Note

## 🏆 Готово!
Теперь вы можете симулировать покерные раздачи и экспортировать их для анализа в Hand2Note.

## 🐛 Если что-то не работает

### TypeScript ошибки (Cannot find module)
```bash
# PowerShell - остановить все процессы
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# Очистить кэш клиента
cd client
Remove-Item -Recurse -Force node_modules
npm install
cd ..

# Перезапустить
npm run dev
```

### Порты заняты
```bash
# Проверить какие процессы используют порты
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Завершить процесс (замените PID на номер процесса)
taskkill /PID <номер_процесса> /F
```

### Ошибки зависимостей
```bash
# Переустановить зависимости сервера
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Переустановить зависимости клиента
cd client
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
cd ..
```

### Приложение не открывается в браузере
```bash
# Проверить статус сервисов
curl http://localhost:3000 -UseBasicParsing
curl http://localhost:5000 -UseBasicParsing

# Открыть браузер вручную
Start-Process "http://localhost:3000"
```

### Проблемы с build
```bash
# Собрать production версию
cd client
npm run build
cd ..

# Запустить в production режиме
npm start
```

---
💡 **Подсказка**: Все изменения в коде автоматически перезагружают приложение благодаря hot reload! 