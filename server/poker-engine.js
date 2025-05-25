class PokerEngine {
  constructor(boardSettings, handRanges, preflopHistory = null) {
    this.boardSettings = boardSettings;
    this.handRanges = handRanges;
    this.preflopHistory = preflopHistory;
    this.deck = this.createDeck();
  }

  createDeck() {
    const suits = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const deck = [];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ rank, suit, display: rank + suit });
      }
    }
    
    return deck;
  }

  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateHoleCards(handRanges) {
    const player1Range = handRanges.player1 || [];
    const player2Range = handRanges.player2 || [];
    
    // Если диапазоны пустые, генерируем случайные карты из колоды
    if (player1Range.length === 0 && player2Range.length === 0) {
      return this.generateRandomHoleCards();
    }
    
    // Convert matrix selections to actual hands
    const player1Hands = this.expandHandRange(player1Range);
    const player2Hands = this.expandHandRange(player2Range);
    
    // Если один из диапазонов пустой, генерируем случайные карты
    if (player1Hands.length === 0 || player2Hands.length === 0) {
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
        return {
          player1: player1Hand,
          player2: player2Hand
        };
      }
      
      attempts++;
    }
    
    // Если не удалось найти совместимые руки, генерируем случайные
    console.warn('⚠️ Could not find compatible hands from ranges, generating random cards');
    return this.generateRandomHoleCards();
  }

  generateRandomHoleCards() {
    // Создаем перемешанную колоду
    const shuffledDeck = this.shuffleDeck(this.deck);
    
    // Берем первые 4 карты для двух игроков
    const player1Hand = [shuffledDeck[0], shuffledDeck[1]];
    const player2Hand = [shuffledDeck[2], shuffledDeck[3]];
    
    return {
      player1: player1Hand,
      player2: player2Hand
    };
  }

  expandHandRange(rangeSelection) {
    // Convert matrix selection to actual card combinations
    const hands = [];
    const suits = ['h', 'd', 'c', 's'];
    
    rangeSelection.forEach(handString => {
      if (handString.includes('s')) {
        // Suited hand
        const ranks = handString.replace('s', '');
        for (const suit of suits) {
          hands.push([
            { rank: ranks[0], suit, display: ranks[0] + suit },
            { rank: ranks[1], suit, display: ranks[1] + suit }
          ]);
        }
      } else if (handString.includes('o')) {
        // Offsuit hand
        const ranks = handString.replace('o', '');
        for (let i = 0; i < suits.length; i++) {
          for (let j = 0; j < suits.length; j++) {
            if (i !== j) {
              hands.push([
                { rank: ranks[0], suit: suits[i], display: ranks[0] + suits[i] },
                { rank: ranks[1], suit: suits[j], display: ranks[1] + suits[j] }
              ]);
            }
          }
        }
      } else if (handString.length === 2) {
        // Pocket pair
        const rank = handString[0];
        for (let i = 0; i < suits.length; i++) {
          for (let j = i + 1; j < suits.length; j++) {
            hands.push([
              { rank, suit: suits[i], display: rank + suits[i] },
              { rank, suit: suits[j], display: rank + suits[j] }
            ]);
          }
        }
      }
    });
    
    return hands;
  }

  generateBoard(holeCards = null) {
    const { flopSettings, turnSettings, riverSettings } = this.boardSettings;
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
    
    const board = [];
    
    // Generate flop
    const flop = this.generateFlop(availableDeck, flopSettings);
    board.push(...flop);
    availableDeck = availableDeck.filter(card => 
      !flop.some(flopCard => flopCard.display === card.display)
    );
    
    // Generate turn
    if (turnSettings && turnSettings.enabled) {
      const turn = this.generateTurn(availableDeck, turnSettings, board);
      board.push(turn);
      availableDeck = availableDeck.filter(card => card.display !== turn.display);
    }
    
    // Generate river
    if (riverSettings && riverSettings.enabled) {
      const river = this.generateRiver(availableDeck, riverSettings, board);
      board.push(river);
    }
    
    return board;
  }

  generateFlop(deck, settings) {
    if (settings.specific && settings.specificCards.length === 3) {
      return settings.specificCards;
    }

    if (settings.ranges && settings.rangeSettings) {
      return this.generateFlopByRanges(deck, settings.rangeSettings);
    }
    
    let candidates = [...deck];
    
    if (settings.twoTone) {
      // Two cards of same suit, one different
      const suits = ['h', 'd', 'c', 's'];
      const mainSuit = suits[Math.floor(Math.random() * suits.length)];
      const suitedCards = candidates.filter(card => card.suit === mainSuit);
      const offsuitCards = candidates.filter(card => card.suit !== mainSuit);
      
      if (suitedCards.length >= 2 && offsuitCards.length >= 1) {
        const card1 = suitedCards[Math.floor(Math.random() * suitedCards.length)];
        const card2 = suitedCards.filter(c => c.display !== card1.display)[Math.floor(Math.random() * (suitedCards.length - 1))];
        const card3 = offsuitCards[Math.floor(Math.random() * offsuitCards.length)];
        return this.shuffleArray([card1, card2, card3]);
      }
    }
    
    if (settings.rainbow) {
      // Three different suits
      const suits = ['h', 'd', 'c', 's'];
      const selectedSuits = this.shuffleArray(suits).slice(0, 3);
      const flop = [];
      
      for (const suit of selectedSuits) {
        const suitCards = candidates.filter(card => card.suit === suit);
        if (suitCards.length > 0) {
          flop.push(suitCards[Math.floor(Math.random() * suitCards.length)]);
          candidates = candidates.filter(card => card.display !== flop[flop.length - 1].display);
        }
      }
      
      return flop.length === 3 ? flop : this.getRandomCards(deck, 3);
    }
    
    if (settings.monotone) {
      // Three cards of same suit
      const suits = ['h', 'd', 'c', 's'];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const suitedCards = candidates.filter(card => card.suit === suit);
      
      if (suitedCards.length >= 3) {
        return this.shuffleArray(suitedCards).slice(0, 3);
      }
    }
    
    if (settings.paired) {
      // Two cards of same rank
      const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      const rankCards = candidates.filter(card => card.rank === rank);
      
      if (rankCards.length >= 2) {
        const pair = this.shuffleArray(rankCards).slice(0, 2);
        const remaining = candidates.filter(card => card.rank !== rank);
        const thirdCard = remaining[Math.floor(Math.random() * remaining.length)];
        return this.shuffleArray([...pair, thirdCard]);
      }
    }
    
    // Default: random flop
    return this.getRandomCards(deck, 3);
  }

  generateFlopByRanges(deck, rangeSettings) {
    const { high, middle, low } = rangeSettings;
    const suits = ['h', 'd', 'c', 's'];
    const flop = [];
    const usedCards = [];

    // Helper function to get available cards for a rank
    const getAvailableCardsForRanks = (ranks) => {
      return deck.filter(card => 
        ranks.includes(card.rank) && 
        !usedCards.some(used => used.display === card.display)
      );
    };

    // Generate high card
    if (high.length > 0) {
      const availableHighCards = getAvailableCardsForRanks(high);
      if (availableHighCards.length > 0) {
        const highCard = availableHighCards[Math.floor(Math.random() * availableHighCards.length)];
        flop.push(highCard);
        usedCards.push(highCard);
      }
    }

    // Generate middle card
    if (middle.length > 0) {
      const availableMiddleCards = getAvailableCardsForRanks(middle);
      if (availableMiddleCards.length > 0) {
        const middleCard = availableMiddleCards[Math.floor(Math.random() * availableMiddleCards.length)];
        flop.push(middleCard);
        usedCards.push(middleCard);
      }
    }

    // Generate low card
    if (low.length > 0) {
      const availableLowCards = getAvailableCardsForRanks(low);
      if (availableLowCards.length > 0) {
        const lowCard = availableLowCards[Math.floor(Math.random() * availableLowCards.length)];
        flop.push(lowCard);
        usedCards.push(lowCard);
      }
    }

    // Fill remaining slots with random cards if needed
    while (flop.length < 3) {
      const availableCards = deck.filter(card => 
        !usedCards.some(used => used.display === card.display)
      );
      if (availableCards.length > 0) {
        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        flop.push(randomCard);
        usedCards.push(randomCard);
      } else {
        break;
      }
    }

    // Sort flop by rank (high to low) to maintain proper order
    const rankOrder = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    flop.sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));

    return flop.length === 3 ? flop : this.getRandomCards(deck, 3);
  }

  generateTurn(deck, settings, currentBoard) {
    if (settings.specific && settings.specificCard) {
      return settings.specificCard;
    }
    
    // Filter out cards already on board
    const availableCards = deck.filter(card => 
      !currentBoard.some(boardCard => boardCard.display === card.display)
    );
    
    return availableCards[Math.floor(Math.random() * availableCards.length)];
  }

  generateRiver(deck, settings, currentBoard) {
    if (settings.specific && settings.specificCard) {
      return settings.specificCard;
    }
    
    // Filter out cards already on board
    const availableCards = deck.filter(card => 
      !currentBoard.some(boardCard => boardCard.display === card.display)
    );
    
    return availableCards[Math.floor(Math.random() * availableCards.length)];
  }

  getRandomCards(deck, count) {
    const shuffled = this.shuffleArray([...deck]);
    return shuffled.slice(0, count);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  createTable(tableId, initialPotSize = 0, playerStacks = {}, activePlayers = []) {
    const holeCards = this.generateHoleCards(this.handRanges);
    const board = this.generateBoard(holeCards);
    
    // Определяем стеки игроков из префлоп данных или используем значения по умолчанию
    const defaultStack = 1000;
    
    // Используем активных игроков, если они переданы, иначе всех игроков из стеков
    const playerNames = activePlayers.length > 0 ? activePlayers : Object.keys(playerStacks);
    const player1Name = playerNames[0] || 'Player 1';
    const player2Name = playerNames[1] || 'Player 2';
    const player1Stack = playerStacks[player1Name] || defaultStack;
    const player2Stack = playerStacks[player2Name] || defaultStack;
    
    console.log(`🎯 Creating table with active players: ${player1Name} (${player1Stack}) vs ${player2Name} (${player2Stack})`);
    
    return {
      id: tableId,
      players: [
        {
          id: 1,
          name: player1Name,
          stack: player1Stack,
          initialStack: player1Stack, // Сохраняем изначальный стек
          holeCards: holeCards.player1,
          position: 'BTN', // Button (in position)
          actions: [],
          connected: false
        },
        {
          id: 2,
          name: player2Name, 
          stack: player2Stack,
          initialStack: player2Stack, // Сохраняем изначальный стек
          holeCards: holeCards.player2,
          position: 'BB', // Big Blind (out of position)
          actions: [],
          connected: false
        }
      ],
      board: {
        flop: board.slice(0, 3),
        turn: board[3] || null,
        river: board[4] || null
      },
      pot: initialPotSize,
      initialPot: initialPotSize,
      currentStreet: 'flop',
      currentPlayer: 2, // BB действует первым на постфлопе (OOP)
      handComplete: false,
      winner: null
    };
  }

  processAction(table, playerId, action, amount = 0) {
    const player = table.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Invalid player');
    }

    // Проверяем валидность действия
    this.validateAction(table, playerId, action, amount);

    const actionData = {
      player: playerId,
      action,
      amount,
      street: table.currentStreet,
      timestamp: Date.now()
    };

    player.actions.push(actionData);

    switch (action) {
      case 'bet':
        if (amount > 0) {
          player.stack -= amount;
          table.pot += amount;
        }
        break;
      case 'raise':
        if (amount > 0) {
          // При raise игрок доплачивает указанную сумму сверх уже поставленного
          player.stack -= amount;
          table.pot += amount;
        }
        break;
      case 'call':
        if (amount > 0) {
          // При call игрок доплачивает до уравнивания ставки
          player.stack -= amount;
          table.pot += amount;
        }
        break;
      case 'check':
        // No money movement
        break;
      case 'fold':
        table.handComplete = true;
        table.winner = playerId === 1 ? 2 : 1;
        break;
    }

    // Switch to next player or next street
    if (!table.handComplete) {
      // Проверяем, есть ли all-in ситуация
      const isAllInSituation = this.isAllInSituation(table);
      
      if (isAllInSituation) {
        console.log(`🔥 All-in situation detected! Auto-dealing remaining cards...`);
        this.dealRemainingCards(table);
      } else if (this.shouldAdvanceStreet(table)) {
        console.log(`🔄 Advancing from ${table.currentStreet} to next street`);
        this.advanceStreet(table);
      } else {
        // Переключаем на следующего игрока
        table.currentPlayer = table.currentPlayer === 1 ? 2 : 1;
      }
    }

    return {
      table,
      handComplete: table.handComplete,
      winner: table.winner
    };
  }

  shouldAdvanceStreet(table) {
    const player1 = table.players.find(p => p.id === 1);
    const player2 = table.players.find(p => p.id === 2);
    
    const p1Actions = player1.actions.filter(a => a.street === table.currentStreet);
    const p2Actions = player2.actions.filter(a => a.street === table.currentStreet);
    
    // Оба игрока должны были действовать и торги должны быть закрыты
    if (p1Actions.length === 0 || p2Actions.length === 0) {
      return false;
    }
    
    return this.isBettingClosed(table);
  }

  isBettingClosed(table) {
    const player1 = table.players.find(p => p.id === 1);
    const player2 = table.players.find(p => p.id === 2);
    
    const p1Actions = player1.actions.filter(a => a.street === table.currentStreet);
    const p2Actions = player2.actions.filter(a => a.street === table.currentStreet);
    
    console.log(`🔍 Checking betting closed on ${table.currentStreet}:`);
    console.log(`   P1 actions: ${p1Actions.map(a => `${a.action}(${a.amount})`).join(', ')}`);
    console.log(`   P2 actions: ${p2Actions.map(a => `${a.action}(${a.amount})`).join(', ')}`);
    
    // Если кто-то сфолдил, торги закрыты
    if (p1Actions.some(a => a.action === 'fold') || p2Actions.some(a => a.action === 'fold')) {
      console.log(`   ✅ Betting closed: someone folded`);
      return true;
    }
    
    // Оба игрока должны были действовать
    if (p1Actions.length === 0 || p2Actions.length === 0) {
      console.log(`   ❌ Betting not closed: not all players acted`);
      return false;
    }
    
    const p1LastAction = p1Actions[p1Actions.length - 1];
    const p2LastAction = p2Actions[p2Actions.length - 1];
    
    // Проверяем суммы, вложенные на этой улице
    const p1Total = this.getStreetTotal(player1, table.currentStreet);
    const p2Total = this.getStreetTotal(player2, table.currentStreet);
    
    console.log(`   P1 total: €${p1Total}, P2 total: €${p2Total}`);
    
    // Проверяем различные сценарии закрытия торгов
    
    // 1. Оба чекнули
    if (p1LastAction.action === 'check' && p2LastAction.action === 'check') {
      console.log(`   ✅ Betting closed: both checked`);
      return true;
    }
    
    // 2. Проверяем последовательность bet/raise → call
    const allActions = [...p1Actions, ...p2Actions].sort((a, b) => a.timestamp - b.timestamp);
    
    if (allActions.length >= 2) {
      const lastAction = allActions[allActions.length - 1];
      const secondLastAction = allActions[allActions.length - 2];
      
      // bet/raise → call от разных игроков
      if ((secondLastAction.action === 'bet' || secondLastAction.action === 'raise') && 
          lastAction.action === 'call' && 
          secondLastAction.player !== lastAction.player) {
        console.log(`   ✅ Betting closed: ${secondLastAction.action}(${secondLastAction.amount}) → call(${lastAction.amount})`);
        return true;
      }
    }
    
    // 3. Проверяем равенство сумм для других случаев
    if (p1Total === p2Total && p1Total > 0) {
      console.log(`   ✅ Betting closed: equal amounts (€${p1Total} each)`);
      return true;
    }
    
    console.log(`   ❌ Betting not closed: amounts not equal or invalid sequence`);
    return false;
  }

  getLastAction(player, street) {
    const streetActions = player.actions.filter(a => a.street === street);
    return streetActions[streetActions.length - 1];
  }

  getStreetTotal(player, street) {
    return player.actions
      .filter(a => a.street === street && (a.action === 'bet' || a.action === 'raise' || a.action === 'call'))
      .reduce((total, action) => total + (action.amount || 0), 0);
  }

  advanceStreet(table) {
    switch (table.currentStreet) {
      case 'flop':
        table.currentStreet = 'turn';
        table.currentPlayer = 2; // BB действует первым на тёрне (OOP)
        break;
      case 'turn':
        table.currentStreet = 'river';
        table.currentPlayer = 2; // BB действует первым на ривере (OOP)
        break;
      case 'river':
        table.handComplete = true;
        table.winner = this.determineWinner(table);
        break;
    }
  }

  isAllInSituation(table) {
    // Проверяем, есть ли all-in ситуация после завершения торгов на улице
    if (!this.shouldAdvanceStreet(table)) {
      return false; // Торги еще не завершены
    }

    const player1 = table.players.find(p => p.id === 1);
    const player2 = table.players.find(p => p.id === 2);

    // Проверяем, что хотя бы один игрок пошел all-in (стек = 0)
    const player1AllIn = player1.stack === 0;
    const player2AllIn = player2.stack === 0;

    if (player1AllIn || player2AllIn) {
      console.log(`   🔥 All-in detected: P1 stack=${player1.stack}, P2 stack=${player2.stack}`);
      return true;
    }

    return false;
  }

  dealRemainingCards(table) {
    // Автоматически сдаем оставшиеся карты до ривера
    console.log(`   🎴 Auto-dealing from ${table.currentStreet} to river...`);
    
    while (table.currentStreet !== 'river' && !table.handComplete) {
      this.advanceStreet(table);
      console.log(`   📋 Advanced to ${table.currentStreet}`);
    }
    
    // После сдачи всех карт завершаем руку
    if (table.currentStreet === 'river') {
      table.handComplete = true;
      table.winner = this.determineWinner(table);
      console.log(`   🏆 Hand completed after all-in, winner: ${table.winner}`);
    }
  }

  validateAction(table, playerId, action, amount) {
    const currentPlayer = table.players.find(p => p.id === playerId);
    const otherPlayer = table.players.find(p => p.id !== playerId);
    if (!otherPlayer || !currentPlayer) return;
    
    // Проверяем, что у игрока достаточно денег
    if ((action === 'bet' || action === 'raise' || action === 'call') && amount > currentPlayer.stack) {
      throw new Error(`Insufficient funds. You have €${currentPlayer.stack}, but trying to bet €${amount}`);
    }
    
    // Получаем все действия на текущей улице в хронологическом порядке
    const allStreetActions = [
      ...currentPlayer.actions.filter(a => a.street === table.currentStreet),
      ...otherPlayer.actions.filter(a => a.street === table.currentStreet)
    ].sort((a, b) => a.timestamp - b.timestamp);
    
    const myActions = currentPlayer.actions.filter(a => a.street === table.currentStreet);
    const otherActions = otherPlayer.actions.filter(a => a.street === table.currentStreet);
    
    // Находим последнюю ставку/рейз любого игрока
    const lastBetAction = allStreetActions
      .filter(a => a.action === 'bet' || a.action === 'raise')
      .pop();
    
    // Проверяем чек после ставки
    if (action === 'check' && lastBetAction) {
      // Если последняя ставка была сделана оппонентом и мы еще не отвечали
      if (lastBetAction.player !== playerId) {
        const myActionsAfterBet = myActions.filter(a => a.timestamp > lastBetAction.timestamp);
        if (myActionsAfterBet.length === 0) {
          throw new Error('Cannot check when facing a bet. You must call, raise, or fold.');
        }
      }
    }
    
    // Проверяем колл
    if (action === 'call') {
      if (!lastBetAction) {
        throw new Error('Cannot call when there is no bet to call.');
      }
      
      // Нельзя коллировать свою же ставку
      if (lastBetAction.player === playerId) {
        throw new Error('Cannot call your own bet.');
      }
      
      // Проверяем, что мы еще не отвечали на эту ставку
      const myActionsAfterBet = myActions.filter(a => a.timestamp > lastBetAction.timestamp);
      if (myActionsAfterBet.length > 0) {
        throw new Error('You have already responded to this bet.');
      }
      
      // Рассчитываем правильную сумму call
      // Call = общая ставка оппонента на улице - наша текущая ставка на улице
      const opponentTotal = this.getStreetTotal(otherPlayer, table.currentStreet);
      const myTotal = this.getStreetTotal(currentPlayer, table.currentStreet);
      const expectedCallAmount = Math.min(opponentTotal - myTotal, currentPlayer.stack);
      
      if (amount !== expectedCallAmount) {
        throw new Error(`Invalid call amount. Expected ${expectedCallAmount}, got ${amount}`);
      }
    }
    
    // Проверяем бет/рейз
    if (action === 'bet' || action === 'raise') {
      if (amount <= 0) {
        throw new Error('Bet amount must be positive.');
      }
      
      // Если есть активная ставка от другого игрока, это должен быть рейз
      if (lastBetAction && lastBetAction.player !== playerId) {
        if (action === 'bet') {
          // Проверяем, что мы еще не отвечали на эту ставку
          const myActionsAfterBet = myActions.filter(a => a.timestamp > lastBetAction.timestamp);
          if (myActionsAfterBet.length === 0) {
            throw new Error('Must raise when facing a bet, not bet.');
          }
        }
        
        // Для raise проверяем, что сумма больше последней ставки
        if (action === 'raise' && amount <= lastBetAction.amount) {
          throw new Error(`Raise amount must be greater than ${lastBetAction.amount}`);
        }
      }
      
      // Если нет активной ставки, но используется raise
      if (!lastBetAction && action === 'raise') {
        throw new Error('Cannot raise when there is no bet to raise.');
      }
    }
  }

  determineWinner(table) {
    const player1 = table.players.find(p => p.id === 1);
    const player2 = table.players.find(p => p.id === 2);
    
    // Проверяем, что у игроков есть карты
    if (!player1 || !player2 || !Array.isArray(player1.holeCards) || !Array.isArray(player2.holeCards)) {
      console.error('❌ Invalid player data or hole cards');
      return 1; // Возвращаем игрока 1 по умолчанию
    }
    
    // Создаем полные руки (5 карт) для каждого игрока
    const allCards = [...table.board.flop];
    if (table.board.turn) allCards.push(table.board.turn);
    if (table.board.river) allCards.push(table.board.river);
    
    const player1Hand = this.evaluateHand([...player1.holeCards, ...allCards]);
    const player2Hand = this.evaluateHand([...player2.holeCards, ...allCards]);
    
    console.log(`🎯 Hand evaluation:`);
    console.log(`   Player 1: ${player1Hand.description} (strength: ${player1Hand.strength})`);
    console.log(`   Player 2: ${player2Hand.description} (strength: ${player2Hand.strength})`);
    
    // Сравниваем силу рук
    if (player1Hand.strength > player2Hand.strength) {
      return 1;
    } else if (player2Hand.strength > player1Hand.strength) {
      return 2;
    } else {
      // При равной силе сравниваем кикеры
      const result = this.compareKickers(player1Hand, player2Hand);
      if (result === 0) {
        console.log(`   🤝 Tie detected - split pot`);
        return 'tie';
      }
      return result;
    }
  }

  evaluateHand(cards) {
    // Преобразуем карты в числовые значения для анализа
    const ranks = cards.map(card => this.getRankValue(card.rank));
    const suits = cards.map(card => card.suit);
    
    // Подсчитываем количество карт каждого ранга
    const rankCounts = {};
    ranks.forEach(rank => {
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });
    
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);
    
    // Проверяем флеш
    const suitCounts = {};
    suits.forEach(suit => {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });
    const isFlush = Object.values(suitCounts).some(count => count >= 5);
    
    // Проверяем стрит и получаем его старшую карту
    const straightInfo = this.checkStraight(uniqueRanks);
    const isStraight = straightInfo.isStraight;
    const straightHigh = straightInfo.highCard;
    
    // Определяем комбинацию
    if (isFlush && isStraight) {
      return { strength: 8, description: 'Straight Flush', kickers: [straightHigh] };
    } else if (counts[0] === 4) {
      // Каре: старшая карта каре, затем кикер
      const quadRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 4);
      const kicker = uniqueRanks.find(rank => rank != quadRank);
      return { strength: 7, description: 'Four of a Kind', kickers: [parseInt(quadRank), kicker] };
    } else if (counts[0] === 3 && counts[1] === 2) {
      // Фулл-хаус: тройка, затем пара
      const tripRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 3);
      const pairRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 2);
      return { strength: 6, description: 'Full House', kickers: [parseInt(tripRank), parseInt(pairRank)] };
    } else if (isFlush) {
      // Флеш: 5 старших карт
      return { strength: 5, description: 'Flush', kickers: uniqueRanks.slice(0, 5) };
    } else if (isStraight) {
      // Стрит: только старшая карта стрита
      return { strength: 4, description: 'Straight', kickers: [straightHigh] };
    } else if (counts[0] === 3) {
      // Сет: тройка, затем 2 кикера
      const tripRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 3);
      const kickers = uniqueRanks.filter(rank => rank != tripRank).slice(0, 2);
      return { strength: 3, description: 'Three of a Kind', kickers: [parseInt(tripRank), ...kickers] };
    } else if (counts[0] === 2 && counts[1] === 2) {
      // Две пары: старшая пара, младшая пара, кикер
      const pairs = Object.keys(rankCounts).filter(rank => rankCounts[rank] === 2).map(Number).sort((a, b) => b - a);
      const kicker = uniqueRanks.find(rank => !pairs.includes(rank));
      return { strength: 2, description: 'Two Pair', kickers: [...pairs, kicker] };
    } else if (counts[0] === 2) {
      // Пара: пара, затем 3 кикера
      const pairRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 2);
      const kickers = uniqueRanks.filter(rank => rank != pairRank).slice(0, 3);
      return { strength: 1, description: 'One Pair', kickers: [parseInt(pairRank), ...kickers] };
    } else {
      // Старшая карта: 5 старших карт
      return { strength: 0, description: 'High Card', kickers: uniqueRanks.slice(0, 5) };
    }
  }

  getRankValue(rank) {
    const rankValues = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return rankValues[rank] || 0;
  }

  checkStraight(ranks) {
    // Проверяем обычный стрит
    for (let i = 0; i < ranks.length - 4; i++) {
      if (ranks[i] - ranks[i + 4] === 4) {
        return { isStraight: true, highCard: ranks[i] };
      }
    }
    
    // Проверяем A-2-3-4-5 стрит (колесо) - старшая карта 5
    if (ranks.includes(14) && ranks.includes(5) && ranks.includes(4) && ranks.includes(3) && ranks.includes(2)) {
      return { isStraight: true, highCard: 5 };
    }
    
    return { isStraight: false, highCard: null };
  }

  compareKickers(hand1, hand2) {
    // Сравниваем кикеры по порядку
    for (let i = 0; i < Math.min(hand1.kickers.length, hand2.kickers.length); i++) {
      if (hand1.kickers[i] > hand2.kickers[i]) {
        return 1;
      } else if (hand2.kickers[i] > hand1.kickers[i]) {
        return 2;
      }
    }
    
    // Если все кикеры равны, возвращаем ничью
    return 0;
  }

  dealNewHand(table) {
    // Reset table for new hand
    const holeCards = this.generateHoleCards(this.handRanges);
    const board = this.generateBoard(holeCards);
    
    const player1 = table.players.find(p => p.id === 1);
    const player2 = table.players.find(p => p.id === 2);
    
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
      
      console.log(`🔄 New hand dealt - Stacks reset: P1=${player1.stack}, P2=${player2.stack}`);
    }
    
    player1.holeCards = holeCards.player1;
    player2.holeCards = holeCards.player2;
    player1.actions = [];
    player2.actions = [];
    
    table.board = {
      flop: board.slice(0, 3),
      turn: board[3] || null,
      river: board[4] || null
    };
    
    table.pot = table.initialPot || 0;
    table.currentStreet = 'flop';
    table.currentPlayer = 2; // BB действует первым на постфлопе (OOP)
    table.handComplete = false;
    table.winner = null;
    
    return table;
  }
}

module.exports = PokerEngine; 