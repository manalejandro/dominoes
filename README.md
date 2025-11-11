# Dominoes Online

A modern, real-time multiplayer dominoes game built with Next.js, TypeScript, Canvas, and Socket.IO.

## Features

- 🎮 **Real-time Multiplayer** - Play with friends online using WebSocket connections
- 🤖 **AI Opponent** - Play against an intelligent AI when no other players are available
- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- 🎯 **Canvas Rendering** - Domino tiles rendered using HTML5 Canvas
- 📱 **Responsive** - Works great on desktop and mobile devices
- ⚡ **Fast & Real-time** - Instant updates for all players

## How to Play

1. **Create a Room** - Start a new game and share the room code with friends
2. **Join a Room** - Enter a room code to join an existing game
3. **Play vs AI** - Practice against an AI opponent
4. **Match Tiles** - Place tiles that match the numbers on the board ends
5. **Win** - First player to use all tiles wins!

## Game Rules

- Each player starts with 7 domino tiles
- Players take turns placing tiles that match the numbers on either end of the board
- If you can't play, draw a tile from the boneyard
- The game ends when a player uses all their tiles or when no one can move
- Lowest total value wins if the game is blocked

## Tech Stack

- **Next.js 16** - React framework for production
- **TypeScript** - Type-safe JavaScript
- **Socket.IO** - Real-time bidirectional communication
- **Zustand** - State management
- **Framer Motion** - Smooth animations
- **Tailwind CSS** - Utility-first CSS framework
- **HTML5 Canvas** - Tile rendering

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the custom server with Socket.IO:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

**Note:** This project uses a custom Next.js server (`server.mjs`) to integrate Socket.IO for real-time multiplayer functionality.

## Development

### Project Structure

```
domino/
├── app/                  # Next.js app directory
│   ├── api/socket/      # Socket.IO API route
│   ├── page.tsx         # Main game page
│   └── layout.tsx       # Root layout
├── components/          # React components
│   ├── DominoCanvas.tsx
│   ├── GameBoard.tsx
│   ├── PlayerHand.tsx
│   ├── Lobby.tsx
│   ├── WaitingRoom.tsx
│   └── GameOver.tsx
├── lib/                 # Core game logic
│   ├── types.ts         # TypeScript interfaces
│   ├── gameLogic.ts     # Game mechanics
│   ├── aiLogic.ts       # AI opponent
│   ├── store.ts         # Zustand store
│   └── socket-server.ts # Socket.IO server
└── public/              # Static assets
```

### Available Scripts

- `npm run dev` - Start custom development server with Socket.IO
- `npm run build` - Build for production
- `npm start` - Start production server with Socket.IO
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning or personal use.

---

Enjoy playing dominoes online! 🎲
