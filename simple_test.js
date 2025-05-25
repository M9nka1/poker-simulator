console.log('🎮 Простой тест сервера');

// Проверяем доступность модулей
try {
    const http = require('http');
    console.log('✅ HTTP модуль доступен');
} catch (e) {
    console.log('❌ HTTP модуль недоступен:', e.message);
}

// Простой HTTP запрос
const http = require('http');

console.log('📡 Проверяем сервер на localhost:5000...');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/session/test',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`✅ Сервер отвечает! Статус: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('📨 Ответ сервера:', data);
        testCreateSession();
    });
});

req.on('error', (e) => {
    console.log(`❌ Ошибка подключения: ${e.message}`);
    console.log('💡 Убедитесь, что сервер запущен: npm run server');
});

req.end();

// Тест создания сессии
function testCreateSession() {
    console.log('\n🧪 Тестируем создание сессии...');
    
    const postData = JSON.stringify({
        preflopHistory: '',
        boardSettings: {
            flopSettings: { random: true },
            turnSettings: { enabled: true },
            riverSettings: { enabled: true }
        },
        handRanges: {
            player1: ['AA', 'KK'],
            player2: ['AA', 'KK']
        },
        tableCount: 1,
        betSizes: { pot: true }
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/create-session',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        console.log(`📊 Статус создания сессии: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                console.log('✅ Сессия создана!');
                console.log(`📋 Session ID: ${result.sessionId}`);
                console.log(`🎯 Столов: ${result.tables?.length || 0}`);
                
                if (result.sessionId) {
                    testWebSocket(result.sessionId, result.tables[0].id);
                }
            } catch (e) {
                console.log('❌ Ошибка парсинга ответа:', e.message);
                console.log('📨 Сырой ответ:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.log(`❌ Ошибка создания сессии: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

// Тест WebSocket (если доступен)
function testWebSocket(sessionId, tableId) {
    console.log('\n🌐 Тестируем WebSocket...');
    
    try {
        const WebSocket = require('ws');
        
        const ws = new WebSocket('ws://localhost:5000');
        
        ws.on('open', () => {
            console.log('✅ WebSocket подключен');
            
            const message = {
                type: 'join_session',
                sessionId: sessionId,
                tableId: tableId,
                playerId: 1,
                playerName: 'Тестер'
            };
            
            console.log('📤 Отправляем сообщение присоединения...');
            ws.send(JSON.stringify(message));
        });
        
        ws.on('message', (data) => {
            const message = JSON.parse(data);
            console.log(`📨 Получено: ${message.type}`);
            
            if (message.type === 'game_state') {
                console.log('🎉 Получено состояние игры!');
                console.log(`👤 Игрок: ${message.playerId}`);
                console.log(`🎴 Карты: ${message.table.players.find(p => p.id === message.playerId)?.holeCards?.length || 0}`);
                
                ws.close();
                console.log('\n🎉 Все тесты пройдены успешно!');
            }
        });
        
        ws.on('error', (e) => {
            console.log(`❌ WebSocket ошибка: ${e.message}`);
        });
        
        ws.on('close', () => {
            console.log('🔌 WebSocket закрыт');
        });
        
    } catch (e) {
        console.log('❌ WebSocket недоступен:', e.message);
        console.log('💡 Установите: npm install ws');
    }
} 