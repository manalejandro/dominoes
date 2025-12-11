// Domino game types and interfaces

export type DominoTile = {
  id: string;
  left: number;
  right: number;
  isDouble: boolean;
};

export type Position = {
  x: number;
  y: number;
};

export type Orientation = 'horizontal' | 'vertical';

export type PlacedTile = {
  tile: DominoTile;
  position: Position;
  orientation: Orientation;
  rotation: number;
};

export type Player = {
  id: string;
  name: string;
  tiles: DominoTile[];
  score: number;
  isAI: boolean;
  isReady: boolean;
};

export type BoardEnd = {
  value: number;
  position: Position;
  side: 'left' | 'right' | 'top' | 'bottom';
};

export type GameState = {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  board: PlacedTile[];
  boneyard: DominoTile[];
  boardEnds: BoardEnd[];
  winner: string | null;
  isGameOver: boolean;
  turnsPassed: number;
  gameMode: 'waiting' | 'playing' | 'finished';
  rematchRequests: string[]; // Player IDs who requested rematch
};

export type GameMove = {
  playerId: string;
  tile: DominoTile;
  side: 'left' | 'right';
  pass?: boolean;
};

export type SocketEvents = {
  // Client to Server
  'create-room': () => void;
  'join-room': (roomId: string, playerName: string) => void;
  'player-ready': (roomId: string) => void;
  'make-move': (roomId: string, move: GameMove) => void;
  'draw-tile': (roomId: string) => void;
  'leave-room': (roomId: string) => void;
  'request-rematch': (roomId: string) => void;
  
  // Server to Client
  'room-created': (roomId: string) => void;
  'room-joined': (gameState: GameState, playerId: string) => void;
  'game-state-updated': (gameState: GameState) => void;
  'game-started': (gameState: GameState) => void;
  'invalid-move': (message: string) => void;
  'player-joined': (player: Player) => void;
  'player-left': (playerId: string) => void;
  'error': (message: string) => void;
  'rematch-requested': (playerId: string) => void;
  'rematch-started': (gameState: GameState) => void;
};
