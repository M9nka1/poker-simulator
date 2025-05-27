import React, { useState } from 'react';
import './LayoutDebugger.css';

interface LayoutSettings {
  // Header
  headerHeight: number;
  headerPadding: number;
  
  // Game Container
  gameContainerPadding: number;
  gameContainerGap: number;
  
  // Player Zones
  opponentZoneTop: number;
  opponentZoneHeight: number;
  currentPlayerZoneBottom: number;
  currentPlayerZoneHeight: number;
  
  // Table Center
  tableCenterTop: number;
  tableCenterHeight: number;
  tableCenterWidth: number;
  
  // Poker Felt
  feltPadding: number;
  feltBorderRadius: number;
  
  // Board Cards
  boardCardsGap: number;
  boardCardWidth: number;
  boardCardHeight: number;
  
  // Pot Display
  potDisplayTop: number;
  potDisplayWidth: number;
  potDisplayHeight: number;
  
  // Action Panel
  actionPanelBottom: number;
  actionPanelHeight: number;
  actionPanelWidth: number;
  
  // Player Cards
  playerCardWidth: number;
  playerCardHeight: number;
  playerCardPadding: number;
  
  // Player Card Sizing
  playerCardMinWidth: number;
  playerCardMinHeight: number;
  
  // Hole Cards
  holeCardWidth: number;
  holeCardHeight: number;
  holeCardGap: number;
}

const defaultSettings: LayoutSettings = {
  // Header
  headerHeight: 80,
  headerPadding: 20,
  
  // Game Container
  gameContainerPadding: 20,
  gameContainerGap: 20,
  
  // Player Zones
  opponentZoneTop: 100,
  opponentZoneHeight: 150,
  currentPlayerZoneBottom: 200,
  currentPlayerZoneHeight: 150,
  
  // Table Center
  tableCenterTop: 280,
  tableCenterHeight: 300,
  tableCenterWidth: 80,
  
  // Poker Felt
  feltPadding: 40,
  feltBorderRadius: 20,
  
  // Board Cards
  boardCardsGap: 15,
  boardCardWidth: 60,
  boardCardHeight: 84,
  
  // Pot Display
  potDisplayTop: 20,
  potDisplayWidth: 150,
  potDisplayHeight: 80,
  
  // Action Panel
  actionPanelBottom: 20,
  actionPanelHeight: 200,
  actionPanelWidth: 90,
  
  // Player Cards
  playerCardWidth: 250,
  playerCardHeight: 120,
  playerCardPadding: 15,
  
  // Player Card Sizing
  playerCardMinWidth: 180,
  playerCardMinHeight: 100,
  
  // Hole Cards
  holeCardWidth: 35,
  holeCardHeight: 49,
  holeCardGap: 8,
};

