const chatRepository = require('./chat.repository');
const bloodRequestRepository = require('../bloodRequests/bloodRequest.repository');
const donorRepository = require('../donors/donor.repository');
const matchingRepository = require('../matching/matching.repository');
const AppError = require('../../utils/AppError');
const { getIo } = require('../../socket');

/**
 * Verify user is authorized to participate in coordination chat for this blood request.
 * Authorized participants: The requester and registered donors.
 */
async function verifyChatAccess(requestId, user) {
  const request = await bloodRequestRepository.findById(requestId);
  if (!request) throw new AppError('Blood request not found', 404);

  // Requester has full chat access
  if (request.requester_id === user.id) {
    return { request, isRequester: true };
  }

  // Donor with a valid profile has chat access
  if (user.role === 'DONOR') {
    const profile = await donorRepository.findByUserId(user.id);
    if (!profile) {
      throw new AppError('Please complete your donor profile first to join the coordination chat', 403);
    }
    return { request, isRequester: false, profile };
  }

  throw new AppError('Unauthorized to access this coordination chat', 403);
}

async function getMessages(requestId, user) {
  await verifyChatAccess(requestId, user);
  return chatRepository.listMessages(requestId);
}

async function sendMessage(requestId, user, messageText) {
  if (!messageText || !String(messageText).trim()) {
    throw new AppError('Message content cannot be empty', 400);
  }

  await verifyChatAccess(requestId, user);

  const cleanMessage = String(messageText).trim();
  const saved = await chatRepository.saveMessage({
    bloodRequestId: requestId,
    senderId: user.id,
    message: cleanMessage,
  });

  const fullMessage = {
    ...saved,
    sender_name: user.name,
    sender_role: user.role,
  };

  // Broadcast via Socket.IO to request room
  const io = getIo();
  if (io) {
    io.to(`request_${requestId}`).emit('chat:message', {
      requestId,
      message: fullMessage,
    });
  }

  return fullMessage;
}

module.exports = {
  getMessages,
  sendMessage,
  verifyChatAccess,
};
