const addCard = 'INSERT INTO cards (id, barcode, balance, customer_name, customer_id, is_member, is_active, dine_in, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())'; //change
const getCards = 'SELECT * FROM cards';
const getCardById = 'SELECT * FROM cards WHERE barcode = $1';
// const checkEmailExists = 'SELECT s FROM students s WHERE s.email = $1';
// const removeStudent = 'DELETE FROM students WHERE id = $1';
const cardActivate = 'UPDATE cards SET is_active = $1, updated_at = NOW() WHERE barcode = $2';
const cardDeactivate = 'UPDATE cards SET is_active = $1, dine_in = $2, customer_name = $3, balance = $4, updated_at = NOW() WHERE barcode = $5';
const cardStatus = 'UPDATE cards SET dine_in = $1, customer_name = $2, customer_id = $3, balance = $4, updated_at = NOW() WHERE barcode = $5'; //change
const updateBalance = 'UPDATE cards SET balance = $1, updated_at = NOW() WHERE barcode = $2 RETURNING *';

module.exports = {
  addCard,
  getCards,
  getCardById,
  cardActivate,
  cardDeactivate,
  cardStatus,
  updateBalance,
  //   checkEmailExists,

  //   removeStudent,
  //   updateStudent,
};
