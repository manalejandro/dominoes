'use client';

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { GameState, Player, GameMove, DominoTile } from '@/lib/types';
import { chooseAIMove, aiThinkingDelay, shouldAIDraw } from '@/lib/aiLogic';
import { dealTiles, findStartingPlayer, executeMove, canPlayerMove } from '@/lib/gameLogic';

interface GameStore {
  socket: Socket | null;
  gameState: GameState | null;
  currentPlayerId: string | null;
  roomId: string | null;
  error: string | null;
  isConnected: boolean;
  selectedTile: DominoTile | null;
  pendingPlayerName: string | null;
  
  // Actions
  initSocket: () => void;
  createRoom: (playerName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  setPlayerReady: () => void;
  makeMove: (move: GameMove) => void;
  drawTile: () => void;
  selectTile: (tile: DominoTile | null) => void;
  leaveRoom: () => void;
  setError: (error: string | null) => void;
  
  // AI actions
  startAIGame: (playerName: string) => void;
  executeAITurn: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  currentPlayerId: null,
  roomId: null,
  error: null,
  isConnected: false,
  selectedTile: null,
  pendingPlayerName: null,

  initSocket: () => {
    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to socket server');
      set({ isConnected: true, socket });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      set({ isConnected: false });
    });

    socket.on('room-created', (roomId: string) => {
      const { pendingPlayerName, socket } = get();
      set({ roomId, error: null });
      
      // Automatically join the room we just created
      if (pendingPlayerName && socket) {
        socket.emit('join-room', roomId, pendingPlayerName);
      }
    });

    socket.on('room-joined', (gameState: GameState, playerId: string) => {
      set({ gameState, currentPlayerId: playerId, error: null, pendingPlayerName: null });
    });

