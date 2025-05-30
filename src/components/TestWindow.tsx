import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const TestWindow: React.FC = () => {
  // ... existing state ...

  // 🔥 НОВАЯ АРХИТЕКТУРА: Состояние для открытых столов
  const [useOpenTables, setUseOpenTables] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showSessionId, setShowSessionId] = useState(false);

  // ... existing functions ...

  // 🔥 НОВАЯ АРХИТЕКТУРА: Создание открытых столов
  const createOpenSession = async () => {
    try {
      const sessionData = {
        tableCount: tableCount,
        boardSettings: {
          flopSettings: {
            specific: specificFlopEnabled,
            specificCards: specificCards.filter(card => card !== ''),
            twoTone: twoToneEnabled,
            rainbow: rainbowEnabled,
            monotone: monotoneEnabled,
            unpaired: unpairedEnabled,
            paired: pairedEnabled,
            trips: tripsEnabled,
            ranges: rangesEnabled,
            rangeSettings: {
              high: rangeSettings.high,
              middle: rangeSettings.middle,
              low: rangeSettings.low
            }
          },
          turnSettings: {
            enabled: turnEnabled
          },
          riverSettings: {
            enabled: riverEnabled
          }
        },
        handRanges: {
          player1: playerRanges.player1,
          player2: playerRanges.player2
        },
        preflopHistory: {
          actions: preflopData.actions,
          potSize: preflopData.potSize,
          players: getPlayersForPreflop(),
          playerStacks: getPlayerStacksFromSpots(),
          stacksWithCorrectNames: getStacksWithCorrectNames(),
          blinds: preflopData.blinds
        }
      };

      console.log('🏗️ Creating open session with data:', sessionData);

      const response = await fetch('/api/create-open-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionData }),
      });

      const result = await response.json();

      if (result.success) {
        setSessionId(result.sessionId);
        setShowSessionId(true);
        
        console.log('✅ Open session created:', result.sessionId);
        
        // Открываем окна для каждого стола
        result.tables.forEach((table: any) => {
          const tableUrl = `/table?sessionId=${table.sessionId}&tableId=${table.tableId}&tableStyle=open`;
          const windowName = `OpenTable_${table.sessionId}_${table.tableId}`;
          
          window.open(
            tableUrl,
            windowName,
            'width=1200,height=800,scrollbars=yes,resizable=yes'
          );
        });

        toast.success(`Создано ${result.tables.length} открытых столов! ID сессии: ${result.sessionId}`);
      } else {
        console.error('❌ Failed to create open session:', result.error);
        toast.error(`Ошибка создания сессии: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error creating open session:', error);
      toast.error('Ошибка создания открытых столов');
    }
  };

  // 🔥 НОВАЯ АРХИТЕКТУРА: Присоединение к открытой сессии
  const joinOpenSessionFromClipboard = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const sessionIdMatch = clipboardText.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
      
      if (!sessionIdMatch) {
        toast.error('ID сессии не найден в буфере обмена');
        return;
      }

      const sessionId = sessionIdMatch[0];
      console.log('🔗 Joining open session:', sessionId);

      const response = await fetch(`/api/open-session/${sessionId}`);
      const result = await response.json();

      if (result.success) {
        console.log('✅ Found open session with tables:', result.tables.length);
        
        // Открываем окна для каждого стола в сессии
        result.tables.forEach((table: any) => {
          const tableUrl = `/table?sessionId=${table.sessionId}&tableId=${table.tableId}&tableStyle=open&isGuest=true`;
          const windowName = `OpenTable_Guest_${table.sessionId}_${table.tableId}`;
          
          window.open(
            tableUrl,
            windowName,
            'width=1200,height=800,scrollbars=yes,resizable=yes'
          );
        });

        toast.success(`Присоединение к ${result.tables.length} открытым столам!`);
      } else {
        console.error('❌ Session not found:', result.error);
        toast.error('Сессия не найдена');
      }
    } catch (error) {
      console.error('❌ Error joining open session:', error);
      toast.error('Ошибка присоединения к сессии');
    }
  }, []);

  // ... existing functions ...

  return (
    <div className="test-window">
      {/* ... existing content ... */}

      {/* 🔥 НОВАЯ АРХИТЕКТУРА: Переключатель режимов */}
      <div className="architecture-selector">
        <h3>🏗️ Архитектура столов</h3>
        <div className="toggle-switch">
          <label>
            <input
              type="checkbox"
              checked={useOpenTables}
              onChange={(e) => setUseOpenTables(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <span className="toggle-label">
            {useOpenTables ? '🆕 Открытые столы' : '🔒 Система хостов (старая)'}
          </span>
        </div>
        
        {useOpenTables && (
          <div className="open-tables-info">
            <p>✨ В режиме открытых столов:</p>
            <ul>
              <li>• Любой может создать сессию</li>
              <li>• Игроки сами выбирают позиции за столом</li>
              <li>• Игра начинается автоматически когда все сели</li>
              <li>• Нет системы хостов</li>
            </ul>
          </div>
        )}
      </div>

      {/* 🔥 НОВАЯ АРХИТЕКТУРА: ID сессии */}
      {showSessionId && sessionId && (
        <div className="session-id-display">
          <h3>🆔 ID созданной сессии</h3>
          <div className="session-id-box">
            <code>{sessionId}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sessionId);
                toast.success('ID скопирован в буфер обмена!');
              }}
              className="copy-button"
            >
              📋 Копировать
            </button>
          </div>
          <p className="session-hint">
            Поделитесь этим ID с другими игроками для присоединения к сессии
          </p>
        </div>
      )}

      {/* ... existing form content ... */}

      {/* 🔥 ОБНОВЛЕННЫЕ КНОПКИ */}
      <div className="action-buttons">
        {useOpenTables ? (
          // Новая архитектура
          <>
            <button
              onClick={createOpenSession}
              className="create-session-button open-tables"
              disabled={tableCount < 1}
            >
              🏗️ Создать открытые столы ({tableCount})
            </button>
            
            <button
              onClick={joinOpenSessionFromClipboard}
              className="join-session-button open-tables"
            >
              🔗 Присоединиться к сессии
            </button>
          </>
        ) : (
          // Старая архитектура (существующие кнопки)
          <>
            <button
              onClick={createSession}
              className="create-session-button"
              disabled={tableCount < 1 || (!isPlayerSelected && gameMode === 'modern')}
            >
              🎮 Создать сессию ({tableCount} {tableCount === 1 ? 'стол' : 'стола'})
            </button>
            
            <button
              onClick={joinSessionFromClipboard}
              className="join-session-button"
            >
              🔗 Присоединиться к сессии
            </button>
          </>
        )}
      </div>

      {/* ... existing content ... */}
    </div>
  );
};

export default TestWindow; 