const Pool = require('pg').Pool;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: 'localhost',
  database: 'cafecashier',
  password: process.env.POSTGRES_PASS,
  port: 5432,
});

module.exports = pool;
