const addPayment = 'INSERT INTO payments (id, barcode, customer_name, customer_id, payment, menu, paid_off, amount, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())';
const getPayments = 'SELECT * FROM payments';
const getPaymentByCustomerId = 'SELECT * FROM payments WHERE customer_id = $1';
const getPaymentById = 'SELECT * FROM payments WHERE id = $1';
const getPaymentPaidByID = 'SELECT * FROM payments WHERE customer_id = $1 AND paid_off = $2';
const deletePaymentById = 'DELETE FROM payments WHERE id = $1;';
const updatePaymentPaid = 'UPDATE payments SET paid_off = $1 WHERE customer_id = $2 AND paid_off = $3';
// const checkEmailExists = 'SELECT s FROM students s WHERE s.email = $1';
// const removeStudent = 'DELETE FROM students WHERE id = $1';
// const updateBalance = 'UPDATE cards SET balance = $1, updated_at = NOW() WHERE barcode = $2 RETURNING *';

module.exports = {
  addPayment,
  getPayments,
  getPaymentByCustomerId,
  getPaymentById,
  getPaymentPaidByID,
  deletePaymentById,
  updatePaymentPaid,
  //   checkEmailExists,

  //   removeStudent,
  //   updateStudent,
};