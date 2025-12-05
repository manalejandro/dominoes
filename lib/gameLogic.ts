import { DominoTile, GameState, Player, PlacedTile, BoardEnd, Position, GameMove } from './types';

// Generate a complete domino set (0-0 to 6-6)
export function generateDominoSet(): DominoTile[] {
  const tiles: DominoTile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      tiles.push({
        id: `${i}-${j}`,
        left: i,
        right: j,
        isDouble: i === j,
      });
    }
  }
  return tiles;
}

// Shuffle array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal tiles to players
export function dealTiles(numPlayers: number): { playerTiles: DominoTile[][], boneyard: DominoTile[] } {
  const allTiles = shuffleArray(generateDominoSet());
  const tilesPerPlayer = 7;
  const playerTiles: DominoTile[][] = [];

  for (let i = 0; i < numPlayers; i++) {
    playerTiles.push(allTiles.splice(0, tilesPerPlayer));
  }

  return {
    playerTiles,
    boneyard: allTiles,
  };
}

// Find the player with the highest double
export function findStartingPlayer(players: Player[]): number {
  let highestDouble = -1;
  let startingPlayerIndex = 0;

  players.forEach((player, index) => {
    player.tiles.forEach(tile => {
      if (tile.isDouble && tile.left > highestDouble) {
        highestDouble = tile.left;
        startingPlayerIndex = index;
      }
    });
  });

  return startingPlayerIndex;
}

// Check if a tile can be placed at a specific board end
export function canPlaceTile(tile: DominoTile, endValue: number): boolean {
  return tile.left === endValue || tile.right === endValue;
}

// Check if a player can make any move
export function canPlayerMove(player: Player, boardEnds: BoardEnd[]): boolean {
  if (boardEnds.length === 0) return true;
  
  return player.tiles.some(tile => 
    boardEnds.some(end => canPlaceTile(tile, end.value))
  );
}

// Get valid moves for a player
export function getValidMoves(player: Player, boardEnds: BoardEnd[]): { tile: DominoTile; side: 'left' | 'right' }[] {
  if (boardEnds.length === 0) {
    return player.tiles.map(tile => ({ tile, side: 'left' as const }));
  }

  const validMoves: { tile: DominoTile; side: 'left' | 'right' }[] = [];
  const addedTiles = new Set<string>();

  player.tiles.forEach(tile => {
    boardEnds.forEach(end => {
      if (canPlaceTile(tile, end.value)) {
        const moveKey = `${tile.id}-${end.side}`;
        if (!addedTiles.has(moveKey)) {
          validMoves.push({ tile, side: end.side === 'left' ? 'left' : 'right' });
          addedTiles.add(moveKey);
        }
      }
    });
  });

  return validMoves;
}

// Get playable tiles for a player (returns just tile IDs)
export function getPlayableTiles(player: Player, boardEnds: BoardEnd[]): string[] {
  if (boardEnds.length === 0) {
    return player.tiles.map(t => t.id);
  }

  const playableTileIds = new Set<string>();

  player.tiles.forEach(tile => {
    boardEnds.forEach(end => {
      if (canPlaceTile(tile, end.value)) {
        playableTileIds.add(tile.id);
      }
    });
  });

  return Array.from(playableTileIds);
}

// Check if a specific move is valid
export function isValidMove(tile: DominoTile, side: 'left' | 'right', boardEnds: BoardEnd[]): boolean {
  if (boardEnds.length === 0) return true;
  
  const targetEnd = boardEnds.find(end => 
    (side === 'left' && end.side === 'left') || 
    (side === 'right' && end.side === 'right')
  );
  
  if (!targetEnd) return false;
  
  return canPlaceTile(tile, targetEnd.value);
}

// Calculate tile position on board
export function calculateTilePosition(
  board: PlacedTile[],
  side: 'left' | 'right',
  tileWidth: number,
  tileHeight: number,
  isDouble: boolean
): { position: Position; orientation: 'horizontal' | 'vertical'; rotation: number } {
  const spacing = 5;

  if (board.length === 0) {
    return {
      position: { x: 400, y: 300 },
      orientation: 'horizontal',
      rotation: 0,
    };
  }

  const lastTile = side === 'right' ? board[board.length - 1] : board[0];
  let position: Position;
  let orientation: 'horizontal' | 'vertical' = 'horizontal';
  const rotation = 0;

  if (side === 'right') {
    const offset = lastTile.orientation === 'horizontal' ? tileWidth : tileHeight;
    position = {
      x: lastTile.position.x + offset + spacing,
      y: lastTile.position.y,
    };
    orientation = isDouble ? 'vertical' : 'horizontal';
  } else {
    const offset = lastTile.orientation === 'horizontal' ? tileWidth : tileHeight;
    position = {
      x: lastTile.position.x - offset - spacing,
      y: lastTile.position.y,
    };
    orientation = isDouble ? 'vertical' : 'horizontal';
  }

  return { position, orientation, rotation };
}

