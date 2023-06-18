const addDiscount = 'INSERT INTO discounts (id, name, description, percent, value, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())';
const getDiscounts = 'SELECT * FROM discounts';
const getDiscountById = 'SELECT * FROM discounts WHERE id = $1';
const getDiscountByName = 'SELECT * FROM discounts WHERE name = $1';
const deleteDiscountById = 'DELETE FROM discounts WHERE id = $1';
const updateDiscountById = 'UPDATE discounts SET name = $1, description = $2, percent = $3, value $4, updated_at = NOW() WHERE id = $5';

module.exports = {
  addDiscount,
  getDiscountById,
  getDiscountByName,
  getDiscounts,
  deleteDiscountById,
  updateDiscountById,
};
