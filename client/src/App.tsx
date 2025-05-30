import React, { useState, useEffect } from 'react';
import './App.css';
import SetupPage from './components/SetupPage';
import GamePage from './components/GamePage';
import JoinSessionPage from './components/JoinSessionPage';
import TablePage from './components/TablePage';
import CardSpriteEditor from './components/CardSpriteEditor';
import CardTestPage from './components/CardTestPage';
import CardPositionTuner from './components/CardPositionTuner';
import OptimizedCardTest from './components/OptimizedCardTest';
import LayoutDebugger from './components/LayoutDebugger';
import HandRangeTest from './components/HandRangeTest';
import TestWindow from './components/TestWindow';
import config from './config';

export interface GameSession {
  sessionId: string;
  sessionIds?: string[]; // Массив ID сессий для множественных столов
  tables: any[];
  settings: any;
  playerNames: string[];
  preflopInfo?: any;
  isGuest?: boolean;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'setup' | 'game' | 'join' | 'table' | 'sprite-editor' | 'card-test' | 'card-position' | 'optimized-card-test' | 'layout-debugger' | 'hand-range-test' | 'test-window'>('setup');
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [tableParams, setTableParams] = useState<any>(null);

  // Новая функция для автоматического подключения гостя к сессии
  const joinSessionAsGuest = async (sessionId: string, tableStyle: string = 'modern') => {
    try {
      console.log('🔗 Auto-joining session as guest:', sessionId);
      
      // Получаем информацию о сессии
      const response = await fetch(`${config.apiBaseUrl}/api/session/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Сессия не найдена или недоступна');
      }
      
      const sessionData = await response.json();
      console.log('📊 Session data for guest:', sessionData);
      
      // Определяем количество столов в сессии
      const tableCount = sessionData.tables ? sessionData.tables.length : 1;
      console.log(`🎯 Opening ${tableCount} tables for guest in modern style`);
      
      // Открываем окно для каждого стола в сессии в современном стиле
      let openedWindows = 0;
      
      for (let i = 0; i < tableCount; i++) {
        const table = sessionData.tables[i] || { id: i + 1 };
        
        setTimeout(() => {
          const opened = openGuestTableWindow(sessionId, table.id, sessionData.playerNames || ['Player1', 'Player2'], i);
          if (opened) {
            openedWindows++;
          }
        }, i * 200); // 200ms задержка между окнами
      }
      
      // Показываем уведомление о подключении
      setTimeout(() => {
        alert(`✅ Подключение к сессии как гость!\nОткрыто ${tableCount} столов в современном стиле.\nВы играете как Игрок 2.`);
      }, tableCount * 200 + 500);
      
      console.log('✅ Successfully initiated guest connection with modern tables');
      
    } catch (error) {
      console.error('❌ Error joining session as guest:', error);
      alert(`Ошибка подключения к сессии: ${(error as Error).message}`);
    }
  };

  // Функция для открытия окна отдельного стола для гостя
  const openGuestTableWindow = (sessionId: string, tableId: number, playerNames: string[], windowIndex: number): boolean => {
    try {
      // Создаем URL для отдельного стола в современном стиле
      const baseUrl = config.apiBaseUrl;
      const tableUrl = new URL(baseUrl);
      
      // Добавляем параметры в hash для современного стола с параметрами гостя
      tableUrl.hash = `table?sessionId=${sessionId}&tableId=${tableId}&playerNames=${encodeURIComponent(JSON.stringify(playerNames))}&tableStyle=modern&isGuest=true`;
      
      // Вычисляем позицию окна
      const windowWidth = 1200;
      const windowHeight = 800;
      const offsetX = windowIndex * 50; // Смещение каждого следующего окна
      const offsetY = windowIndex * 50;
      const startX = 100 + offsetX;
      const startY = 100 + offsetY;
      
      // Настройки окна для полноэкранного режима без элементов браузера
      const windowFeatures = [
        `width=${windowWidth}`,
        `height=${windowHeight}`,
        `left=${startX}`,
        `top=${startY}`,
        'resizable=yes',
        'scrollbars=no',
        'status=no',
        'menubar=no',
        'toolbar=no',
        'location=no',
        'directories=no'
      ].join(',');
      
      // Открываем новое окно
      const newWindow = window.open(
        tableUrl.toString(),
        `poker-guest-modern-table-${sessionId}-${tableId}`,
        windowFeatures
      );
      
      if (newWindow) {
        // Фокусируемся на новом окне
        newWindow.focus();
        
        // Устанавливаем заголовок окна после загрузки
        newWindow.addEventListener('load', () => {
          newWindow.document.title = `Покерный стол #${tableId} - Сессия ${sessionId.substring(0, 8)} (Гость)`;
        });
        
        console.log(`🪟 Opened guest window for table ${tableId} at position (${startX}, ${startY})`);
        return true;
      } else {
        console.error(`❌ Failed to open guest window for table ${tableId}`);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ Exception when opening guest window for table ${tableId}:`, error);
      return false;
    }
  };

  // Проверяем hash при загрузке для определения, нужно ли показать отдельный стол
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash === '#sprite-editor') {
        setCurrentPage('sprite-editor');
      } else if (hash === '#card-test') {
        setCurrentPage('card-test');
      } else if (hash === '#card-position') {
        setCurrentPage('card-position');
      } else if (hash === '#optimized-card-test') {
        setCurrentPage('optimized-card-test');
      } else if (hash === '#layout-debugger') {
        setCurrentPage('layout-debugger');
      } else if (hash === '#hand-range-test') {
        setCurrentPage('hand-range-test');
      } else if (hash === '#test-window') {
        setCurrentPage('test-window');
      } else if (hash.startsWith('#table?')) {
        // Парсим параметры из hash для отдельного стола (хост)
        const params = new URLSearchParams(hash.substring(7)); // убираем '#table?'
        const sessionId = params.get('sessionId');
        const tableId = params.get('tableId');
        const playerNames = params.get('playerNames') 
          ? JSON.parse(decodeURIComponent(params.get('playerNames')!)) 
          : [];
        const tableStyle = params.get('tableStyle') || 'classic';

        if (sessionId && tableId) {
          setTableParams({
            sessionId,
            tableId: parseInt(tableId),
            playerNames,
            tableStyle
          });
          setCurrentPage('table');
        }
      } else if (hash.startsWith('#join?')) {
        // Парсим параметры для подключения гостя к сессии
        const params = new URLSearchParams(hash.substring(6)); // убираем '#join?'
        const sessionId = params.get('sessionId');
        const isGuest = params.get('isGuest') === 'true';
        const tableStyle = params.get('tableStyle') || 'modern';

        if (sessionId && isGuest) {
          console.log('🔗 Guest joining session from URL:', sessionId);
          // Автоматически подключаемся к сессии как гость
          joinSessionAsGuest(sessionId, tableStyle);
        }
      }
    };

    checkHash();

    // Слушаем изменения hash
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleSessionCreated = (session: GameSession) => {
    setGameSession(session);
    setCurrentPage('game');
  };

  const handleSessionJoined = (session: GameSession) => {
    setGameSession(session);
    setCurrentPage('game');
  };

  const handleBackToSetup = () => {
    setCurrentPage('setup');
    setGameSession(null);
    window.location.hash = '';
  };

  const handleGoToJoin = () => {
    setCurrentPage('join');
  };

  // Если это окно отдельного стола
  if (currentPage === 'table' && tableParams) {
    return <TablePage {...tableParams} />;
  }

  // Если это редактор sprite sheet
  if (currentPage === 'sprite-editor') {
    return <CardSpriteEditor />;
  }

  // Если это тестовая страница карт
  if (currentPage === 'card-test') {
    return <CardTestPage />;
  }

  // Если это страница настройки позиционирования карт
  if (currentPage === 'card-position') {
    return <CardPositionTuner />;
  }

  // Если это страница тестирования оптимизированных карт
  if (currentPage === 'optimized-card-test') {
    return <OptimizedCardTest />;
  }

  // Если это отладчик позиционирования
  if (currentPage === 'layout-debugger') {
    return <LayoutDebugger />;
  }

  // Если это страница тестирования рук
  if (currentPage === 'hand-range-test') {
    return <HandRangeTest />;
  }

  // Если это тестовое окно
  if (currentPage === 'test-window') {
    return <TestWindow />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🃏 Poker Simulator - Hand2Note Integration</h1>
        <p>Продвинутый покерный симулятор с началом на флопе</p>
      </header>
      
      <main className="App-main">
        {currentPage === 'setup' ? (
          <SetupPage 
            onSessionCreated={handleSessionCreated}
            onGoToJoin={handleGoToJoin}
          />
        ) : currentPage === 'join' ? (
          <JoinSessionPage
            onSessionJoined={handleSessionJoined}
            onBackToSetup={handleBackToSetup}
          />
        ) : (
          <GamePage 
            session={gameSession!} 
            onBackToSetup={handleBackToSetup}
          />
        )}
      </main>
    </div>
  );
}

export default App;
