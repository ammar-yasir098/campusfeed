import { io } from 'socket.io-client';
import { getToken, getApiBaseUrl } from './api';

let socket = null;

export const initSocket = () => {
  const token = getToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (socket && socket.connected) {
    return socket;
  }

  const socketUrl = getApiBaseUrl();

  socket = io(socketUrl, {
    auth: { token },
    autoConnect: true,

    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected to server:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
