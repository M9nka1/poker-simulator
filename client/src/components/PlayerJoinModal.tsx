import React, { useState } from 'react';

interface PlayerJoinModalProps {
  sessionId: string;
  tableId: number;
  playerNames: string[];
  onJoin: (playerId: number, playerName: string) => void;
  onCancel: () => void;
}

const PlayerJoinModal: React.FC<PlayerJoinModalProps> = ({
  sessionId,
  tableId,
  playerNames,
  onJoin,
  onCancel
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<number>(1);
  const [playerName, setPlayerName] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [useCustomName, setUseCustomName] = useState<boolean>(false);

  const handleJoin = () => {
    const finalName = useCustomName ? customName.trim() : playerName;
    if (finalName) {
      onJoin(selectedPlayer, finalName);
    }
  };

  const isValidName = useCustomName ? customName.trim().length > 0 : playerName.length > 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#2c3e50',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        color: 'white',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '25px',
          color: '#4CAF50'
        }}>
          🎮 Присоединиться к игре
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ 
            textAlign: 'center', 
            opacity: 0.8,
            marginBottom: '15px'
          }}>
            Сессия: <strong>{sessionId}</strong><br />
            Стол: <strong>#{tableId}</strong>
          </p>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            Выберите имя игрока:
          </label>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}>
              <input
                type="checkbox"
                checked={useCustomName}
                onChange={(e) => {
                  setUseCustomName(e.target.checked);
                  if (!e.target.checked) {
                    setCustomName('');
                  } else {
                    setPlayerName('');
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
              Использовать собственное имя
            </label>
          </div>

          {!useCustomName ? (
            <select
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #34495e',
                backgroundColor: '#34495e',
                color: 'white',
                fontSize: '16px',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
              autoFocus
            >
              <option value="">-- Выберите игрока --</option>
              {playerNames.map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Введите ваше имя"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #34495e',
                backgroundColor: '#34495e',
                color: 'white',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          )}
          
          {playerNames.length === 0 && !useCustomName && (
            <p style={{ 
              fontSize: '0.8rem', 
              color: '#FFA726', 
              marginTop: '8px',
              fontStyle: 'italic'
            }}>
              Имена игроков не найдены в файле. Используйте собственное имя.
            </p>
          )}
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '15px',
            fontWeight: 'bold'
          }}>
            Выберите позицию:
          </label>
          
          <div style={{ 
            display: 'flex', 
            gap: '15px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setSelectedPlayer(1)}
              style={{
                padding: '15px 25px',
                borderRadius: '10px',
                border: selectedPlayer === 1 ? '3px solid #4CAF50' : '2px solid #34495e',
                backgroundColor: selectedPlayer === 1 ? '#4CAF50' : '#34495e',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              🎯 Игрок 1<br />
              <small style={{ opacity: 0.8 }}>Button</small>
            </button>
            
            <button
              onClick={() => setSelectedPlayer(2)}
              style={{
                padding: '15px 25px',
                borderRadius: '10px',
                border: selectedPlayer === 2 ? '3px solid #4CAF50' : '2px solid #34495e',
                backgroundColor: selectedPlayer === 2 ? '#4CAF50' : '#34495e',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              🎲 Игрок 2<br />
              <small style={{ opacity: 0.8 }}>Big Blind</small>
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '15px',
          justifyContent: 'center'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 25px',
              borderRadius: '8px',
              border: '2px solid #e74c3c',
              backgroundColor: 'transparent',
              color: '#e74c3c',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ❌ Отмена
          </button>
          
          <button
            onClick={handleJoin}
            disabled={!isValidName}
            style={{
              padding: '12px 25px',
              borderRadius: '8px',
              border: '2px solid #4CAF50',
              backgroundColor: isValidName ? '#4CAF50' : '#34495e',
              color: 'white',
              cursor: isValidName ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: isValidName ? 1 : 0.5
            }}
          >
            🚀 Присоединиться
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerJoinModal; 