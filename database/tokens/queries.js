const addToken = 'INSERT INTO rules (id, access_token, token_type, expires_in, expires_at, scope, refresh_token, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
const getLatestToken = 'SELECT * FROM tokens ORDER BY created_at DESC;';
const updateToken = 'UPDATE tokens SET access_token = $1, expires_in = $2, refresh_token = $3, created_at = $4 WHERE token_type = $5 RETURNING *';

module.exports = {
  getLatestToken,
  addToken,
  updateToken,
};
