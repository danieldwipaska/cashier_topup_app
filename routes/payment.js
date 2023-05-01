const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const payments = require('../database/payments/queries');
const rules = require('../database/rules/queries');
const fnbs = require('../database/fnbs/queries');
const stocks = require('../database/stocks/queries');
const verifyToken = require('./middlewares/verifyToken');
const { v4 } = require('uuid');
const { errorLog, infoLog } = require('../config/logger/functions');
const { paymentLogger } = require('../config/logger/childLogger');
const { allRoles } = require('./middlewares/userRole');

// SEARCH
router.get('/search', verifyToken, allRoles, (req, res) => {
  const { card: barcode } = req.query;

  // INITIAL PAGE
  if (!barcode) {
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Payment',
      alert: '',
    });
  } else {
    // SEARCH FOR CARD
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) {
        errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling queries.getCardById');
        return res.status(500).json('Server Error');
      }
      if (results.rows.length === 0) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Payment',
          alert: 'Card does NOT EXIST',
        });
      } else if (!results.rows[0].dine_in) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Payment',
          alert: 'Card is NOT DINE-IN',
        });
      } else {
        pool.query(fnbs.getFnbs, [], (error, fnbResults) => {
          if (error) {
            errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling fnbs.getFnbs');
            return res.status(500).json('Server Error');
          }

          const foodFnb = fnbResults.rows.filter((fnbResult) => fnbResult.kind === 'food');
          const drinkFnb = fnbResults.rows.filter((fnbResult) => fnbResult.kind === 'drink');

          pool.query(payments.getPaymentPaidByID, [results.rows[0].customer_id, false], (error, payment) => {
            if (error) {
              errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling payments.getPaymentPaidByID');
              return res.status(500).json('Server Error');
            }

            let sumPayment = 0;
            payment.rows.forEach((menu) => {
              sumPayment += menu.payment;
            });

            pool.query(rules.getRules, [], (error, rules) => {
              if (error) {
                errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling rules.getRules');
                return res.status(500).json('Server Error');
              }

              return res.render('payment', {
                layout: 'layouts/main-layout',
                title: 'Payments',
                subtitle: 'Payment',
                alert: '',
                data: results.rows[0],
                dataPayTemp: payment.rows,
                foods: foodFnb,
                drinks: drinkFnb,
                sumPayment: sumPayment,
                rules: rules.rows,
              });
            });
          });
        });
      }
    });
  }
});