const LayoutDebugger: React.FC = () => {
  const [settings, setSettings] = useState<LayoutSettings>(defaultSettings);
  const [selectedElement, setSelectedElement] = useState<string>('');
  const [showGrid, setShowGrid] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);

  // Mock data for testing
  const mockTable = {
    id: 1,
    pot: 288,
    currentStreet: 'flop',
    currentPlayer: 1,
    handComplete: false,
    winner: null,
    players: [
      {
        id: 1,
        name: 'Player 1',
        stack: 890,
        position: 'BTN',
        connected: true,
        holeCards: [
          { rank: 'A', suit: 'hearts', display: 'A♥' },
          { rank: 'K', suit: 'spades', display: 'K♠' }
        ],
        actions: []
      },
      {
        id: 2,
        name: 'Player 2',
        stack: 832,
        position: 'BB',
        connected: true,
        holeCards: [
          { rank: 'Q', suit: 'diamonds', display: 'Q♦' },
          { rank: 'J', suit: 'clubs', display: 'J♣' }
        ],
        actions: [{ action: 'bet', amount: 58, street: 'flop' }]
      }
    ],
    board: {
      flop: [
        { rank: '9', suit: 'hearts', display: '9♥' },
        { rank: '7', suit: 'spades', display: '7♠' },
        { rank: '2', suit: 'diamonds', display: '2♦' }
      ],
      turn: null,
      river: null
    }
  };

  const updateSetting = (key: keyof LayoutSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const exportSettings = () => {
    const settingsJson = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSettings(imported);
        } catch (error) {
          alert('Ошибка при импорте настроек');
        }
      };
      reader.readAsText(file);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const generateCSS = () => {
    const css = `
/* Generated Layout CSS */
.modern-header {
  height: ${settings.headerHeight}px;
  padding: ${settings.headerPadding}px;
}

.game-container {
  padding: ${settings.gameContainerPadding}px;
  gap: ${settings.gameContainerGap}px;
}

.player-zone.opponent {
  top: ${settings.opponentZoneTop}px;
  height: ${settings.opponentZoneHeight}px;
}

.player-zone.current-player {
  bottom: ${settings.currentPlayerZoneBottom}px;
  height: ${settings.currentPlayerZoneHeight}px;
}

.table-center {
  top: ${settings.tableCenterTop}px;
  height: ${settings.tableCenterHeight}px;
  width: ${settings.tableCenterWidth}%;
}

.poker-felt {
  padding: ${settings.feltPadding}px;
  border-radius: ${settings.feltBorderRadius}px;
}

.board-cards {
  gap: ${settings.boardCardsGap}px;
}

.board-card-slot {
  width: ${settings.boardCardWidth}px;
  height: ${settings.boardCardHeight}px;
}

.pot-display {
  top: ${settings.potDisplayTop}px;
  width: ${settings.potDisplayWidth}px;
  height: ${settings.potDisplayHeight}px;
}

.action-panel {
  bottom: ${settings.actionPanelBottom}px;
  height: ${settings.actionPanelHeight}px;
  width: ${settings.actionPanelWidth}%;
}

.player-card {
  width: ${settings.playerCardWidth}px;
  height: ${settings.playerCardHeight}px;
  padding: ${settings.playerCardPadding}px;
}

.player-card .hole-cards .rank-card {
  width: ${settings.holeCardWidth}px;
  height: ${settings.holeCardHeight}px;
}

.player-card .hole-cards {
  gap: ${settings.holeCardGap}px;
}
`;
    
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout-styles.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="layout-debugger">
      {/* Control Panel */}
      <div className="control-panel">
        <div className="control-header">
          <h2>🔧 Layout Debugger</h2>
          <div className="control-buttons">
            <button onClick={() => setShowGrid(!showGrid)}>
              {showGrid ? '🔲' : '⬜'} Grid
            </button>
            <button onClick={() => setShowMeasurements(!showMeasurements)}>
              📏 Measurements
            </button>
            <button onClick={exportSettings}>💾 Export</button>
            <label className="import-btn">
              📁 Import
              <input type="file" accept=".json" onChange={importSettings} style={{display: 'none'}} />
            </label>
            <button onClick={resetSettings}>🔄 Reset</button>
            <button onClick={generateCSS}>📄 Generate CSS</button>
          </div>
        </div>

        {/* Settings Controls */}
        <div className="settings-grid">
          {/* Header Settings */}
          <div className="setting-group">
            <h3>Header</h3>
            <div className="setting-item">
              <label>Height: {settings.headerHeight}px</label>
              <input
                type="range"
                min="50"
                max="150"
                value={settings.headerHeight}
                onChange={(e) => updateSetting('headerHeight', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Padding: {settings.headerPadding}px</label>
              <input
                type="range"
                min="10"
                max="50"
                value={settings.headerPadding}
                onChange={(e) => updateSetting('headerPadding', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Player Zones */}
          <div className="setting-group">
            <h3>Player Zones</h3>
            <div className="setting-item">
              <label>Opponent Top: {settings.opponentZoneTop}px</label>
              <input
                type="range"
                min="50"
                max="200"
                value={settings.opponentZoneTop}
                onChange={(e) => updateSetting('opponentZoneTop', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Opponent Height: {settings.opponentZoneHeight}px</label>
              <input
                type="range"
                min="100"
                max="250"
                value={settings.opponentZoneHeight}
                onChange={(e) => updateSetting('opponentZoneHeight', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Current Bottom: {settings.currentPlayerZoneBottom}px</label>
              <input
                type="range"
                min="150"
                max="350"
                value={settings.currentPlayerZoneBottom}
                onChange={(e) => updateSetting('currentPlayerZoneBottom', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Table Center */}
          <div className="setting-group">
            <h3>Table Center</h3>
            <div className="setting-item">
              <label>Top: {settings.tableCenterTop}px</label>
              <input
                type="range"
                min="200"
                max="400"
                value={settings.tableCenterTop}
                onChange={(e) => updateSetting('tableCenterTop', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Height: {settings.tableCenterHeight}px</label>
              <input
                type="range"
                min="200"
                max="500"
                value={settings.tableCenterHeight}
                onChange={(e) => updateSetting('tableCenterHeight', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Width: {settings.tableCenterWidth}%</label>
              <input
                type="range"
                min="60"
                max="100"
                value={settings.tableCenterWidth}
                onChange={(e) => updateSetting('tableCenterWidth', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Board Cards */}
          <div className="setting-group">
            <h3>Board Cards</h3>
            <div className="setting-item">
              <label>Gap: {settings.boardCardsGap}px</label>
              <input
                type="range"
                min="5"
                max="30"
                value={settings.boardCardsGap}
                onChange={(e) => updateSetting('boardCardsGap', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Width: {settings.boardCardWidth}px</label>
              <input
                type="range"
                min="40"
                max="100"
                value={settings.boardCardWidth}
                onChange={(e) => updateSetting('boardCardWidth', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Height: {settings.boardCardHeight}px</label>
              <input
                type="range"
                min="56"
                max="140"
                value={settings.boardCardHeight}
                onChange={(e) => updateSetting('boardCardHeight', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Action Panel */}
          <div className="setting-group">
            <h3>Action Panel</h3>
            <div className="setting-item">
              <label>Bottom: {settings.actionPanelBottom}px</label>
              <input
                type="range"
                min="10"
                max="200"
                value={settings.actionPanelBottom}
                onChange={(e) => updateSetting('actionPanelBottom', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Height: {settings.actionPanelHeight}px</label>
              <input
                type="range"
                min="150"
                max="350"
                value={settings.actionPanelHeight}
                onChange={(e) => updateSetting('actionPanelHeight', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Width: {settings.actionPanelWidth}%</label>
              <input
                type="range"
                min="70"
                max="100"
                value={settings.actionPanelWidth}
                onChange={(e) => updateSetting('actionPanelWidth', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Player Cards */}
          <div className="setting-group">
            <h3>Player Cards</h3>
            <div className="setting-item">
              <label>Hole Card Width: {settings.holeCardWidth}px</label>
              <input
                type="range"
                min="25"
                max="60"
                value={settings.holeCardWidth}
                onChange={(e) => updateSetting('holeCardWidth', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Hole Card Height: {settings.holeCardHeight}px</label>
              <input
                type="range"
                min="35"
                max="84"
                value={settings.holeCardHeight}
                onChange={(e) => updateSetting('holeCardHeight', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Hole Card Gap: {settings.holeCardGap}px</label>
              <input
                type="range"
                min="4"
                max="20"
                value={settings.holeCardGap}
                onChange={(e) => updateSetting('holeCardGap', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Player Card Min Width: {settings.playerCardMinWidth}px</label>
              <input
                type="range"
                min="150"
                max="300"
                value={settings.playerCardMinWidth}
                onChange={(e) => updateSetting('playerCardMinWidth', parseInt(e.target.value))}
              />
            </div>
            <div className="setting-item">
              <label>Player Card Min Height: {settings.playerCardMinHeight}px</label>
              <input
                type="range"
                min="80"
                max="150"
                value={settings.playerCardMinHeight}
                onChange={(e) => updateSetting('playerCardMinHeight', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="preview-area" style={{
        position: 'relative',
        width: '1200px',
        height: '800px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        margin: '20px auto',
        overflow: 'hidden',
        border: '2px solid #333'
      }}>
        {/* Grid Overlay */}
        {showGrid && (
          <div className="grid-overlay" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            pointerEvents: 'none',
            zIndex: 1000
          }} />
        )}

        {/* Header */}
        <div 
          className="debug-header"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${settings.headerHeight}px`,
            padding: `${settings.headerPadding}px`,
            background: 'rgba(255, 255, 255, 0.1)',
            border: selectedElement === 'header' ? '2px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            margin: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedElement('header')}
        >
          <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Стол #1
          </div>
          <div style={{ color: '#00ff88' }}>
            🟢 Подключен
          </div>
        </div>

        {/* Opponent Player */}
        <div 
          className="debug-opponent"
          style={{
            position: 'absolute',
            top: `${settings.opponentZoneTop}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${settings.playerCardMinWidth}px`,
            height: `${settings.playerCardMinHeight}px`,
            background: 'rgba(255, 255, 255, 0.1)',
            border: selectedElement === 'opponent' ? '2px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: `${settings.playerCardPadding}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedElement('opponent')}
        >
          <div style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>
            {mockTable.players[1].name}
          </div>
          <div style={{ color: '#00ff88' }}>
            €{mockTable.players[1].stack}
          </div>
          <div style={{ 
            display: 'flex', 
            gap: `${settings.holeCardGap}px`,
            marginTop: '10px'
          }}>
            {mockTable.players[1].holeCards.map((card, index) => (
              <div
                key={index}
                style={{
                  width: `${settings.holeCardWidth}px`,
                  height: `${settings.holeCardHeight}px`,
                  background: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
              >
                {card.display}
              </div>
            ))}
          </div>
        </div>

        {/* Table Center */}
        <div 
          className="debug-table-center"
          style={{
            position: 'absolute',
            top: `${settings.tableCenterTop}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${settings.tableCenterWidth}%`,
            height: `${settings.tableCenterHeight}px`,
            background: 'rgba(13, 79, 60, 0.3)',
            border: selectedElement === 'table' ? '2px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: `${settings.feltBorderRadius}px`,
            padding: `${settings.feltPadding}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedElement('table')}
        >
          {/* Pot Display */}
          <div style={{
            width: `${settings.potDisplayWidth}px`,
            height: `${settings.potDisplayHeight}px`,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>БАНК</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00ff88' }}>
              €{mockTable.pot}
            </div>
          </div>

          {/* Board Cards */}
          <div style={{
            display: 'flex',
            gap: `${settings.boardCardsGap}px`,
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '15px 20px',
            borderRadius: '15px'
          }}>
            {mockTable.board.flop.map((card, index) => (
              <div
                key={index}
                style={{
                  width: `${settings.boardCardWidth}px`,
                  height: `${settings.boardCardHeight}px`,
                  background: 'white',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                {card.display}
              </div>
            ))}
          </div>
        </div>

        {/* Current Player */}
        <div 
          className="debug-current-player"
          style={{
            position: 'absolute',
            bottom: `${settings.currentPlayerZoneBottom}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${settings.playerCardMinWidth}px`,
            height: `${settings.playerCardMinHeight}px`,
            background: 'rgba(255, 255, 255, 0.1)',
            border: selectedElement === 'current' ? '2px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: `${settings.playerCardPadding}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedElement('current')}
        >
          <div style={{ 
            display: 'flex', 
            gap: `${settings.holeCardGap}px`,
            marginBottom: '10px'
          }}>
            {mockTable.players[0].holeCards.map((card, index) => (
              <div
                key={index}
                style={{
                  width: `${settings.holeCardWidth}px`,
                  height: `${settings.holeCardHeight}px`,
                  background: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
              >
                {card.display}
              </div>
            ))}
          </div>
          <div style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>
            {mockTable.players[0].name} (YOU)
          </div>
          <div style={{ color: '#00ff88' }}>
            €{mockTable.players[0].stack}
          </div>
        </div>

        {/* Action Panel */}
        <div 
          className="debug-action-panel"
          style={{
            position: 'absolute',
            bottom: `${settings.actionPanelBottom}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${settings.actionPanelWidth}%`,
            height: `${settings.actionPanelHeight}px`,
            background: 'rgba(255, 255, 255, 0.1)',
            border: selectedElement === 'actions' ? '2px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedElement('actions')}
        >
          <div style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>
            Панель действий
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button style={{ 
              padding: '10px 15px', 
              borderRadius: '10px', 
              border: 'none',
              background: '#607d8b',
              color: 'white',
              fontSize: '0.9rem'
            }}>
              ЧЕК
            </button>
            <button style={{ 
              padding: '10px 15px', 
              borderRadius: '10px', 
              border: 'none',
              background: '#4caf50',
              color: 'white',
              fontSize: '0.9rem'
            }}>
              БЕТ €115
            </button>
          </div>
        </div>

        {/* Measurements */}
        {showMeasurements && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 1001
          }}>
            <div>Selected: {selectedElement || 'none'}</div>
            <div>Viewport: 1200×800</div>
            <div>Action Panel Bottom: {settings.actionPanelBottom}px</div>
            <div>Table Center Top: {settings.tableCenterTop}px</div>
            <div>Gap: {settings.tableCenterTop + settings.tableCenterHeight + settings.actionPanelBottom}px</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutDebugger; 