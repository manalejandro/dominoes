# Dominoes Game - Technical Documentation

## Architecture Overview

This is a full-stack, real-time multiplayer dominoes game built with modern web technologies.

### Key Technologies

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **State Management**: Zustand
- **Real-time Communication**: Socket.IO
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Graphics**: HTML5 Canvas API

## Game Features

### 1. Multiplayer Mode
- Real-time synchronization using WebSockets
- Support for 2-4 players per room
- Room-based game sessions with unique 6-character codes
- Automatic reconnection handling
- Player ready system before game starts

### 2. AI Mode
- Offline single-player against AI
- Three difficulty levels implemented (easy, medium, hard)
- Strategic tile selection algorithm
- Simulated thinking delays for realistic gameplay

### 3. Game Mechanics
- Traditional domino rules (0-6 tiles, 28 total)
- 7 tiles per player at start
- Boneyard for drawing additional tiles
- Turn-based gameplay with validation
- Win conditions: first to empty hand or lowest score when blocked
- Pass turn functionality when no valid moves

### 4. Visual Design
- Canvas-based domino tile rendering
- Draggable board for navigation
- Animated tile placement and removal
- Gradient backgrounds and modern UI
- Responsive layout for all screen sizes
- Visual feedback for playable tiles

## Project Structure

```
domino/
├── app/
│   ├── api/socket/
│   │   └── route.ts          # Socket.IO API endpoint (legacy)
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Main game page (client component)
│
├── components/
│   ├── DominoCanvas.tsx          # Individual tile rendering with Canvas
│   ├── GameBoard.tsx             # Game board with pan/zoom
│   ├── PlayerHand.tsx            # Player's tile hand display
│   ├── Lobby.tsx                 # Game lobby/menu screen
│   ├── WaitingRoom.tsx           # Pre-game waiting area
│   └── GameOver.tsx              # End game modal
│
├── lib/
│   ├── types.ts                  # TypeScript type definitions
│   ├── gameLogic.ts              # Core game rules and mechanics
│   ├── aiLogic.ts                # AI opponent implementation
│   ├── store.ts                  # Zustand state management
│   └── socket-server.ts          # Socket.IO server logic (legacy)
│
├── server.mjs                    # Custom Next.js server with Socket.IO
└── public/                       # Static assets
```

## State Management

### Zustand Store (`lib/store.ts`)

The application uses a single Zustand store that manages:

- **Socket connection**: WebSocket client instance
- **Game state**: Current game data (players, board, tiles, etc.)
- **Player data**: Current player ID, selected tile
- **Room information**: Room ID, connection status
- **Error handling**: Error messages and notifications

### Key Actions

```typescript
// Connection
initSocket()              // Initialize Socket.IO connection
createRoom()              // Create new game room
joinRoom(id, name)        // Join existing room
leaveRoom()               // Leave current room

// Gameplay
makeMove(move)            // Place a tile
drawTile()                // Draw from boneyard
selectTile(tile)          // Select tile from hand
setPlayerReady()          // Mark player as ready

// AI
startAIGame(name)         // Start offline AI game
executeAITurn()           // Process AI move
```

## Socket.IO Events

### Client → Server

- `create-room`: Request new room creation
- `join-room`: Join room with ID and player name
- `player-ready`: Mark player as ready to start
- `make-move`: Submit a game move
- `draw-tile`: Request tile from boneyard
- `leave-room`: Leave current room

### Server → Client

- `room-created`: Room successfully created (returns room ID)
- `room-joined`: Successfully joined room (returns game state)
- `game-started`: Game has begun
- `game-state-updated`: Game state changed
- `player-joined`: New player joined
- `player-left`: Player disconnected
- `invalid-move`: Move was rejected
- `error`: General error message

## Game Logic

### Tile Generation
- Full domino set: 28 tiles (0-0 through 6-6)
- Each tile has left and right values
- Doubles marked for special rendering

### Move Validation
1. Check if tile matches board end values
2. Verify it's the player's turn
3. Ensure player owns the tile
4. Validate placement side (left/right)

### Win Conditions
1. **Primary**: Player uses all tiles
2. **Blocked**: Game ends when no one can move
   - Winner is player with lowest total pip count

### AI Strategy (Hard Mode)
- Evaluates tile values (higher = better early game)
- Considers board end options
- Blocks opponents by playing uncommon values
- Prioritizes doubles near end game
- Defensive play: discards high-value tiles first

## Canvas Rendering

### DominoCanvas Component
- Draws individual tiles with rounded corners
- Renders dots in traditional domino patterns
- Supports selection highlighting
- Hover effects for playable tiles
- Responsive sizing

### GameBoard Component
- Renders all placed tiles
- Pan/drag functionality for navigation
- Grid background for visual reference
- Automatic centering on first tile
- Dynamic positioning calculation

## Performance Optimizations

1. **Canvas Memoization**: Tiles re-render only when state changes
2. **Socket Batching**: State updates batched to reduce network traffic
3. **Lazy Loading**: Components loaded only when needed
4. **Optimized Re-renders**: React.memo and useCallback where appropriate
5. **Turbopack**: Fast bundling and HMR in development

## Deployment

### Development
```bash
npm run dev
```
Opens at http://localhost:3000 with Socket.IO server integrated

**Note:** The project uses a custom Next.js server (`server.mjs`) that integrates Socket.IO directly. This is required for WebSocket functionality.

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, update URLs to your domain.

### Vercel Deployment
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

Socket.IO works automatically with Vercel's serverless functions.

## Future Enhancements

Potential features to add:

- [ ] Tournament mode with multiple rounds
- [ ] Player statistics and leaderboards
- [ ] Chat functionality
- [ ] Custom tile themes/skins
- [ ] Sound effects and music
- [ ] Spectator mode
- [ ] Replay game history
- [ ] Mobile app version
- [ ] Game speed settings
- [ ] Multiple domino variants (Cuban, Mexican, etc.)

## Troubleshooting

### Socket Connection Issues
- Ensure port 3000 is not blocked
- Check CORS settings for production
- Verify WebSocket support on hosting platform

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version (18+ required)

### TypeScript Errors
- Run type check: `npx tsc --noEmit`
- Ensure all dependencies have type definitions

## License

MIT License - Free for personal and commercial use.

## Credits

Created with ❤️ using:
- Next.js by Vercel
- Socket.IO
- Zustand by Poimandres
- Framer Motion
- Tailwind CSS
