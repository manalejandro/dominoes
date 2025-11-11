'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Lobby } from '@/components/Lobby';
import { WaitingRoom } from '@/components/WaitingRoom';
import { GameBoard } from '@/components/GameBoard';
import { PlayerHand } from '@/components/PlayerHand';
import { GameOver } from '@/components/GameOver';
import { getValidMoves } from '@/lib/gameLogic';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const {
    gameState,
    currentPlayerId,
    roomId,
    error,
    selectedTile,
    initSocket,
    createRoom,
    joinRoom,
    setPlayerReady,
    makeMove,
    drawTile,
    selectTile,
    leaveRoom,
    startAIGame,
    setError,
  } = useGameStore();

  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  const handleCreateRoom = (playerName: string) => {
    createRoom(playerName);
  };

  const handleJoinRoom = (roomId: string, playerName: string) => {
    joinRoom(roomId, playerName);
  };

  const handleStartAI = (playerName: string) => {
    startAIGame(playerName);
  };

  const handleTileClick = (tileId: string) => {
    const tile = gameState?.players
      .find(p => p.id === currentPlayerId)
      ?.tiles.find(t => t.id === tileId);
    
    if (tile) {
      selectTile(selectedTile?.id === tileId ? null : tile);
    }
  };

  const handlePlaceTile = (side: 'left' | 'right') => {
    if (!selectedTile || !currentPlayerId || !gameState) return;

    // Verificar si el movimiento es válido
    const isValid = validMoves.some(m => 
      m.tile.id === selectedTile.id && 
      (gameState.boardEnds.length === 0 || m.side === side || validMoves.filter(vm => vm.tile.id === selectedTile.id).length > 1)
    );

    if (!isValid && gameState.boardEnds.length > 0) {
      setError(`Cannot place tile ${selectedTile.left}-${selectedTile.right} on the ${side} side. It doesn't match the board end.`);
      return;
    }

    makeMove({
      playerId: currentPlayerId,
      tile: selectedTile,
      side,
    });
  };

  const handlePass = () => {
    if (!currentPlayerId || !gameState) return;

    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
    if (!currentPlayer) return;

    makeMove({
      playerId: currentPlayerId,
      tile: currentPlayer.tiles[0],
      side: 'left',
      pass: true,
    });
  };

  const handlePlayAgain = () => {
    leaveRoom();
  };

  // Show lobby if no game state or game mode is waiting
  if (!gameState || gameState.gameMode === 'waiting') {
    if (roomId && gameState) {
      return (
        <WaitingRoom
          roomId={roomId}
          players={gameState.players}
          currentPlayerId={currentPlayerId}
          onReady={setPlayerReady}
          onLeave={leaveRoom}
        />
      );
    }

    return (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onStartAI={handleStartAI}
        roomId={roomId}
      />
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;
  const validMoves = currentPlayer ? getValidMoves(currentPlayer, gameState.boardEnds) : [];
  const validTileIds = currentPlayer && gameState.boardEnds.length === 0 
    ? currentPlayer.tiles.map(t => t.id)
    : Array.from(new Set(validMoves.map(m => m.tile.id)));
  const canDraw = gameState.boneyard.length > 0 && validMoves.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-white shadow-md" role="banner">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dominoes
            </h1>
            {roomId && (
              <div className="hidden sm:block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-mono">
                {roomId}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRules(!showRules)}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              aria-label="Toggle game rules"
              aria-expanded={showRules}
            >
              Rules
            </button>
            <button
              onClick={leaveRoom}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
              aria-label="Leave current game"
            >
              Leave Game
            </button>
          </div>
        </div>
      </header>

      {/* Error notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowRules(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-title"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="rules-title" className="text-xl font-bold mb-4">How to Play</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Click on a tile to select it</li>
                <li>• Click &quot;Place Left&quot; or &quot;Place Right&quot; to place it</li>
                <li>• Tiles must match the numbers on the board ends</li>
                <li>• Draw a tile if you can&apos;t play</li>
                <li>• First player to use all tiles wins!</li>
                <li>• Game ends when blocked (no one can move)</li>
              </ul>
              <button
                onClick={() => setShowRules(false)}
                className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg"
                aria-label="Close rules dialog"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main game area */}
      <main className="max-w-7xl mx-auto px-4 py-6" role="main">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Left side - Game board and controls */}
          <div className="space-y-4">
            {/* Game info */}
            <div className="bg-white rounded-lg shadow-md p-4" role="status" aria-live="polite" aria-atomic="true">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Current Turn</div>
                  <div className="text-xl font-bold text-gray-800">
                    {gameState.players[gameState.currentPlayerIndex]?.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Boneyard</div>
                  <div className="text-xl font-bold text-gray-800">
                    {gameState.boneyard.length} tiles
                  </div>
                </div>
              </div>
            </div>

            {/* Game board */}
            <GameBoard placedTiles={gameState.board} />

            {/* Controls */}
            {isMyTurn && currentPlayer && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-lg shadow-md p-4"
              >
                {selectedTile && (
                  <div className="mb-3 text-center text-sm text-gray-600">
                    Selected: <span className="font-bold">{selectedTile.left}-{selectedTile.right}</span>
                    {gameState.boardEnds.length > 0 && (
                      <div className="mt-1">
                        Board ends: <span className="font-bold">{gameState.boardEnds[0]?.value}</span> (left) | <span className="font-bold">{gameState.boardEnds[1]?.value}</span> (right)
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap" role="group" aria-label="Game controls">
                  <button
                    onClick={() => handlePlaceTile('left')}
                    disabled={!selectedTile}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
                    aria-label={selectedTile ? `Place tile ${selectedTile.left}-${selectedTile.right} on the left side` : 'Place tile on left side (select a tile first)'}
                  >
                    Place Left
                  </button>
                  <button
                    onClick={() => handlePlaceTile('right')}
                    disabled={!selectedTile}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
                    aria-label={selectedTile ? `Place tile ${selectedTile.left}-${selectedTile.right} on the right side` : 'Place tile on right side (select a tile first)'}
                  >
                    Place Right
                  </button>
                  {canDraw && (
                    <button
                      onClick={drawTile}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
                      aria-label={`Draw a tile from the boneyard (${gameState.boneyard.length} tiles remaining)`}
                    >
                      Draw Tile
                    </button>
                  )}
                  {validMoves.length === 0 && !canDraw && (
                    <button
                      onClick={handlePass}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
                      aria-label="Pass your turn (no valid moves available)"
                    >
                      Pass Turn
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Current player's hand */}
            {currentPlayer && (
              <PlayerHand
                player={currentPlayer}
                isCurrentPlayer={isMyTurn}
                selectedTileId={selectedTile?.id || null}
                onTileClick={handleTileClick}
                validTileIds={validTileIds}
              />
            )}
          </div>

          {/* Right side - Other players */}
          <aside className="space-y-4" role="complementary" aria-label="Other players">
            <h3 className="text-lg font-semibold text-gray-700">Players</h3>
            {gameState.players
              .filter(p => p.id !== currentPlayerId)
              .map(player => (
                <div key={player.id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      player.isAI ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{player.name}</div>
                      <div className="text-xs text-gray-500">
                        {player.tiles.length} tiles
                        {player.isAI && ' (AI)'}
                      </div>
                    </div>
                    {gameState.players[gameState.currentPlayerIndex]?.id === player.id && (
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        Turn
                      </div>
                    )}
                  </div>
                  {/* Show tile backs */}
                  <div className="flex flex-wrap gap-1">
                    {player.tiles.map((_, i) => (
                      <div
                        key={i}
                        className="w-12 h-6 bg-gradient-to-br from-gray-700 to-gray-900 rounded border border-gray-600"
                      />
                    ))}
                  </div>
                </div>
              )}
          </aside>
        </div>
      </main>

      {/* Game over modal */}
      {gameState.isGameOver && (
        <GameOver
          winner={gameState.players.find(p => p.id === gameState.winner) || null}
          players={gameState.players}
          onPlayAgain={handlePlayAgain}
          onLeave={leaveRoom}
        />
      )}
    </div>
  );
}
