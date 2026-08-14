const { Server } = require('socket.io');
const { isOriginAllowed } = require('./config/cors');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Join room for a specific blood request to receive live matching updates
    socket.on('join:request', (requestId) => {
      if (requestId) {
        socket.join(`request_${requestId}`);
      }
    });

    socket.on('leave:request', (requestId) => {
      if (requestId) {
        socket.leave(`request_${requestId}`);
      }
    });

    // Join room for a specific user to receive personal notifications
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    socket.on('leave:user', (userId) => {
      if (userId) {
        socket.leave(`user_${userId}`);
      }
    });
  });

  return io;
}

function getIo() {
  return io;
}

/** Emit updated matches for a request to all clients in that request room */
function emitMatchesUpdated(requestId, matches) {
  if (io && requestId) {
    io.to(`request_${requestId}`).emit('blood:matches:updated', {
      requestId,
      matches,
      timestamp: new Date().toISOString(),
    });
  }
}

/** Emit updated blood request status/fulfillment */
function emitRequestUpdated(requestId, requestData) {
  if (io && requestId) {
    io.to(`request_${requestId}`).emit('blood:request:updated', {
      requestId,
      request: requestData,
      timestamp: new Date().toISOString(),
    });
  }
}

/** Emit personal notification to a user */
function emitUserNotification(userId, notification) {
  if (io && userId) {
    io.to(`user_${userId}`).emit('notification:new', notification);
  }
}

module.exports = {
  initSocket,
  getIo,
  emitMatchesUpdated,
  emitRequestUpdated,
  emitUserNotification,
};
