const getLatestToken = 'SELECT * FROM tokens ORDER BY created_at DESC;';

module.exports = {
  getLatestToken,
};
