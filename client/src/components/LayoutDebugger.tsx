import React, { useState, useRef, useCallback } from 'react';
import './LayoutDebugger.css';

interface Position {
  x: number;
  y: number;
}

interface ElementData {
  id: string;
  name: string;
  position: Position;
  size: { width: number; height: number };
  color: string;
  isDragging: boolean;
}

interface LayoutSettings {
  // Table Center (Poker Felt)
  tableCenterWidth: number;
  tableCenterHeight: number;
  tableCenterTop: number;
  tableCenterLeft: number;
  
  // Players inside Table Center
  opponentPlayerTop: number;
  opponentPlayerLeft: number;
  currentPlayerBottom: number;
  currentPlayerLeft: number;
  
  // Board and Pot Container
  boardContainerTop: number;
  boardContainerLeft: number;
  boardContainerWidth: number;
  
  // Betting Panel inside Table Center
  bettingPanelTop: number;
  bettingPanelLeft: number;
  bettingPanelWidth: number;
  bettingPanelHeight: number;
  
  // Header Controls
  headerControlsTop: number;
  headerControlsRight: number;
  
  // New Hand Button (outside table)
  newHandButtonBottom: number;
  newHandButtonLeft: number;
  
  // Theme Controls
  themeControlsTop: number;
  themeControlsRight: number;
}

const defaultSettings: LayoutSettings = {
  // Table Center (82% width, centered)
  tableCenterWidth: 82,
  tableCenterHeight: 530,
  tableCenterTop: 20,
  tableCenterLeft: 9, // (100-82)/2 = 9%
  
  // Players inside Table Center (relative to felt)
  opponentPlayerTop: 60, // padding from top of felt
  opponentPlayerLeft: 50, // centered
  currentPlayerBottom: 60, // padding from bottom of felt
  currentPlayerLeft: 50, // centered
  
  // Board and Pot Container (centered in felt)
  boardContainerTop: 50, // middle of felt
  boardContainerLeft: 50, // centered
  boardContainerWidth: 400,
  
  // Betting Panel (below current player)
  bettingPanelTop: 75, // below current player
  bettingPanelLeft: 50, // centered
  bettingPanelWidth: 700,
  bettingPanelHeight: 100,
  
  // Header Controls (top right of felt)
  headerControlsTop: 20,
  headerControlsRight: 20,
  
  // New Hand Button (outside table, bottom center)
  newHandButtonBottom: 121,
  newHandButtonLeft: 50,
  
  // Theme Controls (top right corner)
  themeControlsTop: 20,
  themeControlsRight: 20,
};

