# Исправление: Расчет стеков после префлоп действий

## Проблема
При загрузке префлоп файла с действиями (блайнды, рейзы, коллы), игроки на флопе все еще показывали полные стеки $1000, хотя должны были показывать оставшиеся стеки после префлоп торгов.

### Пример проблемы:
**Префлоп действия:**
```
Pio_OOP_3bet_SB: posts small blind $5.00
Pio_BB: posts big blind $10.00
Pio_IP_c3bBU: raises $15.00 to $25.00
Pio_OOP_3bet_SB: raises $85.00 to $110.00
Pio_BB: folds
Pio_IP_c3bBU: calls $85.00
```

**Было (неправильно):**
- Pio_OOP_3bet_SB: $1000 на флопе
- Pio_IP_c3bBU: $1000 на флопе

**Должно быть:**
- Pio_OOP_3bet_SB: $890 на флопе (1000 - 110)
- Pio_IP_c3bBU: $890 на флопе (1000 - 110)

## Исправление

### 1. Новый метод расчета стеков

**Файл**: `server/hand-history.js`

Добавлен метод `calculatePreflopStacks()` который:
- Извлекает начальные стеки из строк `Seat`
- Парсит все префлоп действия (блайнды, рейзы, коллы)
- Рассчитывает оставшиеся стеки для каждого игрока

```javascript
calculatePreflopStacks(preflopHistory) {
  if (!preflopHistory) return {};
  
  const lines = preflopHistory.split('\n');
  const playerStacks = {};
  const playerBets = {};
  
  // Извлекаем начальные стеки
  for (const line of lines) {
    const seatMatch = trimmedLine.match(/Seat \d+: (\w+) \([\$€](\d+(?:\.\d+)?) in chips\)/);
    if (seatMatch) {
      const playerName = seatMatch[1];
      const initialStack = parseFloat(seatMatch[2]);
      playerStacks[playerName] = initialStack;
      playerBets[playerName] = 0;
    }
  }
  
  // Парсим все префлоп действия
  // - Блайнды: posts small/big blind
  // - Рейзы с "to": raises $15.00 to $25.00
  // - Коллы: calls $85.00
  // - Обычные рейзы: raises $85.00
  
  // Вычисляем оставшиеся стеки
  const remainingStacks = {};
  for (const playerName in playerStacks) {
    remainingStacks[playerName] = playerStacks[playerName] - playerBets[playerName];
  }
  
  return remainingStacks;
}
```

### 2. Интеграция в создание сессии

**Файл**: `server/index.js`

```javascript
// Рассчитываем стеки после префлоп действий
const handHistoryGenerator = new HandHistoryGenerator(preflopHistory);
const remainingStacks = handHistoryGenerator.calculatePreflopStacks(preflopHistory);

console.log('📊 Calculated remaining stacks after preflop:', remainingStacks);

// Generate tables с рассчитанными стеками
for (let i = 0; i < tableCount; i++) {
  const table = pokerEngine.createTable(i + 1, preflopData.potSize, remainingStacks);
  session.tables.push(table);
}
```

### 3. Обновление PokerEngine

**Файл**: `server/poker-engine.js`

Добавлена поддержка префлоп истории в конструктор:
```javascript
constructor(boardSettings, handRanges, preflopHistory = null) {
  this.boardSettings = boardSettings;
  this.handRanges = handRanges;
  this.preflopHistory = preflopHistory;
  this.deck = this.createDeck();
}
```

### 4. Исправление метода dealNewHand

**Файл**: `server/poker-engine.js`

```javascript
dealNewHand(table) {
  // Если есть префлоп история, рассчитываем стеки после префлоп действий
  if (this.preflopHistory) {
    const HandHistoryGenerator = require('./hand-history.js');
    const handHistoryGenerator = new HandHistoryGenerator(this.preflopHistory);
    const remainingStacks = handHistoryGenerator.calculatePreflopStacks(this.preflopHistory);
    
    // Восстанавливаем стеки до размеров после префлоп действий
    player1.stack = remainingStacks[player1.name] || player1.initialStack || 1000;
    player2.stack = remainingStacks[player2.name] || player2.initialStack || 1000;
    
    console.log(`🔄 New hand dealt - Stacks after preflop: P1=${player1.stack}, P2=${player2.stack}`);
  } else {
    // Восстанавливаем стеки до изначальных размеров
    player1.stack = player1.initialStack || 1000;
    player2.stack = player2.initialStack || 1000;
  }
}
```

## Результат исправления

### Тестирование показало:
```
💰 Рассчитанные стеки после префлоп действий:
   Pio_OOP_3bet_SB: $890
   Pio_BB: $990
   Pio_EP: $1000
   Pio_MP: $1000
   Pio_CO: $1000
   Pio_IP_c3bBU: $890
```

### Правильность расчетов:
- ✅ **Pio_OOP_3bet_SB**: $890 (1000 - 5 SB - 105 доплата до 110)
- ✅ **Pio_BB**: $990 (1000 - 10 BB, затем фолд)
- ✅ **Pio_EP/MP/CO**: $1000 (не участвовали в торгах)
- ✅ **Pio_IP_c3bBU**: $890 (1000 - 25 рейз - 85 колл)

### Банк:
- ✅ **Общий банк**: $230 (110 + 110 + 10 от BB)

## Совместимость

- ✅ Поддержка как долларов ($), так и евро (€)
- ✅ Корректная работа с различными форматами рейзов
- ✅ Обработка блайндов и фолдов
- ✅ Автоматическое восстановление стеков при новых руках
- ✅ Fallback на стандартные стеки при отсутствии префлоп данных

## Влияние на игровой процесс

Теперь игроки видят **реальные** оставшиеся стеки на флопе, что критически важно для:
- Правильного расчета размеров ставок
- Понимания pot odds
- Стратегических решений all-in
- Генерации корректных Hand History для анализа 