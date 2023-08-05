const addTaxes = 'INSERT INTO rules (id, name, value, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())';
const getTaxes = 'SELECT * FROM rules';
const getTaxById = 'SELECT * FROM rules where id = $1';
const getTaxByName = 'SELECT * FROM rules where name = $1';
const deleteTaxById = 'DELETE FROM rules WHERE id = $1';
const updateTaxById = 'UPDATE rules SET name = $1, value = $2, updated_at = NOW() WHERE id = $3';

module.exports = {
  addTaxes,
  getTaxes,
  getTaxById,
  getTaxByName,
  deleteTaxById,
  updateTaxById,
};

// const addRule = 'INSERT INTO rules (id, name, value, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())';
// const getRules = 'SELECT * FROM rules';
// const getRuleById = 'SELECT * FROM rules where id = $1';
// const getRuleByName = 'SELECT * FROM rules where name = $1';
// const deleteRuleById = 'DELETE FROM rules WHERE id = $1';
// const updateRuleById = 'UPDATE rules SET name = $1, value = $2, updated_at = NOW() WHERE id = $3';

// module.exports = {
//   addRule,
//   getRules,
//   getRuleById,
//   getRuleByName,
//   deleteRuleById,
//   updateRuleById,
// };
