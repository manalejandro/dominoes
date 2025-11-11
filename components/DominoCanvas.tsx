'use client';

import React, { useRef, useEffect } from 'react';
import { DominoTile } from '@/lib/types';

interface DominoCanvasProps {
  tile: DominoTile;
  width?: number;
  height?: number;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  className?: string;
}

export function DominoCanvas({
  tile,
  width = 60,
  height = 30,
  isSelected = false,
  isPlayable = true,
  onClick,
  className = '',
}: DominoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw tile background
    ctx.fillStyle = isSelected ? '#3b82f6' : '#ffffff';
    ctx.strokeStyle = isPlayable ? '#1f2937' : '#9ca3af';
    ctx.lineWidth = 2;
    
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw center divider
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw dots
    const dotRadius = 2.5;
    const drawDots = (value: number, x: number, y: number, size: number) => {
      ctx.fillStyle = isSelected ? '#ffffff' : '#1f2937';
      
      const positions = getDotPositions(value, size);
      positions.forEach(pos => {
        ctx.beginPath();
        ctx.arc(x + pos.x, y + pos.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const leftX = width / 4;
    const rightX = (width * 3) / 4;
    const centerY = height / 2;
    const dotAreaSize = width / 2 - 6;

    drawDots(tile.left, leftX, centerY, dotAreaSize);
    drawDots(tile.right, rightX, centerY, dotAreaSize);

  }, [tile, width, height, isSelected, isPlayable]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`${className} ${onClick && isPlayable ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${!isPlayable ? 'opacity-50' : ''}`}
      onClick={isPlayable ? onClick : undefined}
    />
  );
}

// Get dot positions for a domino value (0-6)
function getDotPositions(value: number, size: number): { x: number; y: number }[] {
  const margin = size * 0.2;
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
