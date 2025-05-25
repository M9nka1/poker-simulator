# 🎯 Исправление использования шапки из префлоп файла

## 🔍 Проблема

Пользователь указал, что в Hand History должна использоваться шапка из загруженного префлоп файла, а не статичная информация. Номер раздачи должен инкрементироваться с каждой следующей раздачей.

**Было:**
- Система генерировала статичную шапку: `PokerStars Hand #ID: Hold'em No Limit (€5/€10 EUR) - timestamp`
- Использовалась фиксированная информация о столе: `Table 'Simulator 1' 2-max`
- Номера рук не всегда корректно инкрементировались

**Требовалось:**
- Использовать шапку из загруженного префлоп файла
- Автоматически инкрементировать номер руки
- Сохранить все остальные элементы из префлоп истории (Table, Seat)

## 🛠️ Исправления

### 1. **Новый метод извлечения шапки**

**Файл**: `server/hand-history.js`

Добавлен метод `extractPreflopHeader()`:

```javascript
extractPreflopHeader(preflopHistory, newHandId) {
  if (!preflopHistory) return '';
  
  const lines = preflopHistory.split('\n');
  let header = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Заменяем номер руки на новый
    if (trimmedLine.includes('PokerStars Hand #')) {
      const updatedLine = trimmedLine.replace(/Hand #\d+/, `Hand #${newHandId}`);
      // Обновляем время на текущее
      const timestamp = this.formatTimestamp(new Date());
      const timeUpdatedLine = updatedLine.replace(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} \w+/, timestamp);
      header += timeUpdatedLine + '\n';
      continue;
    }
    
    // Добавляем строки до HOLE CARDS, но исключаем префлоп действия
    if (trimmedLine.includes('*** HOLE CARDS ***')) {
      break;
    }
    
    // Пропускаем префлоп действия (они будут добавлены отдельно)
    if (trimmedLine.includes('posts small blind') || 
        trimmedLine.includes('posts big blind') ||
        trimmedLine.includes(': folds') || 
        trimmedLine.includes(': calls') || 
        trimmedLine.includes(': raises') || 
        trimmedLine.includes(': bets') || 
        trimmedLine.includes(': checks')) {
      continue;
    }
    
    // Добавляем только строки шапки (Table, Seat)
    if (trimmedLine && !trimmedLine.startsWith('Dealt to')) {
      // Заменяем доллары на евро для консистентности
      const correctedLine = trimmedLine.replace(/\$(\d+(?:\.\d+)?)/g, '€$1');
      header += correctedLine + '\n';
    }
  }
  
  return header;
}
```

### 2. **Обновленная генерация Hand History**

**Файл**: `server/hand-history.js` - метод `generateHandHistory()`

**Было:**
```javascript
// Header with hand info
handHistory += `PokerStars Hand #${handId}: Hold'em No Limit (€5/€10 EUR) - ${this.formatTimestamp(timestamp)}\n`;
handHistory += `Table 'Simulator ${table.id}' 2-max Seat #1 is the button\n`;

const player1 = table.players.find(p => p.id === 1);
const player2 = table.players.find(p => p.id === 2);

handHistory += `Seat 1: ${player1.name} (€${player1.stack + this.getTotalBet(player1)} in chips)\n`;
handHistory += `Seat 2: ${player2.name} (€${player2.stack + this.getTotalBet(player2)} in chips)\n`;
```

**Стало:**
```javascript
// Extract header from preflop history or use default
if (this.preflopHistory) {
  const preflopHeader = this.extractPreflopHeader(this.preflopHistory, handId);
  handHistory += preflopHeader;
} else {
  // Fallback to default header
  const timestamp = new Date();
  handHistory += `PokerStars Hand #${handId}: Hold'em No Limit (€5/€10 EUR) - ${this.formatTimestamp(timestamp)}\n`;
  handHistory += `Table 'Simulator ${table.id}' 2-max Seat #1 is the button\n`;
  
  const player1 = table.players.find(p => p.id === 1);
  const player2 = table.players.find(p => p.id === 2);
  
  handHistory += `Seat 1: ${player1.name} (€${player1.stack + this.getTotalBet(player1)} in chips)\n`;
  handHistory += `Seat 2: ${player2.name} (€${player2.stack + this.getTotalBet(player2)} in chips)\n`;
}
```

### 3. **Исправление дублирования префлоп действий**

Обновлен метод `extractPreflopHeader()` для исключения префлоп действий из шапки, так как они добавляются отдельно через `extractPreflopActions()`.

### 4. **Глобальный счетчик номеров рук**

Система уже использовала глобальный счетчик:

```javascript
// Глобальный счетчик номеров рук
let globalHandNumber = 1748175114; // Начинаем с номера как в примере

generateHandId() {
  return globalHandNumber++; // Автоматический инкремент
}
```

## ✅ Результат

### Пример сгенерированной Hand History:

**Первая рука:**
```
PokerStars Hand #1748175114: Hold'em No Limit (€5/€10 EUR) - 2025/05/25 16:12:06 CET
Table 'Simulator 1' 2-max Seat #1 is the button
Seat 1: Pio_IP_c3bBU (€1000 in chips)
Seat 2: Pio_OOP_3bet_SB (€1000 in chips)
Pio_OOP_3bet_SB: posts small blind €5.00
Pio_BB: posts big blind €10.00
*** HOLE CARDS ***
Dealt to Pio_IP_c3bBU [As Kc]
Dealt to Pio_OOP_3bet_SB [Qc 9c]
*** FLOP *** [7d 7h 8s]
...
```

**Вторая рука:**
```
PokerStars Hand #1748175115: Hold'em No Limit (€5/€10 EUR) - 2025/05/25 16:12:06 CET
Table 'Simulator 1' 2-max Seat #1 is the button
Seat 1: Pio_IP_c3bBU (€1000 in chips)
Seat 2: Pio_OOP_3bet_SB (€1000 in chips)
Pio_OOP_3bet_SB: posts small blind €5.00
Pio_BB: posts big blind €10.00
*** HOLE CARDS ***
...
```

### Ключевые улучшения:

1. ✅ **Шапка из префлоп файла**: Используется оригинальная информация о столе и игроках
2. ✅ **Автоинкремент номеров**: Каждая новая рука получает уникальный номер
3. ✅ **Актуальное время**: Время обновляется для каждой новой руки
4. ✅ **Без дублирования**: Префлоп действия включаются только один раз
5. ✅ **Консистентность валют**: Доллары автоматически конвертируются в евро

## 🎯 Совместимость

- ✅ Полная совместимость с Hand2Note
- ✅ Стандартный формат PokerStars Hand History
- ✅ Корректная последовательность номеров рук
- ✅ Сохранение всех префлоп действий из исходного файла

---

🎉 **Теперь система корректно использует шапку из загруженного префлоп файла с автоматическим инкрементом номеров рук!** 