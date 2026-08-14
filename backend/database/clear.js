const pool = require('../src/config/database');

async function clearDatabase() {
  console.log('Clearing all users and transactional data from database...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Truncate all tables with CASCADE
    await client.query(`
      TRUNCATE TABLE
        chat_messages,
        notifications,
        donor_responses,
        donations,
        blood_requests,
        donor_profiles,
        users
      RESTART IDENTITY CASCADE;
    `);

    await client.query('COMMIT');
    console.log('✅ Database successfully cleared! Database is now completely fresh.');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to clear database:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

clearDatabase();
