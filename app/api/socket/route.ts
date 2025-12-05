import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { GameState, Player, GameMove } from '@/lib/types';
import { dealTiles, findStartingPlayer, executeMove, canPlayerMove, isGameBlocked, determineBlockedWinner } from '@/lib/gameLogic';

// Store active game rooms
const gameRooms = new Map<string, GameState>();
const playerRooms = new Map<string, string>();

// Generate unique room ID
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new game state
function createGameState(roomId: string): GameState {
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

// Initialize game when all players are ready
function startGame(roomId: string): GameState {
  const gameState = gameRooms.get(roomId);
  if (!gameState) throw new Error('Game not found');

  const { playerTiles, boneyard } = dealTiles(gameState.players.length);
  
  const updatedPlayers = gameState.players.map((player, index) => ({
    ...player,
    tiles: playerTiles[index],
    score: 0,
  }));

  const startingPlayerIndex = findStartingPlayer(updatedPlayers);

  const newGameState: GameState = {
    ...gameState,
    players: updatedPlayers,
    currentPlayerIndex: startingPlayerIndex,
    boneyard,
    gameMode: 'playing',
  };

  gameRooms.set(roomId, newGameState);
  return newGameState;
}

export async function GET(req: NextRequest) {
  // @ts-expect-error - NextRequest extended with socket server
  const res = req.res || req.nextUrl;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(res as any).socket?.server?.io) {
    console.log('Initializing Socket.IO server...');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const httpServer: HTTPServer = (res as any).socket.server;
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
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

      socket.on('join-room', (roomId: string, playerName: string) => {
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

        const player: Player = {
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

      socket.on('player-ready', (roomId: string) => {
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

      socket.on('make-move', (roomId: string, move: GameMove) => {
        const gameState = gameRooms.get(roomId);
        if (!gameState) return;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        
        if (currentPlayer.id !== socket.id) {
          socket.emit('invalid-move', 'Not your turn');
          return;
        }

        try {
          const newGameState = executeMove(gameState, move);
          
          if (isGameBlocked(newGameState)) {
            const winnerId = determineBlockedWinner(newGameState);
            newGameState.winner = winnerId;
            newGameState.isGameOver = true;
            newGameState.gameMode = 'finished';
          }

          gameRooms.set(roomId, newGameState);
          io.to(roomId).emit('game-state-updated', newGameState);
        } catch {
          socket.emit('invalid-move', 'Invalid move');
        }
      });

      socket.on('draw-tile', (roomId: string) => {
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

        const drawnTile = gameState.boneyard.pop()!;
        currentPlayer.tiles.push(drawnTile);

        if (!canPlayerMove(currentPlayer, gameState.boardEnds)) {
          gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        }

        gameRooms.set(roomId, gameState);
        io.to(roomId).emit('game-state-updated', gameState);
      });

      socket.on('disconnect', () => {
        const roomId = playerRooms.get(socket.id);
        if (roomId) {
          const gameState = gameRooms.get(roomId);
          if (gameState) {
            gameState.players = gameState.players.filter(p => p.id !== socket.id);
            playerRooms.delete(socket.id);

            if (gameState.players.length === 0) {
              gameRooms.delete(roomId);
            } else {
              gameRooms.set(roomId, gameState);
              io.to(roomId).emit('player-left', socket.id);
              io.to(roomId).emit('game-state-updated', gameState);
            }
          }
        }
        console.log('Client disconnected:', socket.id);
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).socket.server.io = io;
  }

  return new Response('Socket.IO server initialized', { status: 200 });
}
