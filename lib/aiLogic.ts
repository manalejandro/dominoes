import { Player, GameState, GameMove, DominoTile, BoardEnd } from './types';
import { getValidMoves, canPlaceTile } from './gameLogic';

// AI difficulty levels
export type AIDifficulty = 'easy' | 'medium' | 'hard';

// Evaluate tile value for strategic play
function evaluateTileValue(tile: DominoTile, boardEnds: BoardEnd[]): number {
  let value = 0;

  // Prefer higher value tiles early in the game
  value += tile.left + tile.right;

  // Doubles are slightly more valuable
  if (tile.isDouble) {
    value += 2;
  }

  // Tiles that match both ends are very valuable
  const matchesLeft = boardEnds.some(end => end.side === 'left' && canPlaceTile(tile, end.value));
  const matchesRight = boardEnds.some(end => end.side === 'right' && canPlaceTile(tile, end.value));
  
  if (matchesLeft && matchesRight) {
    value += 10;
  }

  return value;
}

// Count remaining tiles with specific values
function countRemainingTiles(value: number, allPlayerTiles: DominoTile[][]): number {
  let count = 0;
  allPlayerTiles.forEach(tiles => {
    tiles.forEach(tile => {
      if (tile.left === value || tile.right === value) {
        count++;
      }
    });
  });
  return count;
}

// Choose the best move for AI based on difficulty
export function chooseAIMove(
  gameState: GameState,
  aiPlayer: Player,
  difficulty: AIDifficulty = 'medium'
): GameMove | null {
  const validMoves = getValidMoves(aiPlayer, gameState.boardEnds);

  if (validMoves.length === 0) {
    // Try to draw from boneyard if possible
    if (gameState.boneyard.length > 0) {
      return null; // Will trigger draw action
    }
    // Pass if can't move and no tiles to draw
    return {
      playerId: aiPlayer.id,
      tile: aiPlayer.tiles[0], // Dummy tile
      side: 'left',
      pass: true,
    };
  }

  // Easy: Random move
  if (difficulty === 'easy') {
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return {
      playerId: aiPlayer.id,
      tile: randomMove.tile,
      side: randomMove.side,
    };
  }

  // Medium: Prefer higher value tiles
  if (difficulty === 'medium') {
    let bestMove = validMoves[0];
    let bestValue = evaluateTileValue(bestMove.tile, gameState.boardEnds);

    validMoves.forEach(move => {
      const value = evaluateTileValue(move.tile, gameState.boardEnds);
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    });

    return {
      playerId: aiPlayer.id,
      tile: bestMove.tile,
      side: bestMove.side,
    };
  }

  // Hard: Strategic play
  // Consider opponent's possible tiles and blocking strategies
  let bestMove = validMoves[0];
  let bestScore = -Infinity;

  validMoves.forEach(move => {
    let score = evaluateTileValue(move.tile, gameState.boardEnds);

    // Prefer moves that limit opponent's options
    const resultingValue = move.tile.left === gameState.boardEnds.find(e => e.side === move.side)?.value
      ? move.tile.right
      : move.tile.left;

    // Check how common this value is among remaining tiles
    const allTiles = gameState.players.map(p => p.tiles);
    const commonality = countRemainingTiles(resultingValue, allTiles);
    
    // Prefer less common values to block opponents
    score -= commonality * 3;

    // Try to get rid of high-value tiles first (defensive play)
    const tileValue = move.tile.left + move.tile.right;
    score += tileValue * 0.5;

    // Prefer doubles near the end of the game
    if (move.tile.isDouble && aiPlayer.tiles.length <= 3) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  });

  return {
    playerId: aiPlayer.id,
    tile: bestMove.tile,
    side: bestMove.side,
  };
}

// Simulate AI thinking delay
export async function aiThinkingDelay(difficulty: AIDifficulty): Promise<void> {
  const delays = {
    easy: 500,
    medium: 1000,
    hard: 1500,
  };
  
  const delay = delays[difficulty] + Math.random() * 500;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Check if AI should draw a tile
export function shouldAIDraw(gameState: GameState, aiPlayer: Player): boolean {
  const validMoves = getValidMoves(aiPlayer, gameState.boardEnds);
  return validMoves.length === 0 && gameState.boneyard.length > 0;
}
