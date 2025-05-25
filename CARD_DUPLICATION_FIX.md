# 🎴 Исправление дублирования карт

## Проблема

Система раздавала одинаковые карты разным игрокам и на борд. Например, оба игрока могли получить `As` (туз пик), что невозможно в реальном покере, поскольку в колоде только одна карта каждого типа.

**Пример ошибки:**
```
Dealt to Pio_IP_c3bBU [Ad As]
Dealt to Pio_OOP_3bet_SB [Ac As]  ← As повторяется!
```

## Причина

В методе `generateHoleCards()` система генерировала карты для каждого игрока независимо, не проверяя, что карты должны быть уникальными. Аналогично, метод `generateBoard()` не учитывал карты игроков при генерации борда.

## Решение

### 1. Обновлен метод `generateHoleCards()`

**Старый код:**
```javascript
generateHoleCards(handRanges) {
  const player1Hands = this.expandHandRange(player1Range);
  const player2Hands = this.expandHandRange(player2Range);
  
  // Независимая генерация - ПРОБЛЕМА!
  const player1Hand = player1Hands[Math.floor(Math.random() * player1Hands.length)];
  const player2Hand = player2Hands[Math.floor(Math.random() * player2Hands.length)];
  
  return { player1: player1Hand, player2: player2Hand };
}
```

**Новый код:**
```javascript
generateHoleCards(handRanges) {
  // Если диапазоны пустые, генерируем случайные карты из колоды
  if (player1Range.length === 0 && player2Range.length === 0) {
    return this.generateRandomHoleCards();
  }
  
  // Попытка найти совместимые руки (без пересечений карт)
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    const player1Hand = player1Hands[Math.floor(Math.random() * player1Hands.length)];
    const player2Hand = player2Hands[Math.floor(Math.random() * player2Hands.length)];
    
    // Проверяем, что карты не пересекаются
    const player1Cards = player1Hand.map(card => card.display);
    const player2Cards = player2Hand.map(card => card.display);
    const hasConflict = player1Cards.some(card => player2Cards.includes(card));
    
    if (!hasConflict) {
      return { player1: player1Hand, player2: player2Hand };
    }
    
    attempts++;
  }
  
  // Если не удалось найти совместимые руки, генерируем случайные
  return this.generateRandomHoleCards();
}
```

### 2. Добавлен метод `generateRandomHoleCards()`

```javascript
generateRandomHoleCards() {
  // Создаем перемешанную колоду
  const shuffledDeck = this.shuffleDeck(this.deck);
  
  // Берем первые 4 карты для двух игроков
  const player1Hand = [shuffledDeck[0], shuffledDeck[1]];
  const player2Hand = [shuffledDeck[2], shuffledDeck[3]];
  
  return { player1: player1Hand, player2: player2Hand };
}
```

### 3. Обновлен метод `generateBoard()`

**Старый код:**
```javascript
generateBoard() {
  let availableDeck = this.shuffleDeck(this.deck);
  // Не учитывал карты игроков - ПРОБЛЕМА!
}
```

**Новый код:**
```javascript
generateBoard(holeCards = null) {
  let availableDeck = this.shuffleDeck(this.deck);
  
  // Исключаем карты игроков из колоды
  if (holeCards) {
    const usedCards = [];
    if (holeCards.player1) usedCards.push(...holeCards.player1);
    if (holeCards.player2) usedCards.push(...holeCards.player2);
    
    availableDeck = availableDeck.filter(card => 
      !usedCards.some(usedCard => usedCard.display === card.display)
    );
  }
  
  // Генерируем борд из оставшихся карт
}
```

### 4. Обновлены вызовы методов

В `createTable()` и `dealNewHand()`:
```javascript
const holeCards = this.generateHoleCards(this.handRanges);
const board = this.generateBoard(holeCards); // Передаем карты игроков
```

## Алгоритм работы

1. **Генерация карт игроков:**
   - Если диапазоны пустые → случайные карты из колоды
   - Если диапазоны заданы → поиск совместимых комбинаций (до 1000 попыток)
   - Если совместимые не найдены → случайные карты

2. **Генерация борда:**
   - Исключаем карты игроков из доступной колоды
   - Генерируем флоп/терн/ривер из оставшихся карт

3. **Проверка уникальности:**
   - Все карты в игре гарантированно уникальны
   - Невозможно дублирование между игроками и бордом

## Тестирование

Проведено тестирование:
- ✅ 100 тестов со случайными картами - все уникальны
- ✅ 10 тестов с конкретными диапазонами (AA vs KK) - работает корректно
- ✅ Проверка совместимости с существующим кодом

## Результат

🎉 **Проблема полностью решена!**

- Невозможно дублирование карт между игроками
- Невозможно дублирование карт между игроками и бордом  
- Сохранена совместимость с диапазонами рук
- Добавлен fallback на случайные карты при конфликтах
- Система работает стабильно и предсказуемо

Теперь каждая карта в игре уникальна, как и должно быть в настоящем покере! 