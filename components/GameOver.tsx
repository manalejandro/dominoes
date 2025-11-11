'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/lib/types';

interface GameOverProps {
  winner: Player | null;
  players: Player[];
  onPlayAgain: () => void;
  onLeave: () => void;
}

export function GameOver({ winner, players, onPlayAgain, onLeave }: GameOverProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-6xl mb-4"
          >
            {winner ? '🏆' : '🤝'}
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {winner ? 'Game Over!' : 'Game Blocked!'}
          </h2>
          {winner && (
            <p className="text-xl text-gray-600">
              <span className="font-semibold text-blue-600">{winner.name}</span> wins!
            </p>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Final Scores</h3>
          <div className="space-y-2">
            {players
              .sort((a, b) => {
                const scoreA = a.tiles.reduce((sum, t) => sum + t.left + t.right, 0);
                const scoreB = b.tiles.reduce((sum, t) => sum + t.left + t.right, 0);
                return scoreA - scoreB;
              })
              .map((player, index) => {
                const score = player.tiles.reduce((sum, t) => sum + t.left + t.right, 0);
                const isWinner = player.id === winner?.id;

                return (
                  <motion.div
                    key={player.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isWinner ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isWinner && <span className="text-2xl">👑</span>}
                      <div>
                        <div className="font-semibold text-gray-800">{player.name}</div>
                        <div className="text-xs text-gray-500">
                          {player.tiles.length} tiles remaining
                        </div>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${
                      isWinner ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {score}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>

        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPlayAgain}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            Play Again
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLeave}
            className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
          >
            Back to Menu
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
