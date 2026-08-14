import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : (import.meta.env.PROD
      ? 'https://blood-connect-zrs8.onrender.com'
      : 'http://localhost:5000');

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      // connected
    });

    socket.on('disconnect', () => {
      // disconnected
    });
  }
  return socket;
}

export function subscribeToRequest(requestId, onMatchesUpdated, onRequestUpdated) {
  const s = getSocket();
  s.emit('join:request', requestId);

  const handleMatches = (payload) => {
    if (payload?.requestId === requestId && onMatchesUpdated) {
      onMatchesUpdated(payload.matches);
    }
  };

  const handleRequest = (payload) => {
    if (payload?.requestId === requestId && onRequestUpdated) {
      onRequestUpdated(payload.request);
    }
  };

  s.on('blood:matches:updated', handleMatches);
  s.on('blood:request:updated', handleRequest);

  return () => {
    s.emit('leave:request', requestId);
    s.off('blood:matches:updated', handleMatches);
    s.off('blood:request:updated', handleRequest);
  };
}

export function subscribeToUser(userId, onNotification) {
  const s = getSocket();
  if (userId) {
    s.emit('join:user', userId);
  }

  const handleNotification = (notification) => {
    if (onNotification) {
      onNotification(notification);
    }
  };

  s.on('notification:new', handleNotification);

  return () => {
    if (userId) {
      s.emit('leave:user', userId);
    }
    s.off('notification:new', handleNotification);
  };
}
