const addCard = 'INSERT INTO cards (id, barcode, balance, deposit, customer_name, customer_id, is_member, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *'; //change
const getCards = 'SELECT * FROM cards ORDER BY updated_at DESC';
const getCardById = 'SELECT * FROM cards WHERE barcode = $1';
const getCardByCardId = 'SELECT * FROM cards WHERE id = $1';
const getCardByIdAndCustomerId = 'SELECT * FROM cards WHERE barcode = $1 AND customer_id = $2';
// const checkEmailExists = 'SELECT s FROM students s WHERE s.email = $1';
// const removeStudent = 'DELETE FROM students WHERE id = $1';
const cardActivate = 'UPDATE cards SET is_active = $1, updated_at = NOW() WHERE barcode = $2';
const cardDeactivate = 'UPDATE cards SET is_active = $1, customer_name = $2, balance = $3, customer_id = $4, updated_at = NOW() WHERE barcode = $5';
const cardStatus = 'UPDATE cards SET is_active = $1, customer_name = $2, customer_id = $3, balance = $4, deposit = $5, updated_at = NOW() WHERE barcode = $6 RETURNING *'; //change
const updateBalance = 'UPDATE cards SET balance = $1, deposit = $2, updated_at = NOW() WHERE barcode = $3 RETURNING *';
const updateCardById = 'UPDATE cards SET customer_name = $1, customer_id = $2, updated_at = NOW() WHERE barcode = $3 RETURNING *';
const getCardsDineIn = 'SELECT * FROM cards WHERE is_active = $1';
const deleteCardById = 'DELETE FROM cards WHERE id = $1';

module.exports = {
  addCard,
  getCards,
  getCardById,
  getCardByCardId,
  getCardByIdAndCustomerId,
  cardActivate,
  cardDeactivate,
  cardStatus,
  updateBalance,
  updateCardById,
  getCardsDineIn,
  deleteCardById,
};
