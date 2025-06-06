# 💰 ИСПРАВЛЕНИЕ: Ограничения стека

## Проблема
Игроки могли делать ставки больше своего стека, что нарушает правила покера.

## ✅ Исправления

### 1. Валидация стека в сервере

**Добавлена проверка в `validateAction()`:**
```javascript
// Проверяем, что у игрока достаточно денег
if ((action === 'bet' || action === 'raise' || action === 'call') && amount > currentPlayer.stack) {
  throw new Error(`Insufficient funds. You have €${currentPlayer.stack}, but trying to bet €${amount}`);
}
```

### 2. Ограничение размеров ставок в клиенте

**Исправлена функция `calculateBetSize()`:**
```javascript
// Ограничиваем размер ставки стеком игрока
return Math.min(baseAmount, maxStack);
```

**Добавлены проверки в кнопках действий:**
```javascript
// Ограничиваем стеком игрока
const currentPlayerData = table.players.find(p => p.id === currentPlayerId);
const maxStack = currentPlayerData?.stack || 1000;
finalAmount = Math.min(finalAmount, maxStack);

// Скрываем кнопку если недостаточно денег для минимального рейза
if (isRaise && finalAmount <= callAmount) {
  return null;
}
```

### 3. Автоматическое обновление стека

**Стек обновляется после каждого действия:**
```javascript
switch (action) {
  case 'bet':
  case 'raise':
  case 'call':
    if (amount > 0) {
      player.stack -= amount;
      table.pot += amount;
    }
    break;
}
```

## 🧪 Тестирование

Создан тест `test_stack_limits.js` который проверяет:

1. ✅ **Блокировка ставок больше стека**
   - Попытка поставить €300 при стеке €150 → заблокировано

2. ✅ **Нормальные ставки в пределах стека**
   - Ставка €100 при стеке €150 → разрешено

3. ✅ **Блокировка рейзов больше стека**
   - Попытка рейза €250 при стеке €200 → заблокировано

4. ✅ **All-in ставки**
   - Ставка всего стека €200 → разрешено

5. ✅ **Блокировка коллов больше стека**
   - Попытка колла €200 при стеке €50 → заблокировано

## 📊 Результаты тестирования

```
🧪 Тест 1: Попытка поставить больше стека
✅ Правильно заблокировано: Insufficient funds. You have €150, but trying to bet €300

🧪 Тест 2: Нормальная ставка в пределах стека
✅ Ставка €100 принята. Стек Player 2: €50

🧪 Тест 3: Player 1 пытается рейзить больше стека
✅ Правильно заблокировано: Insufficient funds. You have €200, but trying to bet €250

🧪 Тест 4: All-in ставка
✅ All-in €200 принят. Стек Player 1: €0

🧪 Тест 5: Колл больше стека
✅ Правильно заблокировано: Insufficient funds. You have €50, but trying to bet €200
```

## 🎯 Что теперь работает правильно

- **Серверная валидация**: Все ставки проверяются на соответствие стеку
- **Клиентские ограничения**: Кнопки ставок автоматически ограничиваются стеком
- **Автоматическое обновление**: Стеки обновляются после каждого действия
- **All-in поддержка**: Игроки могут ставить весь стек
- **Скрытие недоступных действий**: Кнопки рейза скрываются если недостаточно денег

## 🚀 Как запустить тест

```bash
node test_stack_limits.js
```

---

🎉 **Теперь все ставки строго ограничены стеком игрока!** 