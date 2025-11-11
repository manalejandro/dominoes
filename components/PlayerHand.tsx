'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/lib/types';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  selectedTileId: string | null;
  onTileClick: (tileId: string) => void;
  validTileIds: string[];
}

export function PlayerHand({
  player,
  isCurrentPlayer,
  selectedTileId,
  onTileClick,
  validTileIds,
}: PlayerHandProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4" role="region" aria-label="Your tiles">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
            player.isAI ? 'bg-purple-500' : 'bg-blue-500'
          }`}>
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{player.name}</div>
            <div className="text-xs text-gray-500">{player.tiles.length} tiles</div>
          </div>
        </div>
        {isCurrentPlayer && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold"
          >
            Your Turn
          </motion.div>
        )}
      </div>

      {!player.isAI && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {player.tiles.map((tile, index) => {
              const isSelected = tile.id === selectedTileId;
              const isPlayable = validTileIds.includes(tile.id);

              return (
                <motion.div
                  key={tile.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={isPlayable ? { y: -5 } : {}}
                  onClick={() => isPlayable && isCurrentPlayer && onTileClick(tile.id)}
                  className={`relative ${
                    isPlayable && isCurrentPlayer ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                  role="button"
                  tabIndex={isPlayable && isCurrentPlayer ? 0 : -1}
                  aria-label={`Tile ${tile.left}-${tile.right}${isSelected ? ' (selected)' : ''}${!isPlayable ? ' (cannot be played)' : ''}`}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && isPlayable && isCurrentPlayer) {
                      e.preventDefault();
                      onTileClick(tile.id);
                    }
                  }}
                >
                  <DominoTileSVG
                    tile={tile}
                    isSelected={isSelected}
                    isPlayable={isPlayable && isCurrentPlayer}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

interface DominoTileSVGProps {
  tile: { left: number; right: number; id: string };
  isSelected: boolean;
  isPlayable: boolean;
}

function DominoTileSVG({ tile, isSelected, isPlayable }: DominoTileSVGProps) {
  const width = 60;
  const height = 30;

  return (
    <svg
      width={width}
      height={height}
      className={`transition-all ${
        isSelected ? 'ring-4 ring-blue-500 rounded' : ''
      } ${!isPlayable ? 'opacity-50' : ''}`}
      role="img"
      aria-label={`Domino tile: ${tile.left} and ${tile.right}`}
    >
      {/* Background */}
      <rect
        width={width}
        height={height}
        rx={4}
        fill={isSelected ? '#3b82f6' : '#ffffff'}
        stroke={isPlayable ? '#1f2937' : '#9ca3af'}
        strokeWidth={2}
      />

      {/* Center divider */}
      <line
        x1={width / 2}
        y1={0}
        x2={width / 2}
        y2={height}
        stroke="#6b7280"
        strokeWidth={1}
      />

      {/* Left dots */}
      <g transform={`translate(${width / 4}, ${height / 2})`}>
        {renderDots(tile.left, isSelected)}
      </g>

      {/* Right dots */}
      <g transform={`translate(${(width * 3) / 4}, ${height / 2})`}>
        {renderDots(tile.right, isSelected)}
      </g>
    </svg>
  );
}

function renderDots(value: number, isSelected: boolean) {
  const dotRadius = 2.5;
  const margin = 6;
  const fill = isSelected ? '#ffffff' : '#1f2937';

  const positions = getDotPositions(value, margin);

  return positions.map((pos, i) => (
    <circle key={i} cx={pos.x} cy={pos.y} r={dotRadius} fill={fill} />
  ));
}

function getDotPositions(value: number, margin: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];

  switch (value) {
    case 0:
      return [];
    case 1:
      positions.push({ x: 0, y: 0 });
      break;
    case 2:
      positions.push({ x: -margin, y: -margin });
      positions.push({ x: margin, y: margin });
      break;
    case 3:
      positions.push({ x: -margin, y: -margin });
      positions.push({ x: 0, y: 0 });
      positions.push({ x: margin, y: margin });
      break;
    case 4:
      positions.push({ x: -margin, y: -margin });
      positions.push({ x: margin, y: -margin });
      positions.push({ x: -margin, y: margin });
      positions.push({ x: margin, y: margin });
      break;
    case 5:
      positions.push({ x: -margin, y: -margin });
      positions.push({ x: margin, y: -margin });
      positions.push({ x: 0, y: 0 });
      positions.push({ x: -margin, y: margin });
      positions.push({ x: margin, y: margin });
      break;
    case 6:
      positions.push({ x: -margin, y: -margin });
      positions.push({ x: 0, y: -margin });
      positions.push({ x: margin, y: -margin });
      positions.push({ x: -margin, y: margin });
      positions.push({ x: 0, y: margin });
      positions.push({ x: margin, y: margin });
      break;
  }

  return positions;
}
