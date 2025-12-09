import React, { useState } from 'react';
import BookScene from './components/BookScene';
import Overlay from './components/Overlay';
import './index.css';

function App() {
  const [selectedBookInfo, setSelectedBookInfo] = useState(null);

  return (
    <div className="App" style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Left side - 3D Scene */}
      <div style={{
        flex: selectedBookInfo ? '0 0 50%' : '1',
        position: 'relative',
        transition: 'flex 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <BookScene onBookSelect={setSelectedBookInfo} />
      </div>

      {/* Right side - Book Info */}
      {selectedBookInfo && (
        <div style={{
          flex: '0 0 50%',
          overflow: 'auto',
          backgroundColor: '#ffffff'
        }}>
          <Overlay bookInfo={selectedBookInfo} onClose={() => setSelectedBookInfo(null)} />
        </div>
      )}
    </div>
  );
}

export default App;
