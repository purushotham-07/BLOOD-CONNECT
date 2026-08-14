const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initSocket } = require('./socket');

const server = http.createServer(app);
initSocket(server);

server.listen(env.port, () => {
  console.log(`BloodConnect backend running -> http://localhost:${env.port} (${env.nodeEnv})`);
  console.log(`Health check      -> http://localhost:${env.port}/api/health`);
  console.log(`Realtime Socket.IO enabled with client -> ${env.clientUrl}`);
});

// Graceful shutdown so the pg pool and socket server can close cleanly.
function shutdown() {
  console.log('\nShutting down...');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);