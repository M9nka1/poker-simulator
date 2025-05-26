import React, { useState, useEffect } from 'react';
import { GameSession } from '../App';

interface JoinSessionPageProps {
  onSessionJoined: (session: GameSession) => void;
  onBackToSetup: () => void;
}

interface SessionInfo {
  sessionId: string;
  gameType: string;
  tableCount: number;
  createdAt: string;
  playerCount: number;
  maxPlayers: number;
}

const JoinSessionPage: React.FC<JoinSessionPageProps> = ({ 
  onSessionJoined, 
  onBackToSetup 
}) => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Загружаем список доступных сессий при загрузке компонента
  useEffect(() => {
    loadAvailableSessions();
  }, []);

  const loadAvailableSessions = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sessions');
      
      if (response.ok) {
        const sessionsData = await response.json();
        setSessions(sessionsData);
      } else {
        throw new Error('Failed to load sessions');
      }
    } catch (error) {
      console.error('Load sessions error:', error);
      setError('Ошибка при загрузке списка сессий. Попробуйте обновить страницу.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/session/${sessionId}`);
      
      if (response.ok) {
        const sessionData = await response.json();
        
        const gameSession: GameSession = {
          sessionId: sessionData.sessionId,
          tables: sessionData.tables,
          settings: sessionData.settings,
          playerNames: sessionData.playerNames || []
        };
        
        // Открываем новое окно для второго игрока
        openPlayerWindow(sessionData.sessionId, sessionData.tables[0].id, sessionData.playerNames || []);
        
        alert(`✅ Подключение к сессии!\n\nОткрыто новое окно для игры.\nВы играете как Игрок 2.`);
        
      } else if (response.status === 404) {
        setError('Сессия не найдена. Обновите список сессий.');
        loadAvailableSessions();
      } else {
        throw new Error('Failed to join session');
      }
    } catch (error) {
      console.error('Join session error:', error);
      setError('Ошибка при подключении к сессии. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const openPlayerWindow = (sessionId: string, tableId: number, playerNames: string[]) => {
    // Создаем URL с параметрами для стола
    const baseUrl = window.location.origin;
    const tableUrl = new URL(`${baseUrl}`);
    
    // Добавляем параметры в hash для передачи в новое окно
    tableUrl.hash = `table?sessionId=${sessionId}&tableId=${tableId}&playerNames=${encodeURIComponent(JSON.stringify(playerNames))}`;
    
    // Настройки окна для полноэкранного режима без элементов браузера
    const windowFeatures = [
      'width=1200',
      'height=800',
      'left=150',
      'top=150',
      'resizable=yes',
      'scrollbars=no',
      'status=no',
      'menubar=no',
      'toolbar=no',
      'location=no',
      'directories=no',
      'titlebar=no',
      'chrome=no',
      'fullscreen=no'
    ].join(',');
    
    // Открываем новое окно
    const newWindow = window.open(
      tableUrl.toString(),
      `poker-table-${sessionId}-${tableId}`,
      windowFeatures
    );
    
    if (newWindow) {
      // Фокусируемся на новом окне
      newWindow.focus();
      
      // Устанавливаем заголовок окна после загрузки
      newWindow.addEventListener('load', () => {
        newWindow.document.title = `Покерный стол #${tableId} - Сессия ${sessionId.substring(0, 8)}`;
      });
    } else {
      // Если окно не открылось (заблокировано браузером)
      alert('Не удалось открыть новое окно. Проверьте настройки блокировки всплывающих окон в браузере.');
    }
  };

  const formatGameType = (sessionInfo: SessionInfo) => {
    // Извлекаем тип игры из названия файла или используем стандартное название
    if (sessionInfo.gameType && sessionInfo.gameType !== 'Unknown') {
      return sessionInfo.gameType;
    }
    return 'Покер сессия';
  };

  const formatCreatedTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: '30px'
      }}>
        <h2 style={{ 
          color: '#4CAF50', 
          marginBottom: '10px',
          fontSize: '2rem',
          textAlign: 'center'
        }}>
          🎮 Присоединиться к игре
        </h2>
        
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          marginBottom: '30px',
          fontSize: '1.1rem',
          textAlign: 'center'
        }}>
          Выберите сессию из списка доступных игр
        </p>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: 'white', margin: 0 }}>
            Доступные сессии ({sessions.length})
          </h3>
          <button
            onClick={loadAvailableSessions}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '2px solid #2196F3',
              backgroundColor: 'transparent',
              color: '#2196F3',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? '🔄' : '🔄 Обновить'}
          </button>
        </div>

        {error && (
          <div style={{
            color: '#e74c3c',
            marginBottom: '20px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '10px',
            background: 'rgba(231, 76, 60, 0.1)',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            borderRadius: '8px'
          }}>
            ❌ {error}
          </div>
        )}

        {isLoading && sessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            🔄 Загрузка сессий...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'rgba(255, 255, 255, 0.6)',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
            border: '2px dashed rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎯</div>
            <h3 style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '10px' }}>
              Нет доступных сессий
            </h3>
            <p style={{ margin: 0 }}>
              Создайте новую игру или попросите друга поделиться сессией
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                style={{
                  background: selectedSessionId === session.sessionId 
                    ? 'rgba(76, 175, 80, 0.2)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  border: selectedSessionId === session.sessionId 
                    ? '2px solid #4CAF50' 
                    : '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setSelectedSessionId(session.sessionId)}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '15px',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{
                      color: 'white',
                      margin: '0 0 8px 0',
                      fontSize: '1.2rem'
                    }}>
                      🎯 {formatGameType(session)}
                    </h4>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '10px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                        🏆 Столов: {session.tableCount}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                        👥 Игроков: {session.playerCount}/{session.maxPlayers}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                        ⏰ {formatCreatedTime(session.createdAt)}
                      </div>
                    </div>
                    
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace'
                    }}>
                      ID: {session.sessionId.substring(0, 8)}...
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinSession(session.sessionId);
                    }}
                    disabled={isLoading}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px',
                      border: '2px solid #4CAF50',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      opacity: isLoading ? 0.5 : 1,
                      minWidth: '100px'
                    }}
                  >
                    {isLoading ? '⏳' : '🚀 Играть'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '30px'
        }}>
          <button
            onClick={onBackToSetup}
            disabled={isLoading}
            style={{
              padding: '15px 30px',
              borderRadius: '10px',
              border: '2px solid #95a5a6',
              backgroundColor: 'transparent',
              color: '#95a5a6',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            ⬅️ Назад к созданию игры
          </button>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(33, 150, 243, 0.1)',
          border: '1px solid rgba(33, 150, 243, 0.3)',
          borderRadius: '10px'
        }}>
          <h4 style={{ 
            color: '#2196F3', 
            marginBottom: '15px',
            fontSize: '1.1rem'
          }}>
            💡 Как присоединиться к игре?
          </h4>
          
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            <p style={{ margin: '5px 0' }}>
              1. Выберите сессию из списка выше
            </p>
            <p style={{ margin: '5px 0' }}>
              2. Нажмите кнопку "🚀 Играть" для подключения
            </p>
            <p style={{ margin: '5px 0' }}>
              3. Откроется новое окно с покерным столом
            </p>
            <p style={{ margin: '5px 0' }}>
              4. Вы автоматически станете Игроком 2
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinSessionPage; 