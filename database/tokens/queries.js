const addToken = 'INSERT INTO tokens (id, access_token, token_type, expires_in, expires_at, scope, refresh_token, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())';
const getLatestToken = 'SELECT * FROM tokens ORDER BY created_at DESC;';
const updateToken = 'UPDATE tokens SET access_token = $1, expires_in = $2, refresh_token = $3, created_at = NOW() WHERE token_type = $4 RETURNING *';

module.exports = {
  getLatestToken,
  addToken,
  updateToken,
};