// Update board ends after placing a tile
export function updateBoardEnds(
  board: PlacedTile[],
  newTile: PlacedTile,
  side: 'left' | 'right',
  matchedValue: number
): BoardEnd[] {
  if (board.length === 0) {
    return [
      { value: newTile.tile.left, position: newTile.position, side: 'left' },
      { value: newTile.tile.right, position: newTile.position, side: 'right' },
    ];
  }

  const newEnds: BoardEnd[] = [];

  if (side === 'left') {
    const newValue = newTile.tile.left === matchedValue ? newTile.tile.right : newTile.tile.left;
    newEnds.push({ value: newValue, position: newTile.position, side: 'left' });
    
    // Keep the right end
    const rightTile = board[board.length - 1];
    const rightValue = board.length === 1 
      ? (rightTile.tile.left === matchedValue ? rightTile.tile.right : rightTile.tile.left)
      : board[board.length - 1].tile.right;
    newEnds.push({ value: rightValue, position: rightTile.position, side: 'right' });
  } else {
    // Keep the left end
    const leftTile = board[0];
    const leftValue = board.length === 1
      ? (leftTile.tile.left === matchedValue ? leftTile.tile.right : leftTile.tile.left)
      : board[0].tile.left;
    newEnds.push({ value: leftValue, position: leftTile.position, side: 'left' });
    
    const newValue = newTile.tile.left === matchedValue ? newTile.tile.right : newTile.tile.left;
    newEnds.push({ value: newValue, position: newTile.position, side: 'right' });
  }

  return newEnds;
}

// Execute a move
export function executeMove(
  gameState: GameState,
  move: GameMove,
  tileWidth: number = 60,
  tileHeight: number = 30
): GameState {
  const player = gameState.players.find(p => p.id === move.playerId);
  if (!player) return gameState;

  if (move.pass) {
    const newTurnsPassed = gameState.turnsPassed + 1;
    
    // Check if game is blocked (all players have passed consecutively)
    if (newTurnsPassed >= gameState.players.length) {
      // Game is blocked - determine winner by lowest score
      let lowestScore = Infinity;
      let winnerId = '';
      
      gameState.players.forEach(p => {
        const score = calculateScore(p.tiles);
        if (score < lowestScore) {
          lowestScore = score;
          winnerId = p.id;
        }
      });
      
      return {
        ...gameState,
        currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
        turnsPassed: newTurnsPassed,
        isGameOver: true,
        winner: winnerId,
        gameMode: 'finished',
      };
    }
    
    return {
      ...gameState,
      currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
      turnsPassed: newTurnsPassed,
    };
  }

  const tileIndex = player.tiles.findIndex(t => t.id === move.tile.id);
  if (tileIndex === -1) return gameState;

  // Remove tile from player's hand
  const newTiles = [...player.tiles];
  newTiles.splice(tileIndex, 1);

  // Determine if we need to flip the tile
  let tileToPlace = { ...move.tile };
  
  if (gameState.board.length > 0) {
    const targetEnd = gameState.boardEnds.find(end => end.side === move.side);
    const matchValue = targetEnd?.value || 0;
    
    // When placing on the RIGHT side:
    //   - The LEFT value of the new tile should match the board end
    //   - If tile.right matches, we need to flip it
    // When placing on the LEFT side:
    //   - The RIGHT value of the new tile should match the board end
    //   - If tile.left matches, we need to flip it
    
    let needsFlip = false;
    if (move.side === 'right') {
      // On right side, left value of tile should match
      if (move.tile.right === matchValue && move.tile.left !== matchValue) {
        needsFlip = true;
      }
    } else {
      // On left side, right value of tile should match
      if (move.tile.left === matchValue && move.tile.right !== matchValue) {
        needsFlip = true;
      }
    }
    
    // Flip the tile if needed
    if (needsFlip) {
      tileToPlace = {
        ...move.tile,
        left: move.tile.right,
        right: move.tile.left,
      };
    }
  }

  // Calculate position and place tile
  const { position, orientation, rotation } = calculateTilePosition(
    gameState.board,
    move.side,
    tileWidth,
    tileHeight,
    tileToPlace.isDouble
  );

  const placedTile: PlacedTile = {
    tile: tileToPlace,
    position,
    orientation,
    rotation,
  };

  const newBoard = move.side === 'right' 
    ? [...gameState.board, placedTile]
    : [placedTile, ...gameState.board];

  // Update board ends - after placing, it's straightforward:
  // Left end is the left value of the leftmost tile
  // Right end is the right value of the rightmost tile
  let newBoardEnds: BoardEnd[];
  
  if (newBoard.length === 1) {
    newBoardEnds = [
      { value: tileToPlace.left, position: placedTile.position, side: 'left' },
      { value: tileToPlace.right, position: placedTile.position, side: 'right' },
    ];
  } else {
    const leftTile = newBoard[0];
    const rightTile = newBoard[newBoard.length - 1];
    
    newBoardEnds = [
      { value: leftTile.tile.left, position: leftTile.position, side: 'left' },
      { value: rightTile.tile.right, position: rightTile.position, side: 'right' },
    ];
  }

  const updatedPlayers = gameState.players.map(p =>
    p.id === player.id ? { ...p, tiles: newTiles } : p
  );

  const isGameOver = newTiles.length === 0;
  const winner = isGameOver ? player.id : null;

  return {
    ...gameState,
    players: updatedPlayers,
    board: newBoard,
    boardEnds: newBoardEnds,
    currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
    isGameOver,
    winner,
    turnsPassed: 0,
    gameMode: isGameOver ? 'finished' : 'playing',
  };
}

// Calculate score for a player
export function calculateScore(tiles: DominoTile[]): number {
  return tiles.reduce((sum, tile) => sum + tile.left + tile.right, 0);
}

// Check if game is blocked (no one can move)
export function isGameBlocked(gameState: GameState): boolean {
  if (gameState.boneyard.length > 0) return false;
  
  return gameState.players.every(player => !canPlayerMove(player, gameState.boardEnds));
}

// Determine winner when game is blocked
export function determineBlockedWinner(gameState: GameState): string {
  let lowestScore = Infinity;
  let winnerId = '';

  gameState.players.forEach(player => {
    const score = calculateScore(player.tiles);
    if (score < lowestScore) {
      lowestScore = score;
      winnerId = player.id;
    }
  });

  return winnerId;
}
