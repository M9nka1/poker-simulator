# 🎯 Исправление проблемы с активными игроками

## Проблема

Система показывала неправильных игроков в игре. Например, когда игра должна была идти между `Pio_OOP_3bet_SB` и `Pio_IP_c3bBU`, система показывала стек `Pio_BB: 990`, хотя `Pio_BB` сфолдил в префлопе.

## Причина

Система брала первых двух игроков из списка всех игроков (`Object.keys(playerStacks)`), не учитывая, что некоторые игроки могли сфолдить в префлопе и не участвуют в постфлоп игре.

## Решение

### 1. Добавлен метод `getActivePlayers()` в `HandHistoryGenerator`

```javascript
getActivePlayers(preflopHistory) {
  if (!preflopHistory) return [];
  
  const lines = preflopHistory.split('\n');
  const allPlayers = new Set();
  const foldedPlayers = new Set();
  
  // Собираем всех игроков из строк Seat
  for (const line of lines) {
    const seatMatch = line.match(/Seat \d+: (\w+) \([\$€](\d+(?:\.\d+)?) in chips\)/);
    if (seatMatch) {
      allPlayers.add(seatMatch[1]);
    }
    
    // Отслеживаем фолды в префлопе
    const foldMatch = line.match(/(\w+): folds/);
    if (foldMatch) {
      foldedPlayers.add(foldMatch[1]);
    }
    
    // Останавливаемся на флопе
    if (line.includes('*** FLOP ***')) break;
  }
  
  // Возвращаем игроков, которые не сфолдили
  return Array.from(allPlayers).filter(player => !foldedPlayers.has(player));
}
```

### 2. Обновлен метод `createTable()` в `PokerEngine`

```javascript
createTable(tableId, initialPotSize = 0, playerStacks = {}, activePlayers = []) {
  // ...
  
  // Используем активных игроков, если они переданы
  const playerNames = activePlayers.length > 0 ? activePlayers : Object.keys(playerStacks);
  const player1Name = playerNames[0] || 'Player 1';
  const player2Name = playerNames[1] || 'Player 2';
  
  // ...
}
```

### 3. Обновлено создание сессии в `server/index.js`

```javascript
// Рассчитываем стеки и определяем активных игроков
const remainingStacks = handHistoryGenerator.calculatePreflopStacks(preflopHistory);
const activePlayers = handHistoryGenerator.getActivePlayers(preflopHistory);

// Создаем столы с правильными игроками
for (let i = 0; i < tableCount; i++) {
  const table = pokerEngine.createTable(i + 1, preflopData.potSize, remainingStacks, activePlayers);
  session.tables.push(table);
}
```

## Результат

Теперь система правильно определяет:

### До исправления:
- Игрок 1: `Pio_OOP_3bet_SB` (первый в списке)
- Игрок 2: `Pio_BB` (второй в списке) ❌ **НЕПРАВИЛЬНО** - он сфолдил!

### После исправления:
- Игрок 1: `Pio_OOP_3bet_SB` (активный игрок) ✅
- Игрок 2: `Pio_IP_c3bBU` (активный игрок) ✅

## Тестирование

Создан тест, который проверяет:
- Правильное определение активных игроков
- Исключение сфолдивших игроков
- Корректное создание стола с нужными игроками

## Совместимость

Исправление полностью обратно совместимо:
- Если `activePlayers` не передан, используется старая логика
- Все существующие функции продолжают работать
- Добавлены только новые возможности

---

**Статус:** ✅ Исправлено и протестировано
**Дата:** 2024-12-14 