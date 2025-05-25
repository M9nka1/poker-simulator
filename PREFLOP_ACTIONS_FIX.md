# Исправление: Отсутствующие префлоп действия в Hand History

## Проблема
При загрузке префлоп файла с действиями после `*** HOLE CARDS ***`, эти действия не включались в генерируемые Hand History. 

### Пример входного файла:
```
PokerStars Hand #1748175114: Hold'em No Limit ($5.00/$10.00) - 2024/12/14 2:21:47 GMT+03:00
Table 'PioSolver Table' 6-max Seat #6 is the button
Seat 1: Pio_OOP_3bet_SB ($1000.00 in chips)
Seat 2: Pio_BB ($1000.00 in chips)
Seat 3: Pio_EP ($1000.00 in chips)
Seat 4: Pio_MP ($1000.00 in chips)
Seat 5: Pio_CO ($1000.00 in chips)
Seat 6: Pio_IP_c3bBU ($1000.00 in chips)
Pio_OOP_3bet_SB: posts small blind $5.00
Pio_BB: posts big blind $10.00
*** HOLE CARDS ***
Pio_EP: folds
Pio_MP: folds
Pio_CO: folds
Pio_IP_c3bBU: raises $15.00 to $25.00
Pio_OOP_3bet_SB: raises $85.00 to $110.00
Pio_BB: folds
Pio_IP_c3bBU: calls $85.00
*** FLOP *** [Js 4h Td]
```

### Проблема в коде:
В методе `extractPreflopActions()` была логическая ошибка - он останавливался на `*** HOLE CARDS ***` и не извлекал действия, которые шли после этой строки.

## Исправление

### Файл: `server/hand-history.js`

**Было:**
```javascript
// Пропускаем шапку до раздачи карт
if (trimmedLine.includes('*** HOLE CARDS ***')) {
  break; // Останавливаемся на HOLE CARDS
}
```

**Стало:**
```javascript
// Отмечаем что нашли HOLE CARDS, но продолжаем
if (trimmedLine.includes('*** HOLE CARDS ***')) {
  foundHoleCards = true;
  continue;
}
```

### Результат исправления:

Теперь все префлоп действия корректно извлекаются и включаются в Hand History:

```
PokerStars Hand #1748175115: Hold'em No Limit ($5.00/$10.00) - 2024/12/14 2:21:47 GMT+03:00
Table 'PioSolver Table' 6-max Seat #6 is the button
Seat 1: Pio_OOP_3bet_SB (€1000.00 in chips)
Seat 2: Pio_BB (€1000.00 in chips)
Seat 3: Pio_EP (€1000.00 in chips)
Seat 4: Pio_MP (€1000.00 in chips)
Seat 5: Pio_CO (€1000.00 in chips)
Seat 6: Pio_IP_c3bBU (€1000.00 in chips)
Pio_OOP_3bet_SB: posts small blind €5.00
Pio_BB: posts big blind €10.00
Pio_EP: folds
Pio_MP: folds
Pio_CO: folds
Pio_IP_c3bBU: raises €15.00 to €25.00
Pio_OOP_3bet_SB: raises €85.00 to €110.00
Pio_BB: folds
Pio_IP_c3bBU: calls €85.00
*** HOLE CARDS ***
Dealt to Pio_IP_c3bBU [Ad Jd]
Dealt to Pio_OOP_3bet_SB [Kc Qc]
*** FLOP *** [Js 4h Td]
...
```

## Дополнительные улучшения

1. **Автоматическая конвертация валют**: Доллары ($) автоматически заменяются на евро (€) для консистентности
2. **Сохранение порядка действий**: Все префлоп действия сохраняются в правильном хронологическом порядке
3. **Поддержка всех типов действий**: folds, calls, raises, bets, checks, posts blind

## Тестирование

Исправление протестировано с реальными префлоп файлами и подтверждает корректное извлечение всех действий:

- ✅ Блайнды (posts small/big blind)
- ✅ Фолды (folds)
- ✅ Рейзы (raises)
- ✅ Коллы (calls)
- ✅ Конвертация валют ($→€)

## Совместимость

- ✅ Обратная совместимость с существующими префлоп файлами
- ✅ Поддержка Hand2Note формата
- ✅ Корректная работа с автоинкрементом номеров рук 