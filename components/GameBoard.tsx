'use client';

import React, { useRef, useEffect, useState } from 'react';
import { PlacedTile, Position } from '@/lib/types';

interface GameBoardProps {
  placedTiles: PlacedTile[];
  width?: number;
  height?: number;
  className?: string;
}

export function GameBoard({ placedTiles, width = 1200, height = 700, className = '' }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width, height });

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const isMobile = window.innerWidth < 640;
        const newWidth = isMobile ? containerWidth - 32 : Math.min(width, containerWidth);
        const newHeight = isMobile ? 400 : height;
        setCanvasSize({ width: newWidth, height: newHeight });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [width, height]);

  // Auto-center the board on first tile
  useEffect(() => {
    if (placedTiles.length === 1 && offset.x === 0 && offset.y === 0) {
      setOffset({ x: width / 2 - 400, y: height / 2 - 300 });
    }
  }, [placedTiles.length, width, height, offset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background pattern
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid pattern
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw placed tiles
    placedTiles.forEach((placedTile, index) => {
      const { tile, position, orientation } = placedTile;
      const tileWidth = orientation === 'horizontal' ? 60 : 30;
      const tileHeight = orientation === 'horizontal' ? 30 : 60;

      const x = position.x + offset.x;
      const y = position.y + offset.y;

      // Draw tile background with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;

      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + tileWidth - radius, y);
      ctx.quadraticCurveTo(x + tileWidth, y, x + tileWidth, y + radius);
      ctx.lineTo(x + tileWidth, y + tileHeight - radius);
      ctx.quadraticCurveTo(x + tileWidth, y + tileHeight, x + tileWidth - radius, y + tileHeight);
      ctx.lineTo(x + radius, y + tileHeight);
      ctx.quadraticCurveTo(x, y + tileHeight, x, y + tileHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Reset shadow
      ctx.shadowColor = 'transparent';

      // Draw center divider
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (orientation === 'horizontal') {
        ctx.moveTo(x + tileWidth / 2, y);
        ctx.lineTo(x + tileWidth / 2, y + tileHeight);
      } else {
        ctx.moveTo(x, y + tileHeight / 2);
        ctx.lineTo(x + tileWidth, y + tileHeight / 2);
      }
      ctx.stroke();

      // Draw dots
      const dotRadius = 2.5;
      ctx.fillStyle = '#1f2937';

      const drawDots = (value: number, dotX: number, dotY: number, size: number) => {
        const positions = getDotPositions(value, size);
        positions.forEach(pos => {
          ctx.beginPath();
          ctx.arc(dotX + pos.x, dotY + pos.y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        });
      };

      if (orientation === 'horizontal') {
        const leftX = x + tileWidth / 4;
        const rightX = x + (tileWidth * 3) / 4;
        const centerY = y + tileHeight / 2;
        const dotAreaSize = tileWidth / 2 - 6;

        drawDots(tile.left, leftX, centerY, dotAreaSize);
        drawDots(tile.right, rightX, centerY, dotAreaSize);
      } else {
        const topY = y + tileHeight / 4;
        const bottomY = y + (tileHeight * 3) / 4;
        const centerX = x + tileWidth / 2;
        const dotAreaSize = tileHeight / 2 - 6;

        drawDots(tile.left, centerX, topY, dotAreaSize);
        drawDots(tile.right, centerX, bottomY, dotAreaSize);
      }

      // Draw tile number for debugging (optional)
      if (placedTiles.length < 20) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`#${index + 1}`, x + tileWidth / 2, y - 5);
      }
    });

  }, [placedTiles, offset, width, height]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div ref={containerRef} className={className} role="region" aria-label="Game board">
      <div className="w-full overflow-x-auto">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className={`border border-gray-300 rounded-lg mx-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="img"
        aria-label={`Domino board with ${placedTiles.length} tiles placed`}
        />
      </div>
      {placedTiles.length > 0 && (
        <div className="mt-2 text-center text-xs sm:text-sm text-gray-600">
          Drag to pan • {placedTiles.length} tiles placed
        </div>
      )}
    </div>
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
