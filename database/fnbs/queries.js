const addFnb = 'INSERT INTO fnbs (id, menu, kind, price, raw_mat, raw_amount, discount_percent, discount_status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())';
const getFnbs = 'SELECT * FROM fnbs ORDER BY menu ASC, kind ASC';
const getFnbByMenu = 'SELECT * FROM fnbs WHERE menu = $1';
const getFnbByMenuAndKind = 'SELECT * FROM fnbs WHERE menu = $1 AND kind = $2';
const getFnbById = 'SELECT * FROM fnbs WHERE id = $1';
const deleteFnbById = 'DELETE FROM fnbs WHERE id = $1;';
const updateFnbById = 'UPDATE fnbs SET menu = $1, kind = $2, price = $3, raw_mat = $4, raw_amount = $5, discount_percent = $6, discount_status = $7, updated_at = NOW() WHERE id = $8 RETURNING *';
const updateDiscountStatusById = 'UPDATE fnbs SET discount_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
// const checkEmailExists = 'SELECT s FROM students s WHERE s.email = $1';
// const removeStudent = 'DELETE FROM students WHERE id = $1';
// const updateBalance = 'UPDATE cards SET balance = $1, updated_at = NOW() WHERE barcode = $2 RETURNING *';

module.exports = {
  addFnb,
  getFnbs,
  getFnbByMenu,
  getFnbByMenuAndKind,
  getFnbById,
  deleteFnbById,
  updateFnbById,
  updateDiscountStatusById,
  //   checkEmailExists,

  //   removeStudent,
  //   updateStudent,
};
