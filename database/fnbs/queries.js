const addFnb = 'INSERT INTO fnbs (id, code, menu, kind, price, raw_mat, raw_amount, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())';
const getFnbs = 'SELECT * FROM fnbs ORDER BY menu ASC, kind';
const getFnbByMenu = 'SELECT * FROM fnbs WHERE menu = $1';
const getFnbById = 'SELECT * FROM fnbs WHERE id = $1';
const getFnbByCode = 'SELECT * FROM fnbs WHERE code = $1';
const deleteFnbById = 'DELETE FROM fnbs WHERE id = $1;';
const updateFnbById = 'UPDATE fnbs SET code = $1, menu = $2, kind = $3, price = $4, raw_mat = $5, raw_amount = $6, updated_at = NOW() WHERE id = $7';
// const checkEmailExists = 'SELECT s FROM students s WHERE s.email = $1';
// const removeStudent = 'DELETE FROM students WHERE id = $1';
// const updateBalance = 'UPDATE cards SET balance = $1, updated_at = NOW() WHERE barcode = $2 RETURNING *';

module.exports = {
  addFnb,
  getFnbs,
  getFnbByMenu,
  getFnbById,
  getFnbByCode,
  deleteFnbById,
  updateFnbById,
  //   checkEmailExists,

  //   removeStudent,
  //   updateStudent,
};
