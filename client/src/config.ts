// Конфигурация для API
const config = {
  // Определяем базовый URL для API в зависимости от окружения
  apiBaseUrl: (() => {
    // Проверяем, если мы на localhost или файловой системе
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
      return 'http://localhost:5000';
    }
    
    // Для внешнего сервера используем тот же origin
    return window.location.origin;
  })(),
  
  // WebSocket URL
  wsUrl: (() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
      return 'ws://localhost:5000';
    }
    
    // Для внешнего сервера
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  })()
};

export default config; 