    socket.on('game-state-updated', (gameState: GameState) => {
      set({ gameState });
      
      // Check if it's AI's turn
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer?.isAI && gameState.gameMode === 'playing' && !gameState.isGameOver) {
        setTimeout(() => {
          get().executeAITurn();
        }, 1000);
      }
    });

    socket.on('game-started', (gameState: GameState) => {
      set({ gameState });
      
      // Check if AI starts
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer?.isAI) {
        setTimeout(() => {
          get().executeAITurn();
        }, 1500);
      }
    });

    socket.on('player-joined', (player: Player) => {
      const { gameState } = get();
      if (gameState) {
        set({
          gameState: {
            ...gameState,
            players: [...gameState.players, player],
          },
        });
      }
    });

    socket.on('player-left', (playerId: string) => {
      const { currentPlayerId } = get();
      
      // If we are the player who left (kicked or left from another tab), clear our state
      if (playerId === currentPlayerId) {
        set({ 
          gameState: null, 
          roomId: null, 
          currentPlayerId: null, 
          selectedTile: null,
          pendingPlayerName: null,
          error: null
        });
      }
      // Note: Don't update gameState here - the server will send game-state-updated
      // with the updated state including potential winner if only 1 player remains
    });

    socket.on('invalid-move', (message: string) => {
      set({ error: message });
      setTimeout(() => set({ error: null }), 3000);
    });

    socket.on('error', (message: string) => {
      set({ error: message });
      setTimeout(() => set({ error: null }), 3000);
    });

    set({ socket });
  },

  createRoom: (playerName: string) => {
    const { socket } = get();
    if (socket) {
      set({ pendingPlayerName: playerName });
      socket.emit('create-room');
    }
  },

  joinRoom: (roomId: string, playerName: string) => {
    const { socket } = get();
    if (socket) {
      set({ roomId });
      socket.emit('join-room', roomId, playerName);
    }
  },

  setPlayerReady: () => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('player-ready', roomId);
    }
  },

  makeMove: (move: GameMove) => {
    const { socket, roomId, gameState } = get();
    
    // Modo AI (offline)
    if (roomId?.startsWith('AI-') && gameState) {
      console.log('AI mode: executing move', move);
      const newGameState = executeMove(gameState, move);
      set({ gameState: newGameState, selectedTile: null });
      
      // Si es turno de la IA, ejecutar su movimiento
      const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
      if (currentPlayer?.isAI && !newGameState.isGameOver) {
        setTimeout(() => {
          get().executeAITurn();
        }, 1000);
      }
      return;
    }
    
    // Modo multijugador (online)
    if (socket && roomId) {
      console.log('Online mode: sending move to server', move);
      socket.emit('make-move', roomId, move);
      set({ selectedTile: null });
    }
  },

  drawTile: () => {
    const { socket, roomId, gameState, currentPlayerId } = get();
    
    // AI mode - execute locally
    if (roomId?.startsWith('AI-')) {
      if (!gameState || !currentPlayerId) return;
      
      const player = gameState.players.find(p => p.id === currentPlayerId);
      if (!player) return;
      
      // Check if there are tiles in the boneyard
      if (gameState.boneyard.length === 0) {
        console.log('No tiles in boneyard');
        return;
      }
      
      // Draw a tile from the boneyard
      const drawnTile = gameState.boneyard[0];
      const newBoneyard = gameState.boneyard.slice(1);
      
      // Add to player's hand
      const updatedPlayers = gameState.players.map(p => 
        p.id === currentPlayerId 
          ? { ...p, tiles: [...p.tiles, drawnTile] }
          : p
      );
      
      // Update game state
      set({
        gameState: {
          ...gameState,
          boneyard: newBoneyard,
          players: updatedPlayers,
        }
      });
      
      console.log('Drew tile in AI mode:', drawnTile);
    } 
    // Online mode - send to server
    else if (socket && roomId) {
      socket.emit('draw-tile', roomId);
    }
  },

  selectTile: (tile: DominoTile | null) => {
    set({ selectedTile: tile });
  },

  leaveRoom: () => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('leave-room', roomId);
    }
    // Clear state immediately on client side
    set({ 
      gameState: null, 
      roomId: null, 
      currentPlayerId: null, 
      selectedTile: null,
      pendingPlayerName: null,
      error: null
    });
  },

  setError: (error: string | null) => {
    set({ error });
    if (error) {
      // Auto-clear error after 3 seconds
      setTimeout(() => {
        set({ error: null });
      }, 3000);
    }
  },

  // Start AI game (offline mode)
  startAIGame: (playerName: string) => {
    const roomId = 'AI-' + Math.random().toString(36).substring(2, 8);
    
    const humanPlayer: Player = {
      id: 'human',
      name: playerName,
      tiles: [],
      score: 0,
      isAI: false,
      isReady: true,
    };

    const aiPlayer: Player = {
      id: 'ai',
      name: 'AI Opponent',
      tiles: [],
      score: 0,
      isAI: true,
      isReady: true,
    };

    const { playerTiles, boneyard } = dealTiles(2);
    
    humanPlayer.tiles = playerTiles[0];
    aiPlayer.tiles = playerTiles[1];

    const players = [humanPlayer, aiPlayer];
    const startingPlayerIndex = findStartingPlayer(players);

    const gameState: GameState = {
      id: roomId,
      players,
      currentPlayerIndex: startingPlayerIndex,
      board: [],
      boneyard,
      boardEnds: [],
      winner: null,
      isGameOver: false,
      turnsPassed: 0,
      gameMode: 'playing',
    };

    set({ gameState, currentPlayerId: 'human', roomId });

    // If AI starts, make first move
    if (startingPlayerIndex === 1) {
      setTimeout(() => {
        get().executeAITurn();
      }, 1500);
    }
  },

  // Execute AI turn
  executeAITurn: async () => {
    const { gameState } = get();
    if (!gameState || gameState.isGameOver) return;

    const aiPlayer = gameState.players.find(p => p.isAI);
    if (!aiPlayer) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== aiPlayer.id) return;

    await aiThinkingDelay('medium');

    // Check if AI should draw
    if (shouldAIDraw(gameState, aiPlayer)) {
      if (gameState.boneyard.length > 0) {
        const drawnTile = gameState.boneyard.pop()!;
        aiPlayer.tiles.push(drawnTile);
        
        if (!canPlayerMove(aiPlayer, gameState.boardEnds)) {
          gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
          set({ gameState: { ...gameState } });
          return;
        }
      } else {
        // Pass turn
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        gameState.turnsPassed++;
        set({ gameState: { ...gameState } });
        return;
      }
    }

    const move = chooseAIMove(gameState, aiPlayer, 'medium');
    if (move) {
      const newGameState = executeMove(gameState, move);
      set({ gameState: newGameState });
    }
  },
}));
