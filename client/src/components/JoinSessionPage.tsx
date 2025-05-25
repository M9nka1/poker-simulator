import React, { useState } from 'react';
import { GameSession } from '../App';

interface JoinSessionPageProps {
  onSessionJoined: (session: GameSession) => void;
  onBackToSetup: () => void;
}

const JoinSessionPage: React.FC<JoinSessionPageProps> = ({ 
  onSessionJoined, 
  onBackToSetup 
}) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleJoinSession = async () => {
    if (!sessionId.trim()) {
      setError('Введите ID сессии');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/session/${sessionId.trim()}`);
      
      if (response.ok) {
        const sessionData = await response.json();
        
        const gameSession: GameSession = {
          sessionId: sessionData.sessionId,
          tables: sessionData.tables,
          settings: sessionData.settings,
          playerNames: sessionData.playerNames || []
        };
        
        onSessionJoined(gameSession);
      } else if (response.status === 404) {
        setError('Сессия не найдена. Проверьте правильность ID.');
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinSession();
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          color: '#4CAF50', 
          marginBottom: '10px',
          fontSize: '2rem'
        }}>
          🎮 Присоединиться к игре
        </h2>
        
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          marginBottom: '30px',
          fontSize: '1.1rem'
        }}>
          Введите ID сессии, чтобы присоединиться к существующей игре
        </p>

        <div style={{ marginBottom: '25px' }}>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            ID Сессии:
          </label>
          
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Например: 123e4567-e89b-12d3-a456-426614174000"
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '10px',
              border: error ? '2px solid #e74c3c' : '2px solid #34495e',
              backgroundColor: '#34495e',
              color: 'white',
              fontSize: '16px',
              boxSizing: 'border-box',
              textAlign: 'center'
            }}
            autoFocus
            disabled={isLoading}
          />
          
          {error && (
            <div style={{
              color: '#e74c3c',
              marginTop: '10px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              ❌ {error}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
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
            ⬅️ Назад
          </button>
          
          <button
            onClick={handleJoinSession}
            disabled={isLoading || !sessionId.trim()}
            style={{
              padding: '15px 30px',
              borderRadius: '10px',
              border: '2px solid #4CAF50',
              backgroundColor: (!isLoading && sessionId.trim()) ? '#4CAF50' : '#34495e',
              color: 'white',
              cursor: (!isLoading && sessionId.trim()) ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: (!isLoading && sessionId.trim()) ? 1 : 0.5
            }}
          >
            {isLoading ? '🔄 Подключение...' : '🚀 Присоединиться'}
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
            💡 Как получить ID сессии?
          </h4>
          
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            <p style={{ margin: '5px 0' }}>
              1. Попросите создателя сессии поделиться ID
            </p>
            <p style={{ margin: '5px 0' }}>
              2. ID отображается в заголовке игровой страницы
            </p>
            <p style={{ margin: '5px 0' }}>
              3. ID имеет формат: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinSessionPage; 