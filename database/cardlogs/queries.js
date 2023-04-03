const addCardlog = 'INSERT INTO cardlogs (id, barcode, customer_name, customer_id, log, username, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())';
const getCardlogs = 'SELECT * FROM cardlogs';
const getCardlogById = 'SELECT * FROM cardlogs WHERE id = $1';
const deleteCardlogById = 'DELETE FROM cardlogs WHERE id = $1';
// const checkEmailExists = 'SELECT s FROM students s WHERE s.email = $1';
// const removeStudent = 'DELETE FROM students WHERE id = $1';
// const updateBalance = 'UPDATE cards SET balance = $1, updated_at = NOW() WHERE barcode = $2 RETURNING *';

module.exports = {
  addCardlog,
  getCardlogs,
  getCardlogById,
  deleteCardlogById,
  //   checkEmailExists,

  //   removeStudent,
  //   updateStudent,
};
