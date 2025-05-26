import React, { useState, useEffect } from 'react';
import './App.css';
import SetupPage from './components/SetupPage';
import GamePage from './components/GamePage';
import JoinSessionPage from './components/JoinSessionPage';
import TablePage from './components/TablePage';

export interface GameSession {
  sessionId: string;
  tables: any[];
  settings: any;
  playerNames: string[];
  preflopInfo?: any;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'setup' | 'game' | 'join' | 'table'>('setup');
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [tableParams, setTableParams] = useState<any>(null);

  // Проверяем hash при загрузке для определения, нужно ли показать отдельный стол
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#table?')) {
        // Парсим параметры из hash
        const params = new URLSearchParams(hash.substring(7)); // убираем '#table?'
        const sessionId = params.get('sessionId');
        const tableId = params.get('tableId');
        const playerNames = params.get('playerNames') 
          ? JSON.parse(decodeURIComponent(params.get('playerNames')!)) 
          : [];
        // betSizes теперь настраиваются на столе, не передаются через URL

        if (sessionId && tableId) {
          setTableParams({
            sessionId,
            tableId: parseInt(tableId),
            playerNames
          });
          setCurrentPage('table');
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
