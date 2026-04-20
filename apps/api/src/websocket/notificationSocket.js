import logger from '../utils/logger.js';

const connectedUsers = new Map();

function initializeNotificationSocket(io) {
  const nsp = io.of('/notifications');

  nsp.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('subscribe', (data) => {
      const { userId } = data;

      if (!userId) {
        socket.emit('error', { message: 'userId is required' });
        return;
      }

      // Store socket connection for this user
      connectedUsers.set(userId, socket.id);
      socket.join(`user_${userId}`);

      logger.info(`User ${userId} subscribed to notifications (socket: ${socket.id})`);
      socket.emit('subscribed', { userId, socketId: socket.id });
    });

    socket.on('mark-as-read', async (data) => {
      const { notificationId } = data;

      if (!notificationId) {
        socket.emit('error', { message: 'notificationId is required' });
        return;
      }

      try {
        const pb = (await import('../utils/pocketbaseClient.js')).default;
        await pb.collection('notification_history').update(notificationId, {
          leida: true,
          fecha_lectura: new Date().toISOString().split('T')[0],
        });

        logger.info(`Notification marked as read: ${notificationId}`);
        socket.emit('read-success', { notificationId });
      } catch (error) {
        logger.error(`Error marking notification as read: ${error.message}`);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });

    socket.on('disconnect', () => {
      // Find and remove user from map
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          logger.info(`User ${userId} disconnected from notifications`);
          break;
        }
      }
    });
  });
}

function getConnectedUsers() {
  return new Map(connectedUsers);
}

function emitToUser(userId, event, data, io) {
  if (!io) {
    logger.warn('Socket.IO instance not available');
    return;
  }

  const nsp = io.of('/notifications');
  nsp.to(`user_${userId}`).emit(event, data);
  logger.debug(`Event '${event}' emitted to user ${userId}`);
}

function emitToUsers(userIds, event, data, io) {
  if (!io) {
    logger.warn('Socket.IO instance not available');
    return;
  }

  const nsp = io.of('/notifications');
  userIds.forEach(userId => {
    nsp.to(`user_${userId}`).emit(event, data);
  });
  logger.debug(`Event '${event}' emitted to ${userIds.length} users`);
}

export { initializeNotificationSocket, getConnectedUsers, emitToUser, emitToUsers };
