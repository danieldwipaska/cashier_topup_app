const addFnb = 'INSERT INTO fnbs (id, menu, kind, netto, price, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())';
const getFnbs = 'SELECT * FROM fnbs';
const getFnbByMenu = 'SELECT * FROM fnbs WHERE menu = $1';
const getFnbById = 'SELECT * FROM fnbs WHERE id = $1';
const deleteFnbById = 'DELETE FROM fnbs WHERE id = $1;';
// const checkEmailExists = 'SELECT s FROM students s WHERE s.email = $1';
// const removeStudent = 'DELETE FROM students WHERE id = $1';
// const updateBalance = 'UPDATE cards SET balance = $1, updated_at = NOW() WHERE barcode = $2 RETURNING *';

module.exports = {
  addFnb,
  getFnbs,
  getFnbByMenu,
  getFnbById,
  deleteFnbById,
  //   checkEmailExists,

  //   removeStudent,
  //   updateStudent,
};
