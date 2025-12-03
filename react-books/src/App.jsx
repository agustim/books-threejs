import React from 'react';
import BookScene from './components/BookScene';
import Overlay from './components/Overlay';
import './index.css';

function App() {
  return (
    <div className="App">
      <BookScene />
      <Overlay />
    </div>
  );
}

export default App;
