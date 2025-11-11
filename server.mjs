import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active game rooms
const gameRooms = new Map();
const playerRooms = new Map();

// Generate unique room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new game state
function createGameState(roomId) {
  return {
    id: roomId,
    players: [],
    currentPlayerIndex: 0,
    board: [],
    boneyard: [],
    boardEnds: [],
    winner: null,
    isGameOver: false,
    turnsPassed: 0,
    gameMode: 'waiting',
  };
}

// Generate domino set
function generateDominoSet() {
  const tiles = [];
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

// Shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal tiles
function dealTiles(numPlayers) {
  const allTiles = shuffleArray(generateDominoSet());
  const tilesPerPlayer = 7;
  const playerTiles = [];

  for (let i = 0; i < numPlayers; i++) {
    playerTiles.push(allTiles.splice(0, tilesPerPlayer));
  }

  return {
    playerTiles,
    boneyard: allTiles,
  };
}

// Find starting player
function findStartingPlayer(players) {
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

// Start game
function startGame(roomId) {
  const gameState = gameRooms.get(roomId);
  if (!gameState) throw new Error('Game not found');

  const { playerTiles, boneyard } = dealTiles(gameState.players.length);
  
  const updatedPlayers = gameState.players.map((player, index) => ({
    ...player,
    tiles: playerTiles[index],
    score: 0,
  }));

  const startingPlayerIndex = findStartingPlayer(updatedPlayers);

  const newGameState = {
    ...gameState,
    players: updatedPlayers,
    currentPlayerIndex: startingPlayerIndex,
    boneyard,
    gameMode: 'playing',
  };

  gameRooms.set(roomId, newGameState);
  return newGameState;
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('create-room', () => {
      const roomId = generateRoomId();
      const gameState = createGameState(roomId);
      gameRooms.set(roomId, gameState);
      
      socket.join(roomId);
      socket.emit('room-created', roomId);
      console.log('Room created:', roomId);
    });

    socket.on('join-room', (roomId, playerName) => {
      const gameState = gameRooms.get(roomId);
      
      if (!gameState) {
        socket.emit('error', 'Room not found');
        return;
      }

      if (gameState.players.length >= 4) {
        socket.emit('error', 'Room is full');
        return;
      }

      if (gameState.gameMode !== 'waiting') {
        socket.emit('error', 'Game already started');
        return;
      }

      const player = {
        id: socket.id,
        name: playerName,
        tiles: [],
        score: 0,
        isAI: false,
        isReady: false,
      };

      gameState.players.push(player);
      playerRooms.set(socket.id, roomId);
      
      socket.join(roomId);
      socket.emit('room-joined', gameState, socket.id);
      socket.to(roomId).emit('player-joined', player);
      
      console.log(`Player ${playerName} joined room ${roomId}`);
    });

    socket.on('player-ready', (roomId) => {
      const gameState = gameRooms.get(roomId);
      if (!gameState) return;

      const player = gameState.players.find(p => p.id === socket.id);
      if (!player) return;

      player.isReady = true;
      gameRooms.set(roomId, gameState);

      const allReady = gameState.players.length >= 2 && gameState.players.every(p => p.isReady);
      
      if (allReady) {
        const startedGame = startGame(roomId);
        io.to(roomId).emit('game-started', startedGame);
        console.log('Game started in room:', roomId);
      } else {
        io.to(roomId).emit('game-state-updated', gameState);
      }
    });

    socket.on('make-move', (roomId, move) => {
      console.log('Received make-move:', { roomId, move, socketId: socket.id });
      
      const gameState = gameRooms.get(roomId);
      if (!gameState) {
        console.log('Game state not found for room:', roomId);
        socket.emit('error', 'Game not found');
        return;
      }

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      
      if (currentPlayer.id !== socket.id) {
        console.log('Not player turn:', { currentPlayerId: currentPlayer.id, socketId: socket.id });
        socket.emit('invalid-move', 'Not your turn');
        return;
      }

      const player = gameState.players.find(p => p.id === move.playerId);
      if (!player) {
        console.log('Player not found:', move.playerId);
        socket.emit('error', 'Player not found');
        return;
      }

      if (move.pass) {
        console.log('Player passing turn');
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        gameState.turnsPassed++;
      } else {
        const tileIndex = player.tiles.findIndex(t => t.id === move.tile.id);
        if (tileIndex === -1) {
          console.log('Tile not found in player hand:', move.tile.id);
          socket.emit('invalid-move', 'Tile not found');
          return;
        }

        // Validar el movimiento
        if (gameState.boardEnds.length > 0) {
          const targetEnd = gameState.boardEnds.find(end => 
            (move.side === 'left' && end.side === 'left') || 
            (move.side === 'right' && end.side === 'right')
          );
          
          if (!targetEnd) {
            console.log('Invalid side:', move.side);
            socket.emit('invalid-move', 'Invalid side');
            return;
          }
          
          const canPlace = move.tile.left === targetEnd.value || move.tile.right === targetEnd.value;
          if (!canPlace) {
            console.log('Tile does not match:', { tile: move.tile, targetEnd: targetEnd.value });
            socket.emit('invalid-move', 'Tile does not match board end');
            return;
          }
        }

        console.log('Placing tile:', { tile: move.tile, side: move.side });

        // Remover la ficha de la mano del jugador
        player.tiles.splice(tileIndex, 1);
        
        // Calcular posición según el lado del tablero
        let position;
        let tileToPlace = { ...move.tile };
        
        if (gameState.board.length === 0) {
          position = { x: 400, y: 300 };
        } else {
          // Get the current board end value
          const targetEnd = gameState.boardEnds.find(end => end.side === move.side);
          const matchValue = targetEnd?.value || 0;
          
          // Determine if we need to flip the tile
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
            console.log('Flipping tile from', move.tile, 'to', tileToPlace);
          }
          
          if (move.side === 'right') {
            const lastTile = gameState.board[gameState.board.length - 1];
            position = { x: lastTile.position.x + 65, y: lastTile.position.y };
          } else {
            const firstTile = gameState.board[0];
            position = { x: firstTile.position.x - 65, y: firstTile.position.y };
          }
        }

        const placedTile = {
          tile: tileToPlace,
          position,
          orientation: 'horizontal',
          rotation: 0,
        };
        
        // Agregar al tablero
        if (move.side === 'right') {
          gameState.board.push(placedTile);
        } else {
          gameState.board.unshift(placedTile);
        }
        
        // Actualizar los extremos del tablero
        if (gameState.board.length === 1) {
          gameState.boardEnds = [
            { value: tileToPlace.left, position: placedTile.position, side: 'left' },
            { value: tileToPlace.right, position: placedTile.position, side: 'right' },
          ];
        } else {
          // After placing, the new ends are straightforward:
          // Left end is the left value of the leftmost tile
          // Right end is the right value of the rightmost tile
          const leftTile = gameState.board[0];
          const rightTile = gameState.board[gameState.board.length - 1];
          
          gameState.boardEnds = [
            { value: leftTile.tile.left, position: leftTile.position, side: 'left' },
            { value: rightTile.tile.right, position: rightTile.position, side: 'right' },
          ];
        }
        
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        gameState.turnsPassed = 0;
        
        if (player.tiles.length === 0) {
          gameState.winner = player.id;
          gameState.isGameOver = true;
          gameState.gameMode = 'finished';
        }
      }

      console.log('Updating game state and emitting to room:', roomId);
      gameRooms.set(roomId, gameState);
      io.to(roomId).emit('game-state-updated', gameState);
      console.log('Game state updated successfully');
    });

    socket.on('draw-tile', (roomId) => {
      const gameState = gameRooms.get(roomId);
      if (!gameState) return;

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      
      if (currentPlayer.id !== socket.id) {
        socket.emit('invalid-move', 'Not your turn');
        return;
      }

      if (gameState.boneyard.length === 0) {
        socket.emit('invalid-move', 'No tiles left to draw');
        return;
      }

      const drawnTile = gameState.boneyard.pop();
      currentPlayer.tiles.push(drawnTile);

      gameRooms.set(roomId, gameState);
      io.to(roomId).emit('game-state-updated', gameState);
    });

    socket.on('leave-room', (roomId) => {
      console.log('Player leaving room:', { socketId: socket.id, roomId });
      
      const gameState = gameRooms.get(roomId);
      if (!gameState) return;

      // Filter out AI players to count only human players
      const humanPlayers = gameState.players.filter(p => !p.isAI);
      const leavingPlayer = gameState.players.find(p => p.id === socket.id);
      
      if (!leavingPlayer) return;

      // Remove player from game
      gameState.players = gameState.players.filter(p => p.id !== socket.id);
      playerRooms.delete(socket.id);
      socket.leave(roomId);

      if (gameState.players.length === 0) {
        // No players left, delete room
        gameRooms.delete(roomId);
        console.log('Room deleted - no players remaining:', roomId);
      } else {
        // Check if only one human player remains
        const remainingHumanPlayers = gameState.players.filter(p => !p.isAI);
        
        if (gameState.gameMode === 'playing' && remainingHumanPlayers.length === 1 && humanPlayers.length > 1) {
          // Only one human player left, they win by default
          const winner = remainingHumanPlayers[0];
          gameState.isGameOver = true;
          gameState.winner = winner.id;
          gameState.gameMode = 'finished';
          console.log(`Player ${winner.name} wins - only player remaining in room ${roomId}`);
        }
        
        // Adjust currentPlayerIndex if needed
        if (gameState.currentPlayerIndex >= gameState.players.length) {
          gameState.currentPlayerIndex = 0;
        }
        
        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('player-left', socket.id);
        io.to(roomId).emit('game-state-updated', gameState);
        console.log(`Player ${leavingPlayer.name} left room ${roomId}. ${gameState.players.length} players remaining.`);
      }
    });

    socket.on('disconnect', () => {
      const roomId = playerRooms.get(socket.id);
      if (roomId) {
        const gameState = gameRooms.get(roomId);
        if (gameState) {
          // Filter out AI players to count only human players
          const humanPlayers = gameState.players.filter(p => !p.isAI);
          const disconnectedPlayer = gameState.players.find(p => p.id === socket.id);
          
          gameState.players = gameState.players.filter(p => p.id !== socket.id);
          playerRooms.delete(socket.id);

          if (gameState.players.length === 0) {
            gameRooms.delete(roomId);
            console.log('Room deleted:', roomId);
          } else {
            // Check if only one human player remains after disconnect
            const remainingHumanPlayers = gameState.players.filter(p => !p.isAI);
            
            if (gameState.gameMode === 'playing' && remainingHumanPlayers.length === 1 && humanPlayers.length > 1) {
              // Only one human player left, they win by default
              const winner = remainingHumanPlayers[0];
              gameState.isGameOver = true;
              gameState.winner = winner.id;
              gameState.gameMode = 'finished';
              console.log(`Player ${winner.name} wins - only player remaining in room ${roomId}`);
            }
            
            // Adjust currentPlayerIndex if needed
            if (gameState.currentPlayerIndex >= gameState.players.length) {
              gameState.currentPlayerIndex = 0;
            }
            
            gameRooms.set(roomId, gameState);
            io.to(roomId).emit('player-left', socket.id);
            io.to(roomId).emit('game-state-updated', gameState);
          }
        }
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('> Socket.IO server running');
  });
});