const LayoutDebugger: React.FC = () => {
  const [settings, setSettings] = useState<LayoutSettings>(defaultSettings);
  const [elements, setElements] = useState<ElementData[]>([
    {
      id: 'table-center',
      name: 'Poker Felt',
      position: { x: 9, y: 20 },
      size: { width: 82, height: 530 },
      color: '#0d4f3c',
      isDragging: false
    },
    {
      id: 'opponent-player',
      name: 'Opponent Player',
      position: { x: 45, y: 80 },
      size: { width: 200, height: 120 },
      color: '#4CAF50',
      isDragging: false
    },
    {
      id: 'board-container',
      name: 'Board & Pot',
      position: { x: 35, y: 250 },
      size: { width: 400, height: 120 },
      color: '#2196F3',
      isDragging: false
    },
    {
      id: 'current-player',
      name: 'Current Player',
      position: { x: 45, y: 380 },
      size: { width: 200, height: 120 },
      color: '#FF9800',
      isDragging: false
    },
    {
      id: 'betting-panel',
      name: 'Betting Panel',
      position: { x: 25, y: 520 },
      size: { width: 700, height: 100 },
      color: '#9C27B0',
      isDragging: false
    },
    {
      id: 'header-controls',
      name: 'Header Controls',
      position: { x: 75, y: 40 },
      size: { width: 200, height: 50 },
      color: '#F44336',
      isDragging: false
    },
    {
      id: 'new-hand-button',
      name: 'New Hand Button',
      position: { x: 45, y: 650 },
      size: { width: 200, height: 60 },
      color: '#607D8B',
      isDragging: false
    }
  ]);
  
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    elementId: string | null;
    startPos: Position;
    offset: Position;
  }>({
    isDragging: false,
    elementId: null,
    startPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });

  const [showGrid, setShowGrid] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [showPokerTable, setShowPokerTable] = useState(true);
  const [selectedElement, setSelectedElement] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse event handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const startPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const offset = {
      x: startPos.x - (element.position.x * rect.width / 100),
      y: startPos.y - (element.position.y * rect.height / 100)
    };

    setDragState({
      isDragging: true,
      elementId,
      startPos,
      offset
    });

    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, isDragging: true } : el
    ));

    setSelectedElement(elementId);
  }, [elements]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.elementId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const newPosition = {
      x: Math.max(0, Math.min(100, ((currentPos.x - dragState.offset.x) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((currentPos.y - dragState.offset.y) / rect.height) * 100))
    };

    setElements(prev => prev.map(el => 
      el.id === dragState.elementId ? { ...el, position: newPosition } : el
    ));
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setElements(prev => prev.map(el => ({ ...el, isDragging: false })));
      setDragState({
        isDragging: false,
        elementId: null,
        startPos: { x: 0, y: 0 },
        offset: { x: 0, y: 0 }
      });
    }
  }, [dragState.isDragging]);

  // Update settings when elements are moved
  const updateSettingsFromElements = useCallback(() => {
    const tableCenter = elements.find(el => el.id === 'table-center');
    const opponent = elements.find(el => el.id === 'opponent-player');
    const current = elements.find(el => el.id === 'current-player');
    const board = elements.find(el => el.id === 'board-container');
    const betting = elements.find(el => el.id === 'betting-panel');
    const header = elements.find(el => el.id === 'header-controls');
    const newHand = elements.find(el => el.id === 'new-hand-button');

    if (tableCenter && opponent && current && board && betting && header && newHand) {
      setSettings({
        tableCenterWidth: tableCenter.size.width,
        tableCenterHeight: tableCenter.size.height,
        tableCenterTop: tableCenter.position.y,
        tableCenterLeft: tableCenter.position.x,
        
        opponentPlayerTop: opponent.position.y - tableCenter.position.y,
        opponentPlayerLeft: opponent.position.x,
        currentPlayerBottom: tableCenter.position.y + tableCenter.size.height - current.position.y,
        currentPlayerLeft: current.position.x,
        
        boardContainerTop: board.position.y,
        boardContainerLeft: board.position.x,
        boardContainerWidth: board.size.width,
        
        bettingPanelTop: betting.position.y,
        bettingPanelLeft: betting.position.x,
        bettingPanelWidth: betting.size.width,
        bettingPanelHeight: betting.size.height,
        
        headerControlsTop: header.position.y,
        headerControlsRight: 100 - header.position.x - (header.size.width / 10),
        
        newHandButtonBottom: 100 - newHand.position.y - (newHand.size.height / 10),
        newHandButtonLeft: newHand.position.x,
        
        themeControlsTop: 20,
        themeControlsRight: 20,
      });
    }
  }, [elements]);

  // Export current layout
  const exportLayout = () => {
    updateSettingsFromElements();
    const layoutData = {
      settings,
      elements: elements.map(el => ({
        id: el.id,
        name: el.name,
        position: el.position,
        size: el.size
      }))
    };
    
    const blob = new Blob([JSON.stringify(layoutData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poker-layout-v2.8.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate CSS from current positions
  const generateCSS = () => {
    updateSettingsFromElements();
    
    const css = `
/* Generated Poker Table Layout CSS v2.8 */

.poker-felt {
  width: ${settings.tableCenterWidth}%;
  height: ${settings.tableCenterHeight}px;
  position: relative;
  margin: ${settings.tableCenterTop}px auto;
}

.opponent-in-center {
  position: absolute;
  top: ${settings.opponentPlayerTop}px;
  left: 50%;
  transform: translateX(-50%);
}

.current-player-in-center {
  position: absolute;
  bottom: ${settings.currentPlayerBottom}px;
  left: 50%;
  transform: translateX(-50%);
}

.board-and-pot-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${settings.boardContainerWidth}px;
}

.betting-action-panel-in-table {
  position: absolute;
  bottom: ${settings.bettingPanelTop}px;
  left: 50%;
  transform: translateX(-50%);
  width: ${settings.bettingPanelWidth}px;
  max-width: 90%;
}

.table-header-controls {
  position: absolute;
  top: ${settings.headerControlsTop}px;
  right: ${settings.headerControlsRight}px;
}

.new-hand-panel {
  position: absolute;
  bottom: ${settings.newHandButtonBottom}px;
  left: 50%;
  transform: translateX(-50%);
}
`;

    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poker-layout-v2.8.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset to default positions
  const resetLayout = () => {
    setElements([
      {
        id: 'table-center',
        name: 'Poker Felt',
        position: { x: 9, y: 20 },
        size: { width: 82, height: 530 },
        color: '#0d4f3c',
        isDragging: false
      },
      {
        id: 'opponent-player',
        name: 'Opponent Player',
        position: { x: 45, y: 80 },
        size: { width: 200, height: 120 },
        color: '#4CAF50',
        isDragging: false
      },
      {
        id: 'board-container',
        name: 'Board & Pot',
        position: { x: 35, y: 250 },
        size: { width: 400, height: 120 },
        color: '#2196F3',
        isDragging: false
      },
      {
        id: 'current-player',
        name: 'Current Player',
        position: { x: 45, y: 380 },
        size: { width: 200, height: 120 },
        color: '#FF9800',
        isDragging: false
      },
      {
        id: 'betting-panel',
        name: 'Betting Panel',
        position: { x: 25, y: 520 },
        size: { width: 700, height: 100 },
        color: '#9C27B0',
        isDragging: false
      },
      {
        id: 'header-controls',
        name: 'Header Controls',
        position: { x: 75, y: 40 },
        size: { width: 200, height: 50 },
        color: '#F44336',
        isDragging: false
      },
      {
        id: 'new-hand-button',
        name: 'New Hand Button',
        position: { x: 45, y: 650 },
        size: { width: 200, height: 60 },
        color: '#607D8B',
        isDragging: false
      }
    ]);
    setSettings(defaultSettings);
  };

  return (
    <div className="layout-debugger">
      {/* Control Panel */}
      <div className="control-panel">
        <div className="control-header">
          <h2>🔧 Layout Debugger v2.8 - Interactive</h2>
          <div className="control-buttons">
            <button onClick={() => setShowGrid(!showGrid)}>
              {showGrid ? '🔲' : '⬜'} Grid
            </button>
            <button onClick={() => setShowMeasurements(!showMeasurements)}>
              📏 Measurements
            </button>
            <button onClick={() => setShowPokerTable(!showPokerTable)}>
              🎯 Poker Table
            </button>
            <button onClick={exportLayout}>💾 Export Layout</button>
            <button onClick={generateCSS}>📄 Generate CSS</button>
            <button onClick={resetLayout}>🔄 Reset</button>
          </div>
        </div>

        {/* Element Info */}
        {selectedElement && (
          <div className="element-info">
            <h3>Selected: {elements.find(el => el.id === selectedElement)?.name}</h3>
            <div className="position-info">
              <span>X: {elements.find(el => el.id === selectedElement)?.position.x.toFixed(1)}%</span>
              <span>Y: {elements.find(el => el.id === selectedElement)?.position.y.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Layout Area */}
      <div 
        className={`layout-container ${showPokerTable ? 'with-poker-bg' : ''}`}
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid Overlay */}
        {showGrid && (
          <div className="grid-overlay">
            {Array.from({ length: 21 }, (_, i) => (
              <div key={`v-${i}`} className="grid-line vertical" style={{ left: `${i * 5}%` }} />
            ))}
            {Array.from({ length: 21 }, (_, i) => (
              <div key={`h-${i}`} className="grid-line horizontal" style={{ top: `${i * 5}%` }} />
            ))}
          </div>
        )}

        {/* Poker Table Background */}
        {showPokerTable && (
          <div className="poker-table-bg">
            <div className="felt-texture"></div>
          </div>
        )}

        {/* Draggable Elements */}
        {elements.map((element) => (
          <div
            key={element.id}
            className={`draggable-element ${element.isDragging ? 'dragging' : ''} ${selectedElement === element.id ? 'selected' : ''}`}
            style={{
              left: `${element.position.x}%`,
              top: `${element.position.y}%`,
              width: element.id === 'table-center' ? `${element.size.width}%` : `${element.size.width}px`,
              height: `${element.size.height}px`,
              backgroundColor: element.color + (element.id === 'table-center' ? '40' : '80'),
              border: `2px solid ${element.color}`,
              cursor: element.isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            onClick={() => setSelectedElement(element.id)}
          >
            <div className="element-label">
              {element.name}
            </div>
            
            {showMeasurements && (
              <div className="element-measurements">
                <span>X: {element.position.x.toFixed(1)}%</span>
                <span>Y: {element.position.y.toFixed(1)}%</span>
              </div>
            )}

            {/* Special content for poker felt */}
            {element.id === 'table-center' && showPokerTable && (
              <div className="felt-content">
                <div className="felt-border"></div>
                <div className="felt-center-line"></div>
              </div>
            )}
          </div>
        ))}

        {/* Coordinate Display */}
        <div className="coordinate-display">
          <div>Layout Debugger v2.8 - Drag elements to reposition</div>
          <div>Current elements: {elements.length}</div>
        </div>
      </div>
    </div>
  );
};

export default LayoutDebugger; 