# 🔧 Устранение неполадок - Poker Simulator

## 🚨 Основные проблемы и решения

### 1. ❌ TypeScript ошибки "Cannot find module"

**Проблема**: TypeScript не может найти модули компонентов
```
Cannot find module './PokerTable' or its corresponding type declarations.
```

**Решение**:
```powershell
# 1. Остановить все процессы Node.js
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# 2. Очистить кэш клиента
cd client
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install

# 3. Вернуться в корень и перезапустить
cd ..
npm run dev
```

### 2. 🚫 Порты заняты

**Проблема**: Порты 3000 или 5000 уже используются

**Диагностика**:
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```

**Решение**:
```powershell
# Найти PID процесса и завершить его
taskkill /PID <номер_процесса> /F

# Или завершить все Node.js процессы
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

### 3. 📦 Проблемы с зависимостями

**Проблема**: Ошибки установки или несовместимость пакетов

**Полная переустановка**:
```powershell
# Корневые зависимости
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install

# Зависимости клиента
cd client
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
cd ..
```

### 4. 🌐 Приложение не открывается в браузере

**Диагностика**:
```powershell
# Проверить доступность сервисов
curl http://localhost:3000 -UseBasicParsing
curl http://localhost:5000 -UseBasicParsing
```

**Решения**:
```powershell
# Открыть браузер вручную
Start-Process "http://localhost:3000"

# Или проверить процессы
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

### 5. ⚡ Медленная загрузка или зависания

**Проблема**: Приложение долго запускается или зависает

**Решения**:
```powershell
# Проверить использование памяти
Get-Process node | Select-Object Name, CPU, WorkingSet

# Перезапустить с очисткой кэша
npm run dev -- --reset-cache
```

### 6. 🏗️ Ошибки сборки (Build errors)

**Проблема**: Ошибки при сборке production версии

**Решение**:
```powershell
cd client
# Очистить кэш и пересобрать
npx react-scripts build
cd ..
```

## 🔍 Диагностика шаг за шагом

### Шаг 1: Проверка окружения
```powershell
# Проверить версии
node --version    # Должно быть 14+
npm --version     # Должно быть 6+

# Проверить структуру проекта
Get-ChildItem -Name
```

### Шаг 2: Проверка процессов
```powershell
# Активные Node.js процессы
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Используемые порты
netstat -ano | findstr ":3000\|:5000"
```

### Шаг 3: Проверка файлов
```powershell
# Проверить наличие ключевых файлов
Test-Path "package.json"
Test-Path "client/package.json"
Test-Path "server/index.js"
Test-Path "client/src/App.tsx"
```

### Шаг 4: Тестирование API
```powershell
# После запуска сервера
curl http://localhost:5000/api/session/test -UseBasicParsing
```

## 🛠️ Продвинутые решения

### Полный сброс проекта
```powershell
# ВНИМАНИЕ: Удалит все зависимости!
Remove-Item -Recurse -Force node_modules, client/node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json, client/package-lock.json -ErrorAction SilentlyContinue

# Переустановка
npm install
cd client && npm install && cd ..

# Запуск
npm run dev
```

### Альтернативный запуск
```powershell
# Если npm run dev не работает, запустить раздельно:

# Терминал 1
npm run server

# Терминал 2  
cd client
npm start
```

### Проверка логов
```powershell
# Сохранить логи в файл
npm run dev > logs.txt 2>&1

# Или просмотреть в реальном времени
npm run dev | Tee-Object -FilePath "logs.txt"
```

## 📋 Чек-лист перед обращением за помощью

- [ ] Проверили версии Node.js и npm
- [ ] Перезапустили с очисткой кэша
- [ ] Проверили, что порты свободны
- [ ] Переустановили зависимости
- [ ] Проверили доступность сервисов через curl
- [ ] Сохранили логи ошибок

## 🆘 Если ничего не помогает

1. **Сохраните логи**: `npm run dev > error-log.txt 2>&1`
2. **Опишите проблему**: что делали, какая ошибка, когда возникла
3. **Укажите окружение**: Windows версия, Node.js версия, npm версия
4. **Приложите скриншоты** консоли с ошибками

---
💡 **Помните**: Большинство проблем решается перезапуском с очисткой кэша! 

## 🔴 Проблема: "Офлайн" статус в приложении

### Симптомы:
- В верхней части показывает "🔴 Офлайн"
- Внизу показывает "Подключение..."
- Игроки не могут присоединиться к сессии

### 🔍 Диагностика:

#### Шаг 1: Проверьте серверы
```bash
# Проверьте, что сервер запущен
npm run server

