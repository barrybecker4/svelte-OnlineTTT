// Worker entry point
import { WebSocketHibernationServer } from './lib/server/websocket.ts';

// Export the Durable Object class
export { WebSocketHibernationServer };

// The main SvelteKit app will be handled by the adapter
export { default } from './handler.js';