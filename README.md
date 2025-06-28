# svelte-OnlineTTT

A real-time multiplayer tic-tac-toe game built with SvelteKit and Cloudflare infrastructure. Features instant WebSocket updates, persistent game storage, and global scalability. 
[Play it!](https://svelte-onlinettt.pages.dev/)

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

### 2. Deploy WebSocket Worker (One-time setup)

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

**Note**: The WebSocket worker creates a separate Durable Object instance for each game, enabling real-time updates between players. You only need to deploy this once.

### 3. Test WebSocket Worker

Verify your WebSocket worker is running:

```bash
curl https://svelte-ttt-websocket.YOUR_USERNAME.workers.dev/health

# Should return: "WebSocket service is running"
```

Replace `YOUR_USERNAME` with your actual Cloudflare username.

### 4. Local Development (Recommended)

For local development, use the simple setup:

```bash
npm run dev
# Visit http://localhost:5173
```

**How it works:**

- Frontend runs locally via SvelteKit dev server
- Connects to your deployed WebSocket worker for real-time features
- Uses polling fallback for local development (where WebSocket notifications don't work)
- In preview and production, WebSocket notifications work instantly without polling

### 5. Test the Game

#### Test manually
1. **Create a game** - Enter your name and click "Play"
2. **Join with second player** - Open another browser tab/window, enter different name, click "Play"
3. **Play in real-time** - Moves appear within 2 seconds in local development, instantly in production

#### Run Unit Tests
```bash
npm run test
```

#### Run End-to-End Tests

**First-time setup (one-time only):**
```bash
npx playwright install
```

**Run E2E tests:**
```bash
npm run test:e2e
```

**Watch tests run in browser (recommended)**
```bash
npx playwright test --headed
```

**Run specific test file**
```bash
npx playwright test practical-tests.test.ts --headed
```

The E2E tests will automatically start the development server, run tests against real browser instances, and shut down when complete. Tests include:


### 6. Cloudflare Deployment

There are two ways to do it. The preferred way is to just integrate [github with Cloudflare](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/). Then, any commit to a branch will automatically deploy to preview, and any commit to master, will deploy to production.

Alternatively, manually deploy your main SvelteKit app to Cloudflare Pages with these commands:

```bash
npm run build
npm run deploy
```

Your app will be available at your Cloudflare Pages URL with instant real-time updates.

## How It Works

### Architecture Overview

1. **Game Creation**: Players create/join games via HTTP API calls
2. **Persistent Storage**: Game state and history stored in Cloudflare KV
3. **Real-time Updates**: WebSocket connections to deployed Durable Objects
4. **Local Development**: Polling fallback when WebSocket notifications can't be sent
5. **Production**: Full WebSocket notifications for instant updates

### Local vs Production

**Local Development:**

- Simple `npm run dev` setup
- Connects to deployed WebSocket worker
- Uses polling for game state updates (2-second intervals)
- Perfect for development and testing

**Production:**

- Full Cloudflare Pages + Workers environment
- WebSocket notifications work instantly
- No polling needed
- Optimal performance

## Development Scripts

```bash
# Local development (recommended)
npm run dev                    # SvelteKit dev server + deployed WebSocket worker

# WebSocket worker management
cd websocket-worker
npm run deploy                 # Deploy WebSocket worker (one-time setup)
npm run tail                   # View WebSocket worker logs

# Main app deployment
npm run build                  # Build for production
npm run deploy                 # Deploy to Cloudflare Pages

# Code quality
npm run lint                   # Lint code
npm run format                 # Format code
npm run check                  # Type checking
```

## Configuration

### WebSocket Worker URL

The WebSocket client is configured to use:

- **Deployed worker**: `svelte-ttt-websocket.barrybecker4.workers.dev`

To use your own deployed worker, update `src/lib/websocket/client.ts`:

```typescript
// Replace with your worker URL
const host = 'svelte-ttt-websocket.YOUR_USERNAME.workers.dev';
```

### KV Storage

Update KV namespace IDs in `wrangler.toml` to match your Cloudflare dashboard:

```toml
[env.preview]
kv_namespaces = [
    { binding = "TTT_GAME_KV", id = "YOUR_PREVIEW_KV_ID" }
]

[env.production]
kv_namespaces = [
    { binding = "TTT_GAME_KV", id = "YOUR_PRODUCTION_KV_ID" }
]
```

## Troubleshooting

### Common Issues

**Game not updating in real-time:**

- In local development: This is expected, updates happen every 2 seconds via polling
- In production: Check WebSocket connection in browser dev tools

**WebSocket connection errors:**

- Verify your WebSocket worker is deployed: `curl https://svelte-ttt-websocket.YOUR_USERNAME.workers.dev/health`
- Check browser console for connection logs

**Players can't join:**

- Check that KV storage is working
- Verify game creation API calls are succeeding

### Development vs Production Behavior

| Feature          | Local Development               | Production                     |
| ---------------- | ------------------------------- | ------------------------------ |
| Player joining   | Detected via polling (2s delay) | Instant WebSocket notification |
| Move updates     | Detected via polling (2s delay) | Instant WebSocket notification |
| Setup complexity | Simple (`npm run dev`)          | Automatic via Cloudflare Pages |
| WebSocket worker | Uses deployed version           | Uses deployed version          |

## Features

- ✅ Real-time multiplayer gameplay
- ✅ Automatic matchmaking
- ✅ Game history and statistics
- ✅ Global CDN distribution
- ✅ Mobile-friendly interface
- ✅ Simple local development setup
- ✅ Production-ready WebSocket notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Test in production environment
6. Submit a pull request

## License

MIT License - feel free to use this project as a starting point for your own real-time multiplayer games!
