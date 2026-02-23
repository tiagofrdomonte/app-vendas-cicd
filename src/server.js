require('dotenv').config();

const app = require('./app');
const { pool } = require('./db');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    await pool.query('SELECT 1');
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start application:', err.message);
    process.exit(1);
  }
}

start();
