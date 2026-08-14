const pool = require('../../config/database');

async function listForUser(userId) {
  const { rows } = await pool.query(
    `SELECT n.id, n.blood_request_id, n.type, n.status, n.sent_at, n.created_at,
            br.blood_group, br.hospital_name, br.hospital_address
       FROM notifications n
       LEFT JOIN blood_requests br ON br.id = n.blood_request_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC`,
    [userId]
  );
  return rows;
}

async function unreadCountForUser(userId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND status = $2',
    [userId, 'UNREAD']
  );
  return rows[0]?.count || 0;
}

async function markAsRead(id, userId) {
  const { rows } = await pool.query(
    `UPDATE notifications
        SET status = 'READ'
      WHERE id = $1 AND user_id = $2
      RETURNING id, blood_request_id, type, status, sent_at, created_at`,
    [id, userId]
  );
  return rows[0] || null;
}

module.exports = { listForUser, unreadCountForUser, markAsRead };