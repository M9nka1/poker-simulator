import React from 'react';
import { useSearchParams } from 'react-router-dom';
import OpenTableComponent from '../components/OpenTableComponent';

const OpenTablePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const tableId = parseInt(searchParams.get('tableId') || '1');
  const isGuest = searchParams.get('isGuest') === 'true';

  if (!sessionId) {
    return (
      <div className="error-page">
        <h2>❌ Ошибка</h2>
        <p>ID сессии не найден в URL</p>
      </div>
    );
  }

  return (
    <div className="open-table-page">
      <OpenTableComponent 
        sessionId={sessionId}
        tableId={tableId}
        isGuest={isGuest}
      />
    </div>
  );
};

export default OpenTablePage; 