# В другом терминале проверьте клиент
npm run client
```

#### Шаг 2: Проверьте порты
```bash
# Windows PowerShell
netstat -an | findstr ":5000\|:3000"

# Должно показать:
# TCP 0.0.0.0:5000 ... LISTENING  (сервер)
# TCP 0.0.0.0:3000 ... LISTENING  (клиент)
```

#### Шаг 3: Тест WebSocket
1. Откройте `websocket_test.html` в браузере
2. Нажмите "🔗 Тест WebSocket"
3. Проверьте результат в логе

#### Шаг 4: Проверьте консоль браузера
1. Откройте http://localhost:3000
2. Нажмите F12 (Developer Tools)
3. Перейдите на вкладку "Console"
4. Ищите ошибки WebSocket

### ✅ Решения:

#### Решение 1: Перезапуск серверов
```bash
# Остановите все процессы (Ctrl+C)
# Затем запустите заново:
npm run server  # В первом терминале
npm run client  # Во втором терминале
```

#### Решение 2: Проверка брандмауэра
- Убедитесь, что порты 3000 и 5000 не заблокированы
- Временно отключите антивирус/брандмауэр для теста

#### Решение 3: Очистка кэша браузера
1. Нажмите Ctrl+Shift+R (жесткое обновление)
2. Или очистите кэш браузера полностью

#### Решение 4: Проверка URL
- Убедитесь, что открываете http://localhost:3000
- НЕ используйте 127.0.0.1 или другие IP

### 🧪 Автоматическая диагностика

Запустите тестовый скрипт:
```bash
node simple_test.js
```

Ожидаемый результат:
```
🎮 Простой тест сервера
✅ HTTP модуль доступен
✅ Сервер отвечает! Статус: 404
✅ Сессия создана!
✅ WebSocket подключен
🎉 Все тесты пройдены успешно!
```

## 🚫 Другие частые проблемы

### Проблема: "Не могу создать сессию"
**Решение:**
- Выберите диапазоны рук для обоих игроков
- Проверьте, что сервер запущен
- Обновите страницу

### Проблема: "Карты не обновляются"
**Решение:**
- Проверьте статус подключения (🟢/🔴)
- Подождите автоматического переподключения
- Обновите страницу (F5)

### Проблема: "Не могу сделать ход"
**Решение:**
- Убедитесь, что сейчас ваш ход
- Проверьте подключение к серверу
- Попробуйте обновить страницу

### Проблема: "ID сессии не работает"
**Решение:**
- Проверьте правильность ID (копируйте полностью)
- Убедитесь, что хост не закрыл сессию
- Попробуйте создать новую сессию

## 📋 Чек-лист диагностики

- [ ] Сервер запущен (`npm run server`)
- [ ] Клиент запущен (`npm run client`)
- [ ] Порт 5000 слушает (сервер)
- [ ] Порт 3000 слушает (клиент)
- [ ] Браузер открыт на http://localhost:3000
- [ ] Консоль браузера без ошибок WebSocket
- [ ] Тест `node simple_test.js` проходит
- [ ] Диагностическая страница подключается

## 🆘 Если ничего не помогает

1. **Перезагрузите компьютер** - иногда помогает
2. **Попробуйте другой браузер** (Chrome, Firefox, Edge)
3. **Проверьте антивирус** - может блокировать WebSocket
4. **Запустите от администратора** - может помочь с портами

## 📞 Получение помощи

Если проблема не решается, соберите следующую информацию:

### Системная информация:
- ОС: Windows/Mac/Linux
- Браузер и версия
- Node.js версия (`node --version`)

### Логи:
- Вывод `npm run server`
- Вывод `npm run client`
- Консоль браузера (F12)
- Результат `node simple_test.js`

### Скриншоты:
- Страница с ошибкой
- Консоль браузера
- Статус подключения

---

**💡 Совет:** Большинство проблем решается простым перезапуском серверов! 