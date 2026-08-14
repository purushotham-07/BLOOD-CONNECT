const pool = require('../../config/database');

async function saveMessage({ bloodRequestId, senderId, recipientId, message }) {
  const { rows } = await pool.query(
    `INSERT INTO chat_messages (blood_request_id, sender_id, recipient_id, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, blood_request_id, sender_id, recipient_id, message, created_at`,
    [bloodRequestId, senderId, recipientId || null, message]
  );
  return rows[0];
}

async function listMessages(bloodRequestId) {
  const { rows } = await pool.query(
    `SELECT
       cm.id, cm.blood_request_id, cm.sender_id, cm.recipient_id, cm.message, cm.created_at,
       u.name AS sender_name, u.role AS sender_role
     FROM chat_messages cm
     JOIN users u ON u.id = cm.sender_id
     WHERE cm.blood_request_id = $1
     ORDER BY cm.created_at ASC`,
    [bloodRequestId]
  );
  return rows;
}

module.exports = {
  saveMessage,
  listMessages,
};
