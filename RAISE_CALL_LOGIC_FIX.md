# 🔧 Исправление логики Raise и Call

## Проблема

Пользователь обнаружил, что при сценарии с raise и call стеки игроков рассчитывались неправильно. После одинаковых действий на флопе у игроков оказывались разные стеки.

### Пример из Hand History
```
*** FLOP *** [6c 2h 3h]
Pio_OOP_3bet_SB: bets $58
Pio_IP_c3bBU: raises $202
Pio_OOP_3bet_SB: calls $202
```

**Ожидаемый результат:** Оба игрока должны иметь одинаковые стеки после этих действий.
**Фактический результат:** Стеки были разными.

## Анализ проблемы

### Неправильная интерпретация покерной логики

В покерных hand history:
- `bets $58` - игрок ставит $58
- `raises $202` - игрок доплачивает $202 **сверх** уже поставленных $58, общая ставка становится $260
- `calls $202` - игрок доплачивает $202 до общей ставки $260

### Проблемы в коде

1. **Неправильный расчет call amount** в клиентской части
2. **Неправильная валидация call** в серверной части
3. **Неточная логика canCheck/canCall**

## Исправления

### 1. Исправление расчета Call Amount (клиент)

**Было:**
```javascript
const getCallAmount = (): number => {
  // Находим последнюю ставку оппонента
  const lastBetAction = otherPlayerActions
    .filter(a => a.action === 'bet' || a.action === 'raise')
    .pop();
  
  return Math.min(lastBetAction.amount || 0, currentPlayer.stack);
};
```

**Стало:**
```javascript
const getCallAmount = (): number => {
  // Рассчитываем общие ставки каждого игрока на текущей улице
  const getPlayerStreetTotal = (player: any) => {
    return player.actions
      .filter((a: any) => a.street === table.currentStreet && 
              (a.action === 'bet' || a.action === 'raise' || a.action === 'call'))
      .reduce((total: number, action: any) => total + (action.amount || 0), 0);
  };
  
  const opponentTotal = getPlayerStreetTotal(otherPlayer);
  const myTotal = getPlayerStreetTotal(currentPlayer);
  
  // Call amount = разница между ставками
  const callAmount = Math.max(0, opponentTotal - myTotal);
  return Math.min(callAmount, currentPlayer.stack);
};
```

### 2. Исправление валидации Call (сервер)

**Было:**
```javascript
const expectedCallAmount = Math.min(lastBetAction.amount, currentPlayer.stack);
```

**Стало:**
```javascript
// Рассчитываем правильную сумму call
const opponentTotal = this.getStreetTotal(otherPlayer, table.currentStreet);
const myTotal = this.getStreetTotal(currentPlayer, table.currentStreet);
const expectedCallAmount = Math.min(opponentTotal - myTotal, currentPlayer.stack);
```

### 3. Упрощение логики Check/Call

**Было:** Сложная логика с проверкой последних действий

**Стало:**
```javascript
const canCheck = (): boolean => {
  const callAmount = getCallAmount();
  return callAmount === 0;
};

const canCall = (): boolean => {
  const callAmount = getCallAmount();
  return callAmount > 0;
};
```

## Результат

### Тестовый сценарий
```
Начальные стеки: P1=€890, P2=€890, Банк=€230

1. P2 bets €58
   → P1=€890, P2=€832, Банк=€288

2. P1 raises €260 (общая ставка €260)
   → P1=€630, P2=€832, Банк=€548

3. P2 calls €202 (доплачивает до €260)
   → P1=€630, P2=€630, Банк=€750

Итог: Оба игрока вложили по €260, стеки равны ✅
```

## Ключевые принципы

### Правильная интерпретация покерных действий

1. **Bet** - первая ставка на улице
2. **Raise** - увеличение ставки (общая сумма, не доплата)
3. **Call** - уравнивание ставки (доплата до общей суммы)

### Расчет Call Amount

```
Call Amount = Общая ставка оппонента - Моя общая ставка на улице
```

### Проверка возможности действий

- **Check доступен** когда `Call Amount = 0`
- **Call доступен** когда `Call Amount > 0`

## Тестирование

Создан тест `test_correct_raise_call.js` который проверяет:
- ✅ Правильный расчет call amount
- ✅ Корректное вычитание из стеков
- ✅ Равенство стеков после одинаковых вложений
- ✅ Правильный размер банка

**Результат:** Все тесты проходят успешно.

## Заключение

Исправления обеспечивают:
1. **Корректную интерпретацию** покерных hand history
2. **Правильные расчеты** стеков и банка
3. **Логичное поведение** кнопок Check/Call
4. **Соответствие** реальным покерным правилам

🎉 **Логика raise и call теперь работает корректно!** 