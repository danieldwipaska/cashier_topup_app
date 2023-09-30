const addCrew = 'INSERT INTO crews (id, name, code, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())';
const getCrews = 'SELECT * FROM crews';
const getCrewByName = 'SELECT * FROM crews WHERE name = $1';
const getCrewByCode = 'SELECT * FROM crews WHERE code = $1';
const getCrewById = 'SELECT * FROM crews WHERE id = $1';
const deleteCrewById = 'DELETE FROM crews WHERE id = $1';

module.exports = {
  addCrew,
  getCrews,
  getCrewByName,
  getCrewByCode,
  getCrewById,
  deleteCrewById,
};
