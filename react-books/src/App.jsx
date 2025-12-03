import React from 'react';
import BookScene from './components/BookScene';
import Overlay from './components/Overlay';
import './index.css';

function App() {
  return (
    <div className="App">
      <div className="header">
        {/* Header content if any, original had a header div but empty or just padding */}
      </div>
      <BookScene />
      <Overlay />
    </div>
  );
}

export default App;
