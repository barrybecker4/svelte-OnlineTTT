# svelte-OnlineTTT

A real-time multiplayer tic-tac-toe game built with SvelteKit and Cloudflare infrastructure. Features instant WebSocket updates, persistent game storage, and global scalability.

## Architecture

- **Frontend**: SvelteKit app deployed on Cloudflare Pages
- **Real-time**: WebSocket Durable Objects for instant game updates
- **Storage**: Cloudflare KV for persistent game data and history
- **Deployment**: Cloudflare Workers + Pages

## Prerequisites

- Node.js 18+
- Cloudflare account (free tier works)
- Basic familiarity with git and command line

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/barrybecker4/svelte-OnlineTTT
cd svelte-OnlineTTT
npm install
```

### 2. Deploy WebSocket Worker (Durable Objects)

The WebSocket worker handles real-time game coordination using Cloudflare Durable Objects:

```bash
# Navigate to websocket worker directory
cd websocket-worker

# Install dependencies
npm install

# Deploy the WebSocket worker to Cloudflare
npm run deploy

# Return to main directory
cd ..
```

**Note**: The WebSocket worker creates a separate Durable Object instance for each game, enabling real-time updates between players. Each game gets its own isolated state management.

### 3. Configure Frontend WebSocket Connection

Update your WebSocket client to connect to the deployed worker:

1. **Find your worker URL:**
   ```bash
   cd websocket-worker
   wrangler whoami
   ```
   Your worker URL will be: `https://svelte-ttt-websocket.YOUR_USERNAME.workers.dev`

2. **Update `src/lib/websocket/client.ts`:**
   Replace `YOUR_USERNAME` in the `getWebSocketUrl()` method with your actual Cloudflare username:
   ```typescript
   private getWebSocketUrl(gameId?: string): string {
     // ... existing code ...
     host = 'svelte-ttt-websocket.YOUR_ACTUAL_USERNAME.workers.dev';
     // ... rest of method
   }
   ```

### 4. Test WebSocket Worker

Verify your WebSocket worker is running:

```bash
curl https://svelte-ttt-websocket.YOUR_USERNAME.workers.dev/health
curl https://svelte-ttt-websocket.barrybecker4.workers.dev/health  (for example)

# Should return: "WebSocket service is running"
```

### 5. Local Development

For local development, you have two options:

#### Option A: Simple (Recommended)
Run SvelteKit locally and connect to deployed WebSocket worker:

```bash
npm run dev
# Visit http://localhost:5173
```

The app will connect to your deployed WebSocket worker for real-time features.

#### Option B: Full Local Setup
Run both the main app and WebSocket worker locally:

```bash
# Terminal 1: Start WebSocket worker locally
cd websocket-worker
npm run dev

# Terminal 2: Start main app with Wrangler
npm run dev:wrangler

# Terminal 3: Start SvelteKit dev server  
npm run dev
```

### 6. Production Deployment

Deploy your main SvelteKit app to Cloudflare Pages:

```bash
npm run build
npm run deploy
```

Your app will be available at your Cloudflare Pages URL.

## How It Works

### Architecture Overview

1. **Game Creation**: Players create/join games via HTTP API calls to Cloudflare Pages
2. **Persistent Storage**: Game state, history, and player data stored in Cloudflare KV
3. **Real-time Updates**: Each game connects to its own Durable Object for instant WebSocket updates
4. **Global Scale**: Cloudflare automatically distributes your app worldwide

### Key Components

- **Durable Objects**: One per active game, handles WebSocket connections and real-time coordination
- **KV Storage**: Permanent game data, player history, matchmaking
- **SvelteKit App**: Game UI, HTTP APIs, game logic
- **WebSocket Client**: Handles real-time communication with fallback to polling

### Why Both KV and Durable Objects?

- **KV**: Permanent database for game records, history, open games list
- **Durable Objects**: Temporary real-time coordinator for active games
- **Together**: Instant gameplay + permanent data storage

## Development Scripts

```bash
# Local development
npm run dev                    # SvelteKit dev server
npm run dev:wrangler          # Full Cloudflare Pages simulation

# WebSocket worker (in websocket-worker/)
npm run dev                    # Local WebSocket worker
npm run deploy                 # Deploy WebSocket worker
npm run tail                   # View WebSocket worker logs

# Main app
npm run build                  # Build for production
npm run deploy                 # Deploy to Cloudflare Pages
npm run preview               # Preview production build locally

# Code quality
npm run lint                   # Lint code
npm run format                 # Format code
npm run check                  # Type checking
```

## Testing

1. **Create a game** - Enter your name and click "Play"
2. **Join with second player** - Open another browser/tab, enter different name
3. **Play in real-time** - Moves should appear instantly on both screens
4. **Check game history** - Previous games are saved and displayed

## Troubleshooting

### WebSocket Connection Issues

1. **Check worker deployment:**
   ```bash
   curl https://svelte-ttt-websocket.YOUR_USERNAME.workers.dev/health
   ```

2. **Check browser console** for WebSocket connection logs

3. **Verify gameId** is being passed in WebSocket URL

### Local Development Issues

1. **Update worker URL** in `src/lib/websocket/client.ts` with your actual username
2. **Check KV namespace IDs** in `wrangler.toml` match your Cloudflare dashboard
3. **Verify Cloudflare authentication** with `wrangler whoami`

### Common Fixes

- **Game not updating**: Check WebSocket connection in browser dev tools
- **Players can't join**: Verify KV storage is working
- **Connection errors**: Confirm worker URL is correct in frontend code

## Features

- ✅ Real-time multiplayer gameplay
- ✅ Automatic matchmaking
- ✅ Game history and statistics
- ✅ Global CDN distribution
- ✅ Mobile-friendly interface
- ✅ Graceful fallback to polling if WebSocket unavailable

## Technology Stack

- **Frontend**: SvelteKit, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers, Durable Objects, KV Storage
- **Real-time**: WebSocket Hibernation API
- **Deployment**: Cloudflare Pages + Workers
- **Development**: Vite, Wrangler CLI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally and in production
5. Submit a pull request

## License

MIT License - feel free to use this project as a starting point for your own real-time multiplayer games!