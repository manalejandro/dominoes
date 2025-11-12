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
  const [zoom, setZoom] = useState(1);

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

  // Auto-zoom and auto-center to fit all tiles
  useEffect(() => {
    if (placedTiles.length === 0) return;

    // Calculate bounding box of all tiles
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    placedTiles.forEach(placedTile => {
      const { position, orientation } = placedTile;
      const tileWidth = orientation === 'horizontal' ? 60 : 30;
      const tileHeight = orientation === 'horizontal' ? 30 : 60;
      
      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + tileWidth);
      maxY = Math.max(maxY, position.y + tileHeight);
    });

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate zoom to fit all tiles in viewport
    const isMobile = window.innerWidth < 640;
    const zoomX = canvasSize.width / contentWidth;
    const zoomY = canvasSize.height / contentHeight;
    
    // Set zoom limits: minimum 0.3 for very long games, maximum 1.5 for desktop / 1 for mobile
    const minZoom = isMobile ? 0.3 : 0.25;
    const maxZoom = isMobile ? 1 : 1.5;
    const calculatedZoom = Math.min(zoomX, zoomY);
    const newZoom = Math.max(minZoom, Math.min(calculatedZoom, maxZoom));
    
    // Calculate center position
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Set offset to center the content
    const newOffsetX = canvasSize.width / 2 - centerX * newZoom;
    const newOffsetY = canvasSize.height / 2 - centerY * newZoom;

    setZoom(newZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [placedTiles, canvasSize.width, canvasSize.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw background pattern
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw grid pattern
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvasSize.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvasSize.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    // Draw placed tiles
    placedTiles.forEach((placedTile, index) => {
      const { tile, position, orientation } = placedTile;
      const tileWidth = orientation === 'horizontal' ? 60 : 30;
      const tileHeight = orientation === 'horizontal' ? 30 : 60;

      const x = position.x * zoom + offset.x;
      const y = position.y * zoom + offset.y;
      const scaledWidth = tileWidth * zoom;
      const scaledHeight = tileHeight * zoom;

      // Draw tile background with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 5 * zoom;
      ctx.shadowOffsetX = 2 * zoom;
      ctx.shadowOffsetY = 2 * zoom;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2 * zoom;

      const radius = 4 * zoom;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + scaledWidth - radius, y);
      ctx.quadraticCurveTo(x + scaledWidth, y, x + scaledWidth, y + radius);
      ctx.lineTo(x + scaledWidth, y + scaledHeight - radius);
      ctx.quadraticCurveTo(x + scaledWidth, y + scaledHeight, x + scaledWidth - radius, y + scaledHeight);
      ctx.lineTo(x + radius, y + scaledHeight);
      ctx.quadraticCurveTo(x, y + scaledHeight, x, y + scaledHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Reset shadow
      ctx.shadowColor = 'transparent';

      // Draw center divider
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1 * zoom;
      ctx.beginPath();
      if (orientation === 'horizontal') {
        ctx.moveTo(x + scaledWidth / 2, y);
        ctx.lineTo(x + scaledWidth / 2, y + scaledHeight);
      } else {
        ctx.moveTo(x, y + scaledHeight / 2);
        ctx.lineTo(x + scaledWidth, y + scaledHeight / 2);
      }
      ctx.stroke();

      // Draw dots
      const dotRadius = Math.max(2, 2.5 * zoom);
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
        const leftX = x + scaledWidth / 4;
        const rightX = x + (scaledWidth * 3) / 4;
        const centerY = y + scaledHeight / 2;
        const dotAreaSize = (scaledWidth / 2 - 6 * zoom);

        drawDots(tile.left, leftX, centerY, dotAreaSize);
        drawDots(tile.right, rightX, centerY, dotAreaSize);
      } else {
        const topY = y + scaledHeight / 4;
        const bottomY = y + (scaledHeight * 3) / 4;
        const centerX = x + scaledWidth / 2;
        const dotAreaSize = (scaledHeight / 2 - 6 * zoom);

        drawDots(tile.left, centerX, topY, dotAreaSize);
        drawDots(tile.right, centerX, bottomY, dotAreaSize);
      }
    });

  }, [placedTiles, offset, zoom, canvasSize.width, canvasSize.height]);

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
