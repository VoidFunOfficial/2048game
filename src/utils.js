export const createGrid = (size) => {
  return Array.from({ length: size }, () => Array(size).fill(0));
};

export const getEmptyCells = (grid) => {
  const cells = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 0) {
        cells.push({ r, c });
      }
    }
  }
  return cells;
};

export const addRandomTile = (grid) => {
  const emptyCells = getEmptyCells(grid);
  if (emptyCells.length === 0) return grid;
  const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
};

export const evaluateMerge = (a, b, expression) => {
  try {
    // Remove whitespace to check for simple addition
    if (!expression || expression.trim() === 'A+B') return a + b;
    
    // Use new Function to evaluate
    // Safety check: expression should probably only contain math-ish stuff?
    // But user can input JS. We rely on browser sandbox.
    const func = new Function('A', 'B', `return ${expression}`);
    const result = func(a, b);
    return isNaN(result) ? a + b : result;
  } catch (e) {
    console.error("Error evaluating expression", e);
    return a + b;
  }
};

const rotate = (matrix) => {
  return matrix[0].map((val, index) => matrix.map(row => row[index]).reverse());
};

const rotateTimes = (matrix, times) => {
  let newMatrix = matrix;
  for (let i = 0; i < times; i++) {
    newMatrix = rotate(newMatrix);
  }
  return newMatrix;
};

export const moveGrid = (grid, direction, mergeExpression) => {
  // direction: 0: Up, 1: Right, 2: Down, 3: Left
  
  // Rotations needed to make the direction "Left"
  // Up (0) -> needs 270 deg rotation (3 times 90) -> Left
  // Right (1) -> needs 180 deg rotation (2 times 90) -> Left
  // Down (2) -> needs 90 deg rotation (1 time 90) -> Left
  // Left (3) -> needs 0 rotation
  
  const rotations = {
    0: 3,
    1: 2,
    2: 1,
    3: 0
  };
  
  const rTimes = rotations[direction];
  
  let tempGrid = rotateTimes(grid, rTimes);
  let score = 0;
  let moved = false;
  
  const newGrid = tempGrid.map(row => {
    let line = row.filter(x => x !== 0);
    let newLine = [];
    
    for (let i = 0; i < line.length; i++) {
      if (i < line.length - 1 && line[i] === line[i + 1]) {
        const mergedVal = evaluateMerge(line[i], line[i+1], mergeExpression);
        newLine.push(mergedVal);
        score += mergedVal;
        i++; // Skip next
      } else {
        newLine.push(line[i]);
      }
    }
    
    // Fill remaining with 0
    while (newLine.length < row.length) {
      newLine.push(0);
    }
    
    // Check if row changed
    if (newLine.length !== row.length || !newLine.every((v, k) => v === row[k])) {
      // Wait, comparing with original row (which includes zeros)
      // 'line' was filtered.
      // Comparison must be against original row in tempGrid
    }
    return newLine;
  });

  // Check for changes
  for(let r=0; r<tempGrid.length; r++){
      for(let c=0; c<tempGrid[r].length; c++){
          if(tempGrid[r][c] !== newGrid[r][c]) {
              moved = true;
              break;
          }
      }
  }
  
  // Restore rotation
  // Total 4 rotations is 360.
  // We did rTimes. We need (4 - rTimes) % 4.
  const restoreTimes = (4 - rTimes) % 4;
  const finalGrid = rotateTimes(newGrid, restoreTimes);
  
  return { grid: finalGrid, score, moved };
};

export const checkGameOver = (grid, mergeExpression) => {
  // Check if any empty cells
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 0) return false;
    }
  }
  
  // Check if any merges possible
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const current = grid[r][c];
      // Check right
      if (c < grid[r].length - 1 && grid[r][c+1] === current) return false;
      // Check down
      if (r < grid.length - 1 && grid[r+1][c] === current) return false;
    }
  }
  
  return true;
};
