'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LobbyProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  onStartAI: (playerName: string) => void;
  roomId: string | null;
}

export function Lobby({ onCreateRoom, onJoinRoom, onStartAI, roomId }: LobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'ai'>('menu');

  const handleCreate = () => {
    if (!playerName.trim()) return;
    onCreateRoom(playerName);
  };

  const handleJoin = () => {
    if (!playerName.trim() || !joinRoomId.trim()) return;
    onJoinRoom(joinRoomId.toUpperCase(), playerName);
  };

  const handleAI = () => {
    if (!playerName.trim()) return;
    onStartAI(playerName);
  };

  if (mode === 'menu') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4" role="main">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
        >
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Dominoes
          </motion.h1>
          <p className="text-center text-gray-600 mb-8">Online Multiplayer Game</p>

          <div className="space-y-4 mb-6">
            <label htmlFor="player-name" className="sr-only">Your name</label>
            <input
              id="player-name"
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              maxLength={20}
              aria-label="Enter your player name"
              aria-required="true"
            />
          </div>

          <div className="space-y-3" role="group" aria-label="Game mode selection">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={!playerName.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Create a new multiplayer room"
            >
              Create Room
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('join')}
              disabled={!playerName.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Join an existing multiplayer room"
            >
              Join Room
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAI}
              disabled={!playerName.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Start a game against computer AI"
            >
              Play vs AI
            </motion.button>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Built with Next.js, Canvas & Socket.IO</p>
          </div>
        </motion.div>
      </main>
    );
  }

  if (mode === 'join') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4" role="main">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
        >
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Join Room</h2>

          <div className="space-y-4 mb-6">
            <label htmlFor="room-id" className="sr-only">Room ID</label>
            <input
              id="room-id"
              type="text"
              placeholder="Enter Room ID"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors uppercase"
              maxLength={6}
              aria-label="Enter the 6-character room ID"
              aria-required="true"
            />
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              disabled={!joinRoomId.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Join the room with entered ID"
            >
              Join Game
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('menu')}
              className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              aria-label="Go back to main menu"
            >
              Back
            </motion.button>
          </div>
        </motion.div>
      </main>
    );
  }

  return null;
}
