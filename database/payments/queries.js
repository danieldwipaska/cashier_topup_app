const addPayment =
  'INSERT INTO payments (id, action, barcode, customer_name, customer_id, payment, invoice_number, invoice_status, initial_balance, final_balance, served_by, collected_by, created_at, updated_at, payment_method, notes, menu_names, menu_amount, menu_prices, menu_kinds, menu_discounts, menu_discount_percents) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id, action, barcode, customer_name, customer_id, payment, invoice_number, initial_balance, final_balance, created_at, menu_names, menu_amount, menu_prices, menu_kinds, menu_discounts, menu_discount_percents';
const getPayments = 'SELECT * FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2';
const getBottlePayments = 'SELECT * FROM payments WHERE invoice_number LIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
const getPaymentByCustomerId = 'SELECT * FROM payments WHERE customer_id = $1';
const getPaymentByCustomerIdOrName = 'SELECT * FROM payments WHERE LOWER(customer_id) LIKE $1 OR LOWER(customer_name) LIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
const getPaymentWithActionByCustomerId = 'SELECT * FROM payments WHERE action = $1 AND customer_id = $2';
const getPaymentByCustomerIdAndSort = 'SELECT * FROM payments WHERE customer_id = $1 AND invoice_status = $2';
const getPaymentById = 'SELECT * FROM payments WHERE id = $1';
const getPaidPayment = 'SELECT * FROM payments WHERE invoice_status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
const getPaymentsByInvoice = 'SELECT * FROM payments WHERE invoice_number = $1';
const getPaymentPaidByID = 'SELECT * FROM payments WHERE customer_id = $1 AND paid_off = $2';
const deletePaymentById = 'DELETE FROM payments WHERE id = $1;';
const deletePaymentByInvoice = 'DELETE FROM payments WHERE invoice_number = $1';
const updatePaymentPaid = 'UPDATE payments SET paid_off = $1, invoice_number = $2, res_balance = $3, updated_at = NOW() WHERE customer_id = $4 AND paid_off = $5';
const updatePaymentStatusById = 'UPDATE payments SET invoice_status = $1, updated_at = NOW() WHERE id = $2';
const getInvoice = 'SELECT * FROM payments WHERE invoice_number = $1';

const getPaymentWithDateRange = 'SELECT invoice_number, payment, created_at FROM payments WHERE action = $1 AND created_at >= $2 AND created_at <= $3 ORDER BY created_at ASC';
const getPaymentWithMethodDateRange = 'SELECT payment, created_at FROM payments WHERE action = $1 AND payment_method = $2 AND created_at >= $3 AND created_at <= $4 ORDER BY created_at ASC';

const getPaymentInvoiceNumberMoka = 'SELECT invoice_number FROM payments WHERE action = $1 AND menu_names[1] = $2 AND created_at >= $3 AND created_at <= $4 ORDER BY created_at DESC LIMIT $5 OFFSET $6';

module.exports = {
  addPayment,
  getPayments,
  getBottlePayments,
  getPaymentByCustomerId,
  getPaymentByCustomerIdOrName,
  getPaymentWithActionByCustomerId,
  getPaymentByCustomerIdAndSort,
  getPaymentById,
  getPaidPayment,
  getPaymentsByInvoice,
  getPaymentPaidByID,
  deletePaymentById,
  deletePaymentByInvoice,
  updatePaymentPaid,
  updatePaymentStatusById,
  getInvoice,
  getPaymentWithDateRange,
  getPaymentWithMethodDateRange,
  getPaymentInvoiceNumberMoka,
  //   checkEmailExists,

  //   removeStudent,
  //   updateStudent,
};