// ADD TEMPORARY PAYMENTS
router.post('/temp', verifyToken, allRoles, async (req, res) => {
  const { menu, price, barcode, customerName: customer_name, customerId: customer_id, amount, service, tax } = req.body;
  const sort = 'pay';

  if (amount <= 0) return res.status(400).json({ message: 'Total per item must not be 0 or less than 0' });

  const invoiceNumber = '';
  let totalPrice = price * amount;
  let payment = totalPrice + (totalPrice * 5) / 100;
  payment = payment + (payment * 10) / 100;

  try {
    const id = v4();
    await pool.query(payments.addPayment, [id, sort, barcode, customer_name, customer_id, payment, service, tax, menu, false, amount, totalPrice, invoiceNumber, null, req.validUser.name]);

    // SEND LOG
    infoLog(paymentLogger, 'Temporary payment was successfully added', barcode, customer_name, customer_id, req.validUser.name);

    // UPDATE THE STOCKS
    try {
      const fnbsResults = await pool.query(fnbs.getFnbByMenu, [menu]);

      // fnbsResults.rows[0].raw_mat <--- array
      // fnbsResults.rows[0].raw_amount <--- array

      for (let i = 0; i < fnbsResults.rows[0].raw_mat.length; i++) {
        let stocksResults = await pool.query(stocks.getStockByName, [fnbsResults.rows[0].raw_mat[i]]);

        let newStock = stocksResults.rows[0].amount - fnbsResults.rows[0].raw_amount[i] * amount;

        if (newStock < 0) return res.status(400).json(`Stock ${fnbsResults.rows[0].raw_mat[i]} is not enough`);

        await pool.query(stocks.updateStockByName, [newStock, fnbsResults.rows[0].raw_mat[i]]);
      }

      return res.redirect(`/payment/search?card=${barcode}`);
    } catch (error) {
      errorLog(paymentLogger, error, 'Error in HTTP POST /temp when calling payments.getFnbByMenu');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP POST /temp when calling payments.addPayment');
    return res.status(500).json('Server Error');
  }
});

// DELETE TEMPORARY PAYMENTS
router.get('/temp/:id/delete', verifyToken, allRoles, async (req, res) => {
  const { id } = req.params;

  // GET A PAYMENT BY ID
  try {
    const paymentResults = await pool.query(payments.getPaymentById, [id]);

    if (!paymentResults.rows.length) return res.status(404).json('Payment not found');

    try {
      await pool.query(payments.deletePaymentById, [id]);

      // SEND LOG
      infoLog(paymentLogger, 'Temporary Payment was successfully deleted', paymentResults.rows[0].barcode, paymentResults.rows[0].customer_name, paymentResults.rows[0].customer_id, req.validUser.name);

      try {
        const fnbsResults = await pool.query(fnbs.getFnbByMenu, [paymentResults.rows[0].menu]);

        for (let i = 0; i < fnbsResults.rows[0].raw_mat.length; i++) {
          let stocksResults = await pool.query(stocks.getStockByName, [fnbsResults.rows[0].raw_mat[i]]);

          let newStock = stocksResults.rows[0].amount + fnbsResults.rows[0].raw_amount[i] * paymentResults.rows[0].amount;

          if (newStock < 0) return res.status(400).json(`Stock ${fnbsResults.rows[0].raw_mat[i]} is not enough`);

          await pool.query(stocks.updateStockByName, [newStock, fnbsResults.rows[0].raw_mat[i]]);
        }

        return res.redirect(`/payment/search?card=${paymentResults.rows[0].barcode}`);
      } catch (error) {
        errorLog(paymentLogger, error, 'Error in HTTP GET /temp/:id/delete when calling payments.getFnbByMenu');
        return res.status(500).json('Server Error');
      }
    } catch (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /temp/:id/delete when calling payments.deletePaymentById');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP GET /temp/:id/delete when calling payments.getPaymentById');
    return res.status(500).json('Server Error');
  }
});

// UPDATE PAYMENTS INTO PAID OFF
router.post('/', verifyToken, allRoles, (req, res) => {
  const { barcode, payment, customerId: customer_id } = req.body;

  pool.query(queries.getCardById, [barcode], (error, getCardResults) => {
    if (error) {
      errorLog(paymentLogger, error, 'Error in HTTP POST / when calling queries.getCardById');
      return res.status(500).json('Server Error');
    }

    const resBalance = getCardResults.rows[0].balance - payment;

    if (!getCardResults.rows.length) {
      return res.status(404).json('Card does not exist');
    } else if (resBalance < 0) {
      return res.status(400).json({ message: 'Saldo tidak mencukupi' });
    } else {
      pool.query(payments.getPaymentPaidByID, [customer_id, false], (error, getPaymentResults) => {
        if (error) {
          errorLog(paymentLogger, error, 'Error in HTTP POST / when calling payments.getPaymentPaidByID');
          return res.status(500).json('Server Error');
        }

        if (!getPaymentResults.rows.length) {
          return res.status(404).json('Payment Not Found');
        } else {
          // UPDATE BALANCE
          pool.query(queries.updateBalance, [resBalance, getCardResults.rows[0].deposit, getCardResults.rows[0].barcode], (error, updateBalanceResults) => {
            if (error) {
              errorLog(paymentLogger, error, 'Error in HTTP POST / when calling queries.updateBalance');
              return res.status(500).json('Server Error');
            }

            // SEND LOG
            infoLog(paymentLogger, 'Balance was successfully updated', updateBalanceResults.rows[0].barcode, updateBalanceResults.rows[0].customer_name, updateBalanceResults.rows[0].customer_id, req.validUser.name);

            // UPDATE PAID OFF AND GENERATE INVOICE
            const invoiceNumber = v4();
            pool.query(payments.updatePaymentPaid, [true, invoiceNumber, resBalance, customer_id, false], (error, updatePaymentResults) => {
              if (error) {
                errorLog(paymentLogger, error, 'Error in HTTP POST / when calling payments.updatePaymentPaid');
                return res.status(500).json('Server Error');
              }

              // SEND LOG
              infoLog(
                paymentLogger,
                'Paid Off was successfully updated into true and Invoice was successfully generated',
                getPaymentResults.rows[0].barcode,
                getPaymentResults.rows[0].customer_name,
                getPaymentResults.rows[0].customer_id,
                req.validUser.name
              );

              // RESPONSE
              return res.render('notificationSuccessWithBalance', {
                layout: 'layouts/main-layout',
                title: 'Payment Success',
                message: 'Payment succeed.',
                data: updateBalanceResults.rows[0],
                invoiceNumber: invoiceNumber,
              });
            });
          });
        }
      });
    }
  });
});

// GET INVOICE
router.get('/invoice/:num', verifyToken, allRoles, (req, res) => {
  const { num } = req.params;

  pool.query(payments.getInvoice, [num], (error, getInvoiceResults) => {
    if (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /invoice/:num when calling payments.getInvoice');
      return res.status(500).json('Server Error');
    }

    let paymentSum = 0;

    getInvoiceResults.rows.forEach((getInvoiceResult) => {
      paymentSum += getInvoiceResult.payment;
    });

    return res.render('invoiceSimple', {
      layout: 'layouts/receipt-layout',
      title: 'invoice',
      data: getInvoiceResults.rows,
      paymentSum: paymentSum,
    });
  });
});

// PAYMENT LIST
router.get('/list', verifyToken, allRoles, (req, res) => {
  pool.query(payments.getPaymentByPaidOff, [true], (error, results) => {
    if (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /list when calling payments.getPayments');
      return res.status(500).json('Server Error');
    }

    return res.render('paymentList', {
      layout: 'layouts/main-layout',
      title: 'Payment List',
      data: results.rows,
      messages: '',
      alert: '',
    });
  });
});

// DELETE PAYMENT
router.get('/:invoice/delete', verifyToken, allRoles, (req, res) => {
  const { invoice } = req.params;

  pool.query(payments.getPaymentsByInvoice, [invoice], (error, getResults) => {
    if (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /:id/delete when calling payments.getPaymentsByInvoice');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length === 0) {
      res.status(404).json('Payment Not Found');
    } else {
      pool.query(payments.deletePaymentByInvoice, [invoice], (error, deleteResults) => {
        if (error) {
          errorLog(paymentLogger, error, 'Error in HTTP GET /:id/delete when calling payments.deletePaymentByInvoice');
          return res.status(500).json('Server Error');
        }

        // SEND LOG
        infoLog(paymentLogger, 'Payments were successfully deleted', getResults.rows[0].barcode, getResults.rows[0].customer_name, getResults.rows[0].customer_id, req.validUser.name);

        return res.redirect('/payment/list');
      });
    }
  });
});

// // TOP-UP
// router.post('/', verifyToken, (req, res) => {
//   const { barcode, payment } = req.body;
//   // MENU and AMOUNT
//   let paymentInt = parseInt(payment, 10);

//   // SEARCH FOR CARD
//   pool.query(queries.getCardById, [barcode], (error, results) => {
//     if (error) return console.log(error);

//     // CHECK WHETHER CUSTOMER IS ACTIVE AND DINE-IN
//     if (!results.rows[0].is_active) {
//       res.render('payment', {
//         layout: 'layouts/main-layout',
//         title: 'Payment',
//         alert: 'Card is NOT ACTIVE.\nPlease activate the card first',
//         data: results.rows[0],
//       });
//     } else if (!results.rows[0].dine_in) {
//       res.render('payment', {
//         layout: 'layouts/main-layout',
//         title: 'Payment',
//         alert: 'Card has NOT CHECKED IN yet. Only person who is dine-in can do Top-Up.',
//         data: results.rows[0],
//       });
//     } else {
//       // ADD NEW BALANCE
//       paymentInt = results.rows[0].balance - paymentInt;

//       // IF BALANCE IS NOT ENOUGH
//       if (paymentInt < 0) {
//         res.render('payment', {
//           layout: 'layouts/main-layout',
//           title: 'Payment',
//           alert: 'Card does NOT have ENOUGH BALANCE to pay. Please Top-Up your balance first.',
//           data: results.rows[0],
//         });
//       } else {
//         const id = v4();
//         const customer_id = v5();

//         pool.query(payments.addPayment, [id, results.rows[0].barcode, results.rows[0].customer_name, customer_id, paymentInt, menu, amount], (error, addPaymentResults) => {
//           if (error) return console.log(error);

//           pool.query(queries.updateBalance, [paymentInt, barcode], (error, updateResults) => {
//             if (error) return console.log(error);

//             res.render('notificationSuccessWithBalance', {
//               layout: 'layouts/main-layout',
//               title: 'Payment Success',
//               message: 'Payment succeed.',
//               data: updateResults.rows[0],
//             });
//           });
//         });
//       }
//     }
//   });
// });

module.exports = router;
