const addStock = 'INSERT INTO stocks (id, name, amount, unit, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())';
const getStocks = 'SELECT * FROM stocks';
const getStockById = 'SELECT * FROM stocks where id = $1';
const getStockByName = 'SELECT * FROM stocks where name = $1';
const deleteStockById = 'DELETE FROM stocks WHERE id = $1';
const updateStockById = 'UPDATE rules SET name = $1, amount = $2, unit = $3, updated_at = NOW() WHERE id = $4';

module.exports = {
  addStock,
  getStocks,
  getStockById,
  getStockByName,
  deleteStockById,
  updateStockById,
};
