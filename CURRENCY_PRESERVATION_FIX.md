# Исправление: Сохранение оригинальной валюты из префлоп файлов

## Проблема
При загрузке префлоп файлов с долларами ($), система автоматически конвертировала их в евро (€) в генерируемых Hand History, что создавало несоответствие с оригинальными данными.

### Пример проблемы:
**Входной префлоп файл:**
```
PokerStars Hand #1748175114: Hold'em No Limit ($5.00/$10.00) - 2024/12/14 2:21:47 GMT+03:00
Table 'PioSolver Table' 6-max Seat #6 is the button
Seat 1: Pio_OOP_3bet_SB ($1000.00 in chips)
Pio_OOP_3bet_SB: posts small blind $5.00
Pio_IP_c3bBU: raises $15.00 to $25.00
```

**Было (неправильно):**
```
PokerStars Hand #1748175115: Hold'em No Limit ($5.00/$10.00) - 2024/12/14 2:21:47 GMT+03:00
Table 'PioSolver Table' 6-max Seat #6 is the button
Seat 1: Pio_OOP_3bet_SB (€1000.00 in chips)
Pio_OOP_3bet_SB: posts small blind €5.00
Pio_IP_c3bBU: raises €15.00 to €25.00
*** FLOP *** [Js 4h Td]
Pio_IP_c3bBU: bets €115
Total pot €2230
```

## Исправление

### 1. Автоматическое определение валюты
Добавлен метод `detectCurrency()` в конструктор класса `HandHistoryGenerator`:

```javascript
constructor(preflopHistory) {
  this.preflopHistory = preflopHistory || '';
  // Определяем валюту из префлоп файла
  this.currency = this.detectCurrency(preflopHistory);
}

detectCurrency(preflopHistory) {
  if (!preflopHistory) return '$'; // По умолчанию доллары
  
  // Ищем валюту в префлоп файле
  if (preflopHistory.includes('$')) {
    return '$';
  } else if (preflopHistory.includes('€')) {
    return '€';
  }
  
  return '$'; // По умолчанию доллары
}
```

### 2. Удаление автоматической конвертации валют

**В `extractPreflopActions()`:**
```javascript
// Было:
const correctedLine = trimmedLine.replace(/\$(\d+(?:\.\d+)?)/g, '€$1');

// Стало:
// Сохраняем оригинальную валюту из префлоп файла
actions += trimmedLine + '\n';
```

**В `extractPreflopHeader()`:**
```javascript
// Было:
const correctedLine = trimmedLine.replace(/\$(\d+(?:\.\d+)?)/g, '€$1');

// Стало:
// Сохраняем оригинальную валюту из префлоп файла
header += trimmedLine + '\n';
```

### 3. Использование определенной валюты во всех методах

**В `generateStreetActions()`:**
```javascript
case 'bet':
  actions += `${action.playerName}: bets ${this.currency}${action.amount}\n`;
  break;
case 'call':
  actions += `${action.playerName}: calls ${this.currency}${action.amount}\n`;
  break;
```

**В `generateSummary()`:**
```javascript
summary += `Total pot ${this.currency}${table.pot}\n`;
summary += `Seat ${player.id}: ${player.name} showed [${this.formatCards(player.holeCards)}] and won (${this.currency}${table.pot})\n`;
```

**В fallback header:**
```javascript
const currencyCode = this.currency === '$' ? 'USD' : 'EUR';
handHistory += `PokerStars Hand #${handId}: Hold'em No Limit (${this.currency}5/${this.currency}10 ${currencyCode}) - ${this.formatTimestamp(timestamp)}\n`;
```

## Результат исправления

**Теперь (правильно):**
```
PokerStars Hand #1748175115: Hold'em No Limit ($5.00/$10.00) - 2024/12/14 2:21:47 GMT+03:00
Table 'PioSolver Table' 6-max Seat #6 is the button
Seat 1: Pio_OOP_3bet_SB ($1000.00 in chips)
Pio_OOP_3bet_SB: posts small blind $5.00
Pio_IP_c3bBU: raises $15.00 to $25.00
*** HOLE CARDS ***
Dealt to Pio_IP_c3bBU [Ad Jd]
Dealt to Pio_OOP_3bet_SB [Kc Qc]
*** FLOP *** [Js 4h Td]
Pio_IP_c3bBU: bets $115
Pio_OOP_3bet_SB: bets $58
*** SUMMARY ***
Total pot $2230
Board [Js 4h Td 7c 6h]
Seat 1: Pio_IP_c3bBU showed [Ad Jd] and won ($2230)
```

## Тестирование

Исправление протестировано и подтверждает:

- ✅ Автоматическое определение валюты из префлоп файла
- ✅ Сохранение долларов ($) в префлоп действиях
- ✅ Сохранение долларов ($) в шапке
- ✅ Использование долларов ($) в постфлоп действиях
- ✅ Использование долларов ($) в итоговом summary
- ✅ Отсутствие нежелательной конвертации в евро (€)

## Совместимость

- ✅ Поддержка как долларов ($), так и евро (€)
- ✅ Обратная совместимость с существующими файлами
- ✅ Автоматическое определение валюты
- ✅ Fallback на доллары при отсутствии префлоп данных
- ✅ Корректная работа с Hand2Note и другими анализаторами 