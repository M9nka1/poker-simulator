import React, { useState, useRef, useEffect, useCallback } from 'react';
import cardsSprite from '../assets/cards-sprite.png';

interface GridLine {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number;
  color: string;
  label: string;
}

const CardSpriteEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(0.5);
  const [gridLines, setGridLines] = useState<GridLine[]>([
    // Вертикальные линии (колонки карт)
    { id: 'v1', type: 'vertical', position: 0, color: '#ff0000', label: 'Левый край' },
    { id: 'v2', type: 'vertical', position: 369, color: '#ff0000', label: 'Колонка 1' },
    { id: 'v3', type: 'vertical', position: 738, color: '#ff0000', label: 'Колонка 2' },
    { id: 'v4', type: 'vertical', position: 1107, color: '#ff0000', label: 'Колонка 3' },
    { id: 'v5', type: 'vertical', position: 1476, color: '#ff0000', label: 'Колонка 4' },
    { id: 'v6', type: 'vertical', position: 1845, color: '#ff0000', label: 'Колонка 5' },
    { id: 'v7', type: 'vertical', position: 2214, color: '#ff0000', label: 'Колонка 6' },
    { id: 'v8', type: 'vertical', position: 2583, color: '#ff0000', label: 'Колонка 7' },
    { id: 'v9', type: 'vertical', position: 2952, color: '#ff0000', label: 'Колонка 8' },
    { id: 'v10', type: 'vertical', position: 3321, color: '#ff0000', label: 'Колонка 9' },
    { id: 'v11', type: 'vertical', position: 3690, color: '#ff0000', label: 'Колонка 10' },
    { id: 'v12', type: 'vertical', position: 4059, color: '#ff0000', label: 'Колонка 11' },
    { id: 'v13', type: 'vertical', position: 4428, color: '#ff0000', label: 'Колонка 12' },
    { id: 'v14', type: 'vertical', position: 4797, color: '#ff0000', label: 'Правый край' },
    
    // Горизонтальные линии (ряды карт)
    { id: 'h1', type: 'horizontal', position: 0, color: '#00ff00', label: 'Верхний край' },
    { id: 'h2', type: 'horizontal', position: 614, color: '#00ff00', label: 'Ряд 1' },
    { id: 'h3', type: 'horizontal', position: 1228, color: '#00ff00', label: 'Ряд 2' },
    { id: 'h4', type: 'horizontal', position: 1842, color: '#00ff00', label: 'Ряд 3' },
    { id: 'h5', type: 'horizontal', position: 2456, color: '#00ff00', label: 'Нижний край' },
  ]);

  const [selectedLine] = useState<string | null>(null);
  const [showCoordinates, setShowCoordinates] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setImageLoaded(true);
    };
    img.src = cardsSprite;
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    // Рисуем изображение
    ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);

    // Рисуем линии сетки
    gridLines.forEach(line => {
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      if (line.type === 'vertical') {
        const x = line.position * scale;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, scaledHeight);
      } else {
        const y = line.position * scale;
        ctx.moveTo(0, y);
        ctx.lineTo(scaledWidth, y);
      }
      ctx.stroke();

      // Подписи координат
      if (showCoordinates) {
        ctx.fillStyle = line.color;
        ctx.font = '12px Arial';
        ctx.fillRect(
          line.type === 'vertical' ? line.position * scale - 20 : 5,
          line.type === 'vertical' ? 5 : line.position * scale - 10,
          40, 20
        );
        ctx.fillStyle = 'white';
        ctx.fillText(
          line.position.toString(),
          line.type === 'vertical' ? line.position * scale - 15 : 8,
          line.type === 'vertical' ? 18 : line.position * scale + 3
        );
      }
    });
  }, [image, scale, gridLines, showCoordinates]);

  useEffect(() => {
    if (imageLoaded && image && canvasRef.current) {
      drawCanvas();
    }
  }, [imageLoaded, image, scale, gridLines, showCoordinates, drawCanvas]);

  const addLine = (type: 'vertical' | 'horizontal') => {
    const newId = `${type[0]}${Date.now()}`;
    const newLine: GridLine = {
      id: newId,
      type,
      position: type === 'vertical' ? 100 : 100,
      color: type === 'vertical' ? '#ff0000' : '#00ff00',
      label: `Новая ${type === 'vertical' ? 'вертикальная' : 'горизонтальная'} линия`
    };
    setGridLines([...gridLines, newLine]);
  };

  const updateLine = (id: string, field: keyof GridLine, value: any) => {
    setGridLines(gridLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const deleteLine = (id: string) => {
    setGridLines(gridLines.filter(line => line.id !== id));
  };

  const exportCoordinates = () => {
    const coordinates = {
      verticalLines: gridLines.filter(l => l.type === 'vertical').map(l => ({ position: l.position, label: l.label })),
      horizontalLines: gridLines.filter(l => l.type === 'horizontal').map(l => ({ position: l.position, label: l.label })),
      imageSize: { width: image?.width || 0, height: image?.height || 0 }
    };
    
    const dataStr = JSON.stringify(coordinates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'card-sprite-coordinates.json';
    link.click();
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a2e', 
      minHeight: '100vh', 
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#16537e', marginBottom: '30px' }}>
        🎴 Редактор разметки Sprite Sheet карт
      </h1>

      {/* Панель управления */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ marginRight: '10px' }}>Масштаб:</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ marginRight: '10px' }}
          />
          <span>{Math.round(scale * 100)}%</span>
        </div>

        <button
          onClick={() => addLine('vertical')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff0000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Вертикальная линия
        </button>

        <button
          onClick={() => addLine('horizontal')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#00ff00',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Горизонтальная линия
        </button>

        <button
          onClick={() => setShowCoordinates(!showCoordinates)}
          style={{
            padding: '8px 16px',
            backgroundColor: showCoordinates ? '#4CAF50' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showCoordinates ? 'Скрыть' : 'Показать'} координаты
        </button>

        <button
          onClick={exportCoordinates}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          💾 Экспорт координат
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Canvas с изображением */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            border: '2px solid #333', 
            borderRadius: '8px', 
            overflow: 'auto',
            maxHeight: '80vh',
            backgroundColor: '#000'
          }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', cursor: 'crosshair' }}
            />
          </div>
          
          {image && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#bbb' }}>
              Размер изображения: {image.width} × {image.height} px
              <br />
              Масштаб: {Math.round(scale * 100)}% ({Math.round(image.width * scale)} × {Math.round(image.height * scale)} px)
            </div>
          )}
        </div>

        {/* Панель координат */}
        <div style={{ 
          width: '400px', 
          backgroundColor: '#2a2a3e', 
          borderRadius: '8px', 
          padding: '20px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <h3 style={{ marginTop: 0, color: '#4CAF50' }}>Координаты линий</h3>
          
          {/* Вертикальные линии */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#ff0000' }}>🔴 Вертикальные линии</h4>
            {gridLines.filter(l => l.type === 'vertical').map(line => (
              <div key={line.id} style={{ 
                marginBottom: '15px', 
                padding: '10px', 
                backgroundColor: selectedLine === line.id ? '#333' : '#1a1a2e',
                borderRadius: '4px',
                border: selectedLine === line.id ? '2px solid #4CAF50' : '1px solid #444'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{line.label}</strong>
                  <button
                    onClick={() => deleteLine(line.id)}
                    style={{
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                    Позиция X:
                  </label>
                  <input
                    type="number"
                    value={line.position}
                    onChange={(e) => updateLine(line.id, 'position', parseInt(e.target.value) || 0)}
                    style={{
                      width: '80px',
                      padding: '4px',
                      backgroundColor: '#333',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '3px'
                    }}
                  />
                </div>
                
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                    Название:
                  </label>
                  <input
                    type="text"
                    value={line.label}
                    onChange={(e) => updateLine(line.id, 'label', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px',
                      backgroundColor: '#333',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Горизонтальные линии */}
          <div>
            <h4 style={{ color: '#00ff00' }}>🟢 Горизонтальные линии</h4>
            {gridLines.filter(l => l.type === 'horizontal').map(line => (
              <div key={line.id} style={{ 
                marginBottom: '15px', 
                padding: '10px', 
                backgroundColor: selectedLine === line.id ? '#333' : '#1a1a2e',
                borderRadius: '4px',
                border: selectedLine === line.id ? '2px solid #4CAF50' : '1px solid #444'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{line.label}</strong>
                  <button
                    onClick={() => deleteLine(line.id)}
                    style={{
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                    Позиция Y:
                  </label>
                  <input
                    type="number"
                    value={line.position}
                    onChange={(e) => updateLine(line.id, 'position', parseInt(e.target.value) || 0)}
                    style={{
                      width: '80px',
                      padding: '4px',
                      backgroundColor: '#333',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '3px'
                    }}
                  />
                </div>
                
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                    Название:
                  </label>
                  <input
                    type="text"
                    value={line.label}
                    onChange={(e) => updateLine(line.id, 'label', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px',
                      backgroundColor: '#333',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Информация о сетке */}
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#1a1a2e', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#FFA726' }}>📊 Статистика сетки</h4>
            <div>Вертикальных линий: {gridLines.filter(l => l.type === 'vertical').length}</div>
            <div>Горизонтальных линий: {gridLines.filter(l => l.type === 'horizontal').length}</div>
            <div>Колонок карт: {Math.max(0, gridLines.filter(l => l.type === 'vertical').length - 1)}</div>
            <div>Рядов карт: {Math.max(0, gridLines.filter(l => l.type === 'horizontal').length - 1)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSpriteEditor; 