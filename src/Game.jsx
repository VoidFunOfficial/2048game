import React, { useState, useEffect, useRef } from 'react';
import { createGrid, addRandomTile, moveGrid, checkGameOver } from './utils';
import './Game.css';

const Game = () => {
  const [boardSize, setBoardSize] = useState(4);
  const [customBoardSize, setCustomBoardSize] = useState(4);
  const [mergeExpression, setMergeExpression] = useState('A+B');
  const [customMergeExpression, setCustomMergeExpression] = useState('A+B');
  
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const touchStart = useRef(null);

  // Initialize game
  const initGame = (size = boardSize) => {
    let newGrid = createGrid(size);
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
  };

  // Initial load
  useEffect(() => {
    initGame();
  }, []);

  // Apply settings
  const applySettings = () => {
    let size = parseInt(customBoardSize);
    if (isNaN(size) || size < 2) size = 4;
    if (size > 10) size = 10; // Limit size to prevent browser crash
    setBoardSize(size);
    setMergeExpression(customMergeExpression);
    initGame(size);
    setShowSettings(false);
    // Blur inputs to prevent keyboard triggering moves
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const performMove = (direction) => {
    const { grid: newGrid, score: moveScore, moved } = moveGrid(grid, direction, mergeExpression);
    
    if (moved) {
      const gridWithTile = addRandomTile(newGrid);
      setGrid(gridWithTile);
      setScore(prev => prev + moveScore);
      
      if (checkGameOver(gridWithTile, mergeExpression)) {
        setGameOver(true);
      }
    }
  };

  // Handle key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver || showSettings) return;
      
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      let direction = -1;
      if (e.key === 'ArrowUp') direction = 0;
      else if (e.key === 'ArrowRight') direction = 1;
      else if (e.key === 'ArrowDown') direction = 2;
      else if (e.key === 'ArrowLeft') direction = 3;

      if (direction !== -1) {
        performMove(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [grid, gameOver, showSettings, mergeExpression]);

  // Touch handlers
  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStart.current.x - touchEndX;
    const diffY = touchStart.current.y - touchEndY;
    
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);
    
    if (Math.max(absDiffX, absDiffY) > 30) { // Threshold
      if (absDiffX > absDiffY) {
        if (diffX > 0) performMove(3); // Left
        else performMove(1); // Right
      } else {
        if (diffY > 0) performMove(0); // Up
        else performMove(2); // Down
      }
    }
    
    touchStart.current = null;
  };

  // Dynamic font size based on board size
  const tileFontSize = boardSize > 6 ? '14px' : boardSize > 4 ? '18px' : '24px';

  return (
    <div className="game-container">
      <div className="header">
        <div>
            <h1 className="title">2048</h1>
            <div style={{fontSize: '14px', color: '#776e65'}}>
                Join the numbers to get to <strong>2048!</strong>
            </div>
        </div>
        <div className="scores">
          <div className="score-box">
            <div className="score-label">Score</div>
            <div className="score-value">{score}</div>
          </div>
        </div>
      </div>

      <div className="header">
          <button className="controls-btn" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? 'Close Settings' : 'Settings'}
          </button>
          <button className="controls-btn" onClick={() => initGame(boardSize)}>New Game</button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <h2>Settings</h2>
          <div className="setting-item">
            <label>Board Size (2-10)</label>
            <input 
              type="number" 
              value={customBoardSize} 
              onChange={(e) => setCustomBoardSize(e.target.value)}
              min="2" max="10"
            />
          </div>
          <div className="setting-item">
            <label>Merge Expression (JS)</label>
            <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>
              Variables: A, B. Default: A+B. <br/>
              Examples: <code>A*B</code> (Multiply), <code>A**B</code> (Power), <code>(A+B)*2</code>
            </div>
            <input 
              type="text" 
              value={customMergeExpression} 
              onChange={(e) => setCustomMergeExpression(e.target.value)}
              placeholder="A+B"
            />
          </div>
          <button className="controls-btn" onClick={applySettings}>Apply & Restart</button>
        </div>
      )}

      <div 
        className="board-container"
        style={{
          width: '100%',
          maxWidth: '500px',
          aspectRatio: '1 / 1',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="grid"
          style={{
             gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
             gridTemplateRows: `repeat(${boardSize}, 1fr)`,
             height: '100%'
          }}
        >
          {grid.map((row, r) => 
            row.map((cell, c) => (
              <div key={`${r}-${c}`} className="cell">
                {cell !== 0 && (
                  <div 
                    className={`tile tile-${cell <= 2048 ? cell : 'super'}`}
                    style={{ fontSize: tileFontSize }}
                  >
                    {cell}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {gameOver && (
          <div className="overlay">
            <div className="game-over">Game Over!</div>
            <button className="controls-btn" onClick={() => initGame(boardSize)}>Try Again</button>
          </div>
        )}
      </div>
      
      <div style={{marginTop: '20px', textAlign: 'center', color: '#776e65'}}>
          <p>Mobile supported: Swipe to move.</p>
      </div>
    </div>
  );
};

export default Game;
