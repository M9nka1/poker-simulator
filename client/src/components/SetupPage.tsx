import React, { useState, useRef } from 'react';
import HandRangeMatrix from './HandRangeMatrix';
import BoardSettings from './BoardSettings';
import { GameSession } from '../App';

interface SetupPageProps {
  onSessionCreated: (session: GameSession) => void;
  onGoToJoin: () => void;
}

interface PreflopAnalysis {
  potSize: number;
  actionCount: number;
  playersInvolved: number;
  blinds: { small: number; big: number };
  validation: { isValid: boolean; error?: string };
}

const SetupPage: React.FC<SetupPageProps> = ({ onSessionCreated, onGoToJoin }) => {
  const [preflopHistory, setPreflopHistory] = useState<string>('');
  const [preflopFile, setPreflopFile] = useState<File | null>(null);
  const [preflopAnalysis, setPreflopAnalysis] = useState<PreflopAnalysis | null>(null);
  const [tableCount, setTableCount] = useState<number>(1);
  const [rakeSettings, setRakeSettings] = useState({
    percentage: 2.5,
    cap: 5
  });
  
  interface HandSelection {
    hand: string;
    percentage: number;
  }

  const [handRanges, setHandRanges] = useState({
    player1: [] as HandSelection[],
    player2: [] as HandSelection[]
  });
  
  // Состояние для текстового ввода hand ranges
  const [textRanges, setTextRanges] = useState({
    player1: '',
    player2: ''
  });
  
  // Функция парсинга текстового формата hand ranges
  const parseHandRange = (rangeText: string): HandSelection[] => {
    if (!rangeText.trim()) return [];
    
    const hands: HandSelection[] = [];
    const parts = rangeText.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      
      // Проверяем есть ли процент (например: AA:0.3, 99:0.35, K2s:0.75)
      if (trimmed.includes(':')) {
        const colonIndex = trimmed.lastIndexOf(':'); // Используем lastIndexOf на случай если в названии руки есть ':'
        const hand = trimmed.substring(0, colonIndex).trim();
        const percentStr = trimmed.substring(colonIndex + 1).trim();
        
        const percentage = parseFloat(percentStr);
        if (hand && !isNaN(percentage) && percentage >= 0 && percentage <= 1) {
          // Конвертируем из 0-1 в 0-100 для совместимости с HandRangeMatrix
          hands.push({ hand: hand, percentage: percentage * 100 });
        } else {
          console.warn(`Неверный формат процента для руки: ${trimmed}`);
        }
      } else {
        // Если нет процента, используем 100%
        hands.push({ hand: trimmed, percentage: 100 });
      }
    }
    
    return hands;
  };
  
  // Функция применения текстового ввода к hand ranges
  const applyTextRange = (player: 'player1' | 'player2') => {
    const parsedHands = parseHandRange(textRanges[player]);
    setHandRanges(prev => ({ ...prev, [player]: parsedHands }));
  };
  
  // Функция очистки hand ranges
  const clearHandRange = (player: 'player1' | 'player2') => {
    setHandRanges(prev => ({ ...prev, [player]: [] }));
    setTextRanges(prev => ({ ...prev, [player]: '' }));
  };

  const [boardSettings, setBoardSettings] = useState({
    flopSettings: {
      random: true,
      twoTone: false,
      rainbow: false,
      monotone: false,
      paired: false,
      specific: false,
      specificCards: [],
      ranges: false,
      rangeSettings: { high: [], middle: [], low: [] }
    },
    turnSettings: {
      enabled: true,
      specific: false,
      specificCard: null
    },
    riverSettings: {
      enabled: true,
      specific: false,
      specificCard: null
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzePreflopHistory = async (content: string) => {
    try {
      const response = await fetch('/api/analyze-preflop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preflopText: content })
      });

      if (response.ok) {
        const result = await response.json();
        setPreflopAnalysis({
          potSize: result.summary.potSize,
          actionCount: result.summary.actionCount,
          playersInvolved: result.summary.playersInvolved,
          blinds: result.summary.blinds,
          validation: result.validation
        });
      }
    } catch (error) {
      console.error('Error analyzing preflop:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreflopFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPreflopHistory(content);
        analyzePreflopHistory(content);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setPreflopFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPreflopHistory(content);
        analyzePreflopHistory(content);
      };
      reader.readAsText(file);
    }
  };

  const handlePlayer1RangeChange = (selectedHands: HandSelection[]) => {
    setHandRanges(prev => ({ ...prev, player1: selectedHands }));
  };

  const handlePlayer2RangeChange = (selectedHands: HandSelection[]) => {
    setHandRanges(prev => ({ ...prev, player2: selectedHands }));
  };

  const handleBoardSettingsChange = (newSettings: any) => {
    setBoardSettings(newSettings);
  };

  const createSession = async () => {
    if (handRanges.player1.length === 0 || handRanges.player2.length === 0) {
      alert('Пожалуйста, выберите диапазоны рук для обоих игроков');
      return;
    }

    setIsLoading(true);
    
    try {
      // Upload preflop history if file is selected
      let uploadedPreflopHistory = preflopHistory;
      if (preflopFile) {
        const formData = new FormData();
        formData.append('preflopHistory', preflopFile);
        
        const uploadResponse = await fetch('/api/upload-preflop', {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          uploadedPreflopHistory = uploadResult.content;
        }
      }

      // Create session
      const convertedHandRanges = {
        player1: handRanges.player1.map(h => h.hand),
        player2: handRanges.player2.map(h => h.hand)
      };

      const sessionData = {
        preflopHistory: uploadedPreflopHistory,
        boardSettings,
        handRanges: convertedHandRanges,
        tableCount,
        rakeSettings
      };

      const response = await fetch('/api/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        const result = await response.json();
        onSessionCreated({
          sessionId: result.sessionId,
          tables: result.tables,
          settings: sessionData,
          playerNames: result.playerNames || [],
          preflopInfo: result.preflopInfo
        });
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Ошибка при создании сессии. Проверьте подключение к серверу.');
    } finally {
      setIsLoading(false);
    }
  };

  const createSessionWithNewWindows = async () => {
    if (handRanges.player1.length === 0 || handRanges.player2.length === 0) {
      alert('Пожалуйста, выберите диапазоны рук для обоих игроков');
      return;
    }

    setIsLoading(true);
    
    try {
      // Upload preflop history if file is selected
      let uploadedPreflopHistory = preflopHistory;
      if (preflopFile) {
        const formData = new FormData();
        formData.append('preflopHistory', preflopFile);
        
        const uploadResponse = await fetch('/api/upload-preflop', {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          uploadedPreflopHistory = uploadResult.content;
        }
      }

      // Create session
      const convertedHandRanges = {
        player1: handRanges.player1.map(h => h.hand),
        player2: handRanges.player2.map(h => h.hand)
      };

      const sessionData = {
        preflopHistory: uploadedPreflopHistory,
        boardSettings,
        handRanges: convertedHandRanges,
        tableCount,
        rakeSettings
      };

      const response = await fetch('/api/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Открываем новые окна для каждого стола (без betSizes)
        openTableWindows(result.sessionId, result.tables, result.playerNames || []);
        
        alert(`✅ Сессия создана! Открыто ${result.tables.length} окон с покерными столами.\n\nID сессии: ${result.sessionId}\n\nПоделитесь этим ID с другими игроками для присоединения к игре.`);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Ошибка при создании сессии. Проверьте подключение к серверу.');
    } finally {
      setIsLoading(false);
    }
  };

  const openTableWindows = (sessionId: string, tables: any[], playerNames: string[]) => {
    tables.forEach((table, index) => {
      // Небольшая задержка между открытием окон
      setTimeout(() => {
        openTableWindow(sessionId, table.id, playerNames, index);
      }, index * 300); // 300ms задержка между окнами
    });
  };

  const openTableWindow = (sessionId: string, tableId: number, playerNames: string[], windowIndex: number) => {
    // Создаем URL с параметрами для стола (без betSizes)
    const baseUrl = window.location.origin;
    const tableUrl = new URL(`${baseUrl}`);
    
    // Добавляем параметры в hash для передачи в новое окно
    tableUrl.hash = `table?sessionId=${sessionId}&tableId=${tableId}&playerNames=${encodeURIComponent(JSON.stringify(playerNames))}&tableStyle=modern`;
    
    // Настройки окна для полноэкранного режима без элементов браузера
    const windowFeatures = [
      'width=1200',
      'height=800',
      `left=${100 + windowIndex * 50}`,
      `top=${100 + windowIndex * 50}`,
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

  return (
    <div className="setup-page">
      <div className="setup-section">
        <h2>📁 Настройка Префлоп История</h2>
        
        <div className="form-group">
          <label>Загрузить Префлоп Hand History (необязательно)</label>
          <div 
            className="file-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {preflopFile ? (
              <div>
                <p>✅ Файл загружен: {preflopFile.name}</p>
                <p>Размер: {(preflopFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p>📁 Перетащите файл сюда или нажмите для выбора</p>
                <p>Поддерживаются .txt файлы с Hand History</p>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt"
            style={{ display: 'none' }}
          />
        </div>

        {preflopAnalysis && (
          <div className="form-group">
            <label>Анализ префлоп истории</label>
            <div style={{
              background: preflopAnalysis.validation.isValid ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 82, 67, 0.1)',
              border: `1px solid ${preflopAnalysis.validation.isValid ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 82, 67, 0.3)'}`,
              borderRadius: '8px',
              padding: '15px',
              margin: '10px 0'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', color: '#4CAF50', fontWeight: 'bold' }}>
                    €{preflopAnalysis.potSize}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Банк на флопе</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', color: '#FFA726', fontWeight: 'bold' }}>
                    {preflopAnalysis.actionCount}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Действий в префлопе</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', color: '#2196F3', fontWeight: 'bold' }}>
                    {preflopAnalysis.blinds.small}/{preflopAnalysis.blinds.big}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Блайнды</div>
                </div>
              </div>
              
              {!preflopAnalysis.validation.isValid && (
                <div style={{ marginTop: '10px', color: '#FF5722', fontSize: '0.9rem' }}>
                  ⚠️ {preflopAnalysis.validation.error}
                </div>
              )}
              
              {preflopAnalysis.validation.isValid && (
                <div style={{ marginTop: '10px', color: '#4CAF50', fontSize: '0.9rem' }}>
                  ✅ Префлоп история валидна. Банк €{preflopAnalysis.potSize} будет установлен на всех столах.
                </div>
              )}
            </div>
          </div>
        )}

        {preflopHistory && (
          <div className="form-group">
            <label>Предпросмотр Префлоп истории</label>
            <textarea
              value={preflopHistory.substring(0, 200) + '...'}
              readOnly
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '5px'
              }}
            />
          </div>
        )}

        <div className="form-group">
          <label>Количество столов</label>
          <select
            value={tableCount}
            onChange={(e) => setTableCount(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map(num => (
              <option key={num} value={num}>{num} стол{num > 1 ? (num > 4 ? 'ов' : 'а') : ''}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>💰 Настройки рейка</label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginTop: '10px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#FFA726', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                Процент:
              </span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={rakeSettings.percentage}
                onChange={(e) => setRakeSettings(prev => ({
                  ...prev,
                  percentage: parseFloat(e.target.value) || 0
                }))}
                style={{
                  width: '60px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}
              />
              <span style={{ color: '#FFA726', fontSize: '0.9rem' }}>%</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#FFA726', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                Максимум:
              </span>
              <span style={{ color: '#FFA726', fontSize: '0.9rem' }}>$</span>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={rakeSettings.cap}
                onChange={(e) => setRakeSettings(prev => ({
                  ...prev,
                  cap: parseFloat(e.target.value) || 0
                }))}
                style={{
                  width: '60px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}
              />
            </div>
            
            <div style={{
              padding: '6px 12px',
              background: 'rgba(33,150,243,0.1)',
              border: '1px solid rgba(33,150,243,0.3)',
              borderRadius: '4px',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.8)'
            }}>
              💡 Отображается в Hand History
            </div>
          </div>
        </div>
      </div>

      <div className="setup-section">
        <h2>🎯 Настройка Борда</h2>
        <BoardSettings
          settings={boardSettings}
          onChange={handleBoardSettingsChange}
        />
      </div>

      <div className="setup-section">
        <h2>🎴 Диапазон рук - Игрок 1</h2>
        
        {/* Текстовый ввод hand ranges */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label>📝 Текстовый ввод (формат: AA:0.3,KK,QQ:0.3,JJ,TT...)</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <textarea
              value={textRanges.player1}
              onChange={(e) => setTextRanges(prev => ({ ...prev, player1: e.target.value }))}
              placeholder="AA:0.3,KK,QQ:0.3,JJ,TT,99,88,77,66,55,44,33,22,AK,AQ,AJ,AT,A9,A8,A7,A6,A5,A4,A3,A2,KQ,KJs,KJo:0.3,KTs,KTo:0.3,K9s,K9o:0.3,K8s,K8o:0.3,K7s,K7o:0.3,K6s:0.55,K6o:0.3,K5s:0.55,K5o:0.3,K4s:0.55,K4o,K3,K2,QJs,QJo:0.3,QTs,QTo:0.3,Q9,Q8s:0.55,Q8o,Q7s,Q7o:0.3,Q6s:0.55,Q6o:0.3,Q5s:0.55,Q5o:0.3,Q4s:0.55,Q4o:0.3,Q3s,Q3o:0.3,Q2,JTs,JTo:0.3,J9s,J9o:0.3,J8s:0.55,J8o:0.3,J7s,J7o:0.3,J6s:0.55,J6o:0.3,J5s:0.55,J5o:0.3,J4s:0.55,J4o,J3s,J3o:0.3,J2,T9,T8s:0.55,T8o,T7s:0.55,T7o,T6s:0.55,T6o,T5s:0.55,T5o,T4,T3,T2,98,97,96,95,94,93,92,87,86,85,84,83s:0.55,83o,82,76,75,74,73s:0.55,73o,72,65,64,63,62,54,53,52,43,42,32"
              rows={4}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '5px',
                fontSize: '0.9rem',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button
                onClick={() => applyTextRange('player1')}
                style={{
                  padding: '8px 16px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}
              >
                ✅ Применить
              </button>
              <button
                onClick={() => clearHandRange('player1')}
                style={{
                  padding: '8px 16px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}
              >
                🗑️ Очистить
              </button>
            </div>
          </div>
          {textRanges.player1 && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.7)' 
            }}>
              💡 Формат: рука или рука:процент (например: AA:0.3 = 30% от AA, KK = 100% от KK)
            </div>
          )}
        </div>
        
        <HandRangeMatrix
          selectedHands={handRanges.player1}
          onSelectionChange={handlePlayer1RangeChange}
          playerId="1"
          playerName="Player 1 (BTN/IP)"
        />
        <p>Выбрано: {handRanges.player1.length} комбинаций</p>
      </div>

      <div className="setup-section">
        <h2>🎴 Диапазон рук - Игрок 2</h2>
        
        {/* Текстовый ввод hand ranges */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label>📝 Текстовый ввод (формат: AA:0.3,KK,QQ:0.3,JJ,TT...)</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <textarea
              value={textRanges.player2}
              onChange={(e) => setTextRanges(prev => ({ ...prev, player2: e.target.value }))}
              placeholder="AA:0.3,KK,QQ:0.3,JJ,TT,99,88,77,66,55,44,33,22,AK,AQ,AJ,AT,A9,A8,A7,A6,A5,A4,A3,A2,KQ,KJs,KJo:0.3,KTs,KTo:0.3,K9s,K9o:0.3,K8s,K8o:0.3,K7s,K7o:0.3,K6s:0.55,K6o:0.3,K5s:0.55,K5o:0.3,K4s:0.55,K4o,K3,K2,QJs,QJo:0.3,QTs,QTo:0.3,Q9,Q8s:0.55,Q8o,Q7s,Q7o:0.3,Q6s:0.55,Q6o:0.3,Q5s:0.55,Q5o:0.3,Q4s:0.55,Q4o:0.3,Q3s,Q3o:0.3,Q2,JTs,JTo:0.3,J9s,J9o:0.3,J8s:0.55,J8o:0.3,J7s,J7o:0.3,J6s:0.55,J6o:0.3,J5s:0.55,J5o:0.3,J4s:0.55,J4o,J3s,J3o:0.3,J2,T9,T8s:0.55,T8o,T7s:0.55,T7o,T6s:0.55,T6o,T5s:0.55,T5o,T4,T3,T2,98,97,96,95,94,93,92,87,86,85,84,83s:0.55,83o,82,76,75,74,73s:0.55,73o,72,65,64,63,62,54,53,52,43,42,32"
              rows={4}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '5px',
                fontSize: '0.9rem',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button
                onClick={() => applyTextRange('player2')}
                style={{
                  padding: '8px 16px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}
              >
                ✅ Применить
              </button>
              <button
                onClick={() => clearHandRange('player2')}
                style={{
                  padding: '8px 16px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}
              >
                🗑️ Очистить
              </button>
            </div>
          </div>
          {textRanges.player2 && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.7)' 
            }}>
              💡 Формат: рука или рука:процент (например: AA:0.3 = 30% от AA, KK = 100% от KK)
            </div>
          )}
        </div>
        
        <HandRangeMatrix
          selectedHands={handRanges.player2}
          onSelectionChange={handlePlayer2RangeChange}
          playerId="2"
          playerName="Player 2 (BB/OOP)"
        />
        <p>Выбрано: {handRanges.player2.length} комбинаций</p>
      </div>

      <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '30px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}>
          <button
            className={`btn btn-primary ${isLoading ? 'pulsing' : ''}`}
            onClick={createSessionWithNewWindows}
            disabled={isLoading || handRanges.player1.length === 0 || handRanges.player2.length === 0}
            style={{ fontSize: '1.1rem', padding: '12px 24px' }}
          >
            {isLoading ? '🎲 Создание сессии...' : '🪟 Создать в новых окнах'}
          </button>
          
          <button
            className={`btn btn-success ${isLoading ? 'pulsing' : ''}`}
            onClick={createSession}
            disabled={isLoading || handRanges.player1.length === 0 || handRanges.player2.length === 0}
            style={{ fontSize: '1.1rem', padding: '12px 24px' }}
          >
            {isLoading ? '🎲 Создание сессии...' : '🚀 Создать в этом окне'}
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={onGoToJoin}
            disabled={isLoading}
            style={{ fontSize: '1.1rem', padding: '12px 24px' }}
          >
            🎮 Присоединиться к игре
          </button>
          
          <button
            className="btn btn-info"
            onClick={() => window.location.hash = '#sprite-editor'}
            style={{ fontSize: '1.1rem', padding: '12px 24px' }}
          >
            🎴 Редактор карт
          </button>
          
          <button
            className="btn btn-warning"
            onClick={() => window.location.hash = '#card-test'}
            style={{ fontSize: '1.1rem', padding: '12px 24px' }}
          >
            🧪 Тест карт
          </button>
          
          <button
            className="btn btn-purple"
            onClick={() => window.location.hash = '#card-position'}
            style={{ fontSize: '1.1rem', padding: '12px 24px', backgroundColor: '#9C27B0' }}
          >
            🎯 Настройка карт
          </button>
          
          <button
            className="btn btn-teal"
            onClick={() => window.location.hash = '#optimized-card-test'}
            style={{ fontSize: '1.1rem', padding: '12px 24px', backgroundColor: '#009688' }}
          >
            ✨ Тест оптимизированных карт
          </button>
          
          <button
            className="btn btn-debug"
            onClick={() => window.location.hash = '#layout-debugger'}
            style={{ fontSize: '1.1rem', padding: '12px 24px', backgroundColor: '#FF6B6B', color: 'white' }}
          >
            🔧 Отладка позиционирования
          </button>

          <button
            className="btn btn-test"
            onClick={() => window.location.hash = '#hand-range-test'}
            style={{ fontSize: '1.1rem', padding: '12px 24px', backgroundColor: '#E91E63', color: 'white' }}
          >
            🧪 Тест Hand Ranges
          </button>

        </div>
        
        {(handRanges.player1.length === 0 || handRanges.player2.length === 0) && (
          <p style={{ color: '#FF7043', marginTop: '10px' }}>
            ⚠️ Выберите диапазоны рук для обоих игроков (только для создания новой игры)
          </p>
        )}
        
        {preflopAnalysis && preflopAnalysis.potSize > 0 && (
          <p style={{ color: '#4CAF50', marginTop: '10px' }}>
            💰 Игра начнётся с банком €{preflopAnalysis.potSize} на флопе
          </p>
        )}
        
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(33, 150, 243, 0.1)',
          border: '1px solid rgba(33, 150, 243, 0.3)',
          borderRadius: '10px',
          maxWidth: '600px',
          margin: '20px auto 0'
        }}>
          <h4 style={{ color: '#2196F3', marginBottom: '10px' }}>
            🎯 Многопользовательская игра
          </h4>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', margin: '0' }}>
            <strong>Создать новую игру:</strong> Настройте параметры и создайте сессию для игры с друзьями<br />
            <strong>Присоединиться:</strong> Выберите из списка доступных сессий для подключения к игре
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupPage; 