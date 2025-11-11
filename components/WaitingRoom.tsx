'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/lib/types';

interface WaitingRoomProps {
  roomId: string;
  players: Player[];
  currentPlayerId: string | null;
  onReady: () => void;
  onLeave: () => void;
}

export function WaitingRoom({ roomId, players, currentPlayerId, onReady, onLeave }: WaitingRoomProps) {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isReady = currentPlayer?.isReady || false;
  const canStart = players.length >= 2 && players.every(p => p.isReady);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Waiting Room</h2>
          <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full font-mono text-xl">
            {roomId}
          </div>
          <p className="text-gray-600 mt-2 text-sm">Share this code with your friends</p>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Players ({players.length}/4)
          </h3>
          {players.length < 2 && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm text-center">
              ⚠️ Minimum 2 players required to start
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((player) => (
              <motion.div
                key={player.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`p-4 rounded-lg border-2 ${
                  player.isReady
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      player.isReady ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{player.name}</div>
                      {player.id === currentPlayerId && (
                        <div className="text-xs text-blue-600 font-medium">You</div>
                      )}
                    </div>
                  </div>
                  {player.isReady && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-500 text-2xl"
                    >
                      ✓
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 4 - players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
              >
                <div className="text-gray-400 text-center">
                  <div className="text-3xl mb-1">+</div>
                  <div className="text-sm">Optional player...</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {!isReady ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReady}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Ready to Play
            </motion.button>
          ) : (
            <div className="w-full bg-green-100 border-2 border-green-500 text-green-700 py-3 rounded-lg font-semibold text-center">
              {canStart ? 'Starting game...' : players.length < 2 ? 'Waiting for at least 1 more player...' : 'Waiting for other players...'}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLeave}
            className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
          >
            Leave Room
          </motion.button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Game Rules</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 2-4 players can play (minimum 2 required)</li>
            <li>• Match numbers on tiles to place them on the board</li>
            <li>• Draw from the boneyard if you can&apos;t play</li>
            <li>• First player to use all tiles wins!</li>
            <li>• Game ends when someone runs out or no one can move</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
