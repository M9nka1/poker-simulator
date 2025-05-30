interface PreflopSpot {
  id: string;
  name: string;
  description: string;
  potSize: number;
  blinds: { small: number; big: number };
  actions: Array<{ player: string; action: string; amount: number }>;
  handHistoryText?: string; // Добавляем полный текст истории
}

class PreflopSpotsLoader {
  private spots: PreflopSpot[] = [];

  // Парсинг hand history текста в структурированные данные
  private parseHandHistory(filename: string, content: string): PreflopSpot {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    let potSize = 0;
    let blinds = { small: 0, big: 0 };
    let actions: Array<{ player: string; action: string; amount: number }> = [];
    let inPreflop = false;
    let playerBets: { [key: string]: number } = {};

    // Извлекаем название из filename (убираем .txt и заменяем _ на пробелы)
    const name = filename.replace('.txt', '').replace(/_/g, ' ');
    
    for (const line of lines) {
      // Парсим блайнды
      const blindMatch = line.match(/(.+): posts (small blind|big blind) [$€](\d+(?:\.\d+)?)/);
      if (blindMatch) {
        const player = blindMatch[1];
        const blindType = blindMatch[2];
        const amount = parseFloat(blindMatch[3]);
        
        if (blindType === 'small blind') {
          blinds.small = amount;
        } else if (blindType === 'big blind') {
          blinds.big = amount;
        }
        
        playerBets[player] = amount;
        actions.push({
          player,
          action: blindType,
          amount
        });
        continue;
      }

      // Начало префлоп действий
      if (line.includes('*** HOLE CARDS ***')) {
        inPreflop = true;
        continue;
      }

      // Конец префлопа
      if (line.includes('*** FLOP ***')) {
        break;
      }

      if (inPreflop) {
        // Парсим fold
        const foldMatch = line.match(/(.+): folds/);
        if (foldMatch) {
          actions.push({
            player: foldMatch[1],
            action: 'fold',
            amount: 0
          });
          continue;
        }

        // Парсим raises с "to" (например: raises $15.00 to $25.00)
        const raiseToMatch = line.match(/(.+): raises [$€](\d+(?:\.\d+)?) to [$€](\d+(?:\.\d+)?)/);
        if (raiseToMatch) {
          const player = raiseToMatch[1];
          const totalBet = parseFloat(raiseToMatch[3]);
          
          // Определяем тип действия
          let actionType = 'raise';
          if (actions.filter(a => a.action === 'raise' || a.action === '3bet' || a.action === '4bet').length === 1) {
            actionType = '3bet';
          } else if (actions.filter(a => a.action === 'raise' || a.action === '3bet' || a.action === '4bet').length === 2) {
            actionType = '4bet';
          }
          
          playerBets[player] = totalBet;
          actions.push({
            player,
            action: actionType,
            amount: totalBet
          });
          continue;
        }

        // Парсим calls
        const callMatch = line.match(/(.+): calls [$€](\d+(?:\.\d+)?)/);
        if (callMatch) {
          const player = callMatch[1];
          const amount = parseFloat(callMatch[2]);
          const previousBet = playerBets[player] || 0;
          
          playerBets[player] = previousBet + amount;
          actions.push({
            player,
            action: 'call',
            amount: amount
          });
          continue;
        }
      }
    }

    // Вычисляем размер банка на флопе
    potSize = Object.values(playerBets).reduce((sum, bet) => sum + bet, 0);

    return {
      id: filename.replace('.txt', '').toLowerCase().replace(/\s+/g, '-'),
      name,
      description: `Префлоп спот: ${name}`,
      potSize,
      blinds,
      actions,
      handHistoryText: content
    };
  }

  // Загрузка всех TXT файлов из папки
  async loadSpotsFromFolder(): Promise<PreflopSpot[]> {
    this.spots = [];

    try {
      // Список известных TXT файлов
      const knownFiles = [
        'BTN_vs_BB_3bet.txt',
        'CO_vs_BTN_4bet.txt', 
        '3bet_SBvsBU.txt'
      ];
      
      console.log('🔄 Загружаем TXT файлы:', knownFiles);
      
      for (const filename of knownFiles) {
        try {
          const response = await fetch(`/preflop-spots/${filename}`);
          if (response.ok) {
            const content = await response.text();
            console.log(`✅ Загружен файл ${filename}, размер: ${content.length} символов`);
            const spot = this.parseHandHistory(filename, content);
            console.log(`📊 Парсинг ${filename}:`, {
              potSize: spot.potSize,
              blinds: spot.blinds,
              actionsCount: spot.actions.length,
              players: spot.actions.map(a => a.player)
            });
            this.spots.push(spot);
          } else {
            console.warn(`⚠️ Файл ${filename} не найден (${response.status})`);
          }
        } catch (error) {
          console.warn(`⚠️ Ошибка загрузки ${filename}:`, error);
        }
      }

      console.log(`✅ Загружено ${this.spots.length} префлоп спотов из TXT файлов`);
      return this.spots;
    } catch (error) {
      console.error('❌ Ошибка загрузки префлоп спотов:', error);
      // Fallback на spots.json
      return this.loadFromJson();
    }
  }

  // Получить все загруженные споты
  getSpots(): PreflopSpot[] {
    return this.spots;
  }

  // Получить спот по ID
  getSpotById(id: string): PreflopSpot | null {
    return this.spots.find(spot => spot.id === id) || null;
  }

  // Fallback загрузка из JSON
  private async loadFromJson(): Promise<PreflopSpot[]> {
    try {
      const spotsModule = await import('../data/preflop-spots/spots.json');
      return spotsModule.default || [];
    } catch (error) {
      console.error('❌ Ошибка загрузки spots.json:', error);
      return [];
    }
  }
}

// Создаем глобальный экземпляр
const preflopSpotsLoader = new PreflopSpotsLoader();

export type { PreflopSpot };
export { preflopSpotsLoader };
export default preflopSpotsLoader; 