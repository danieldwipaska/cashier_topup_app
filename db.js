const Pool = require('pg').Pool;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: 'localhost',
  database: 'bahari_card_manager',
  password: process.env.POSTGRES_PASS,
  port: 5432,
});

module.exports = pool;
