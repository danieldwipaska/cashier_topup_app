const express = require('express');
const router = express.Router();
const pool = require('../db');
const cardQueries = require('../database/cards/queries');
const paymentQueries = require('../database/payments/queries');
const taxQueries = require('../database/taxes/queries');
const fnbQueries = require('../database/fnbs/queries');
const stockQueries = require('../database/stocks/queries');
const discountQueries = require('../database/discounts/queries');
const verifyToken = require('./middlewares/verifyToken');
const { v4 } = require('uuid');
const { errorLog, infoLog } = require('../config/logger/functions');
const { paymentLogger } = require('../config/logger/childLogger');
const { allRoles } = require('./middlewares/userRole');
const fastcsv = require('fast-csv');
const fs = require('fs');

// SEARCH
router.get('/search', verifyToken, allRoles, async (req, res) => {
  const { card: barcode } = req.query;

  // INITIAL PAGE
  if (!barcode) {
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Payment',
      alert: '',
    });
  }

  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);

    if (cards.rows.length === 0) {
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Search',
        subtitle: 'Payment',
        alert: 'Card does NOT EXIST',
      });
    }

    if (!cards.rows[0].is_active) {
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Search',
        subtitle: 'Payment',
        alert: 'Card is NOT ACTIVE',
      });
    }

    try {
      let fnbsResults = await pool.query(fnbQueries.getFnbs, []);

      for (let i = 0; i < fnbsResults.rows.length; i++) {
        const matStockAmount = [];
        for (let j = 0; j < fnbsResults.rows[i].raw_mat.length; j++) {
          const stocksResults = await pool.query(stockQueries.getStockByName, [fnbsResults.rows[i].raw_mat[j]]);

          if (!stocksResults) {
            matStockAmount.push(null);
          } else {
            matStockAmount.push(stocksResults.rows[0].amount);
          }
        }
        fnbsResults.rows[i].matStockAmount = matStockAmount;
      }

      const foodFnb = fnbsResults.rows.filter((fnbResult) => fnbResult.kind === 'food');
      const drinkFnb = fnbsResults.rows.filter((fnbResult) => fnbResult.kind === 'drink');

      try {
        const paymentResults = await pool.query(paymentQueries.getPaymentPaidByID, [cards.rows[0].customer_id, false]);

        let sumPayment = 0;

        paymentResults.rows.forEach((menu) => {
          sumPayment += menu.payment;
        });

        try {
          const ruleResults = await pool.query(taxQueries.getTaxes, []);

          try {
            const discounts = await pool.query(discountQueries.getDiscounts, []);

            return res.render('payment', {
              layout: 'layouts/main-layout',
              title: 'Payments',
              subtitle: 'Payment',
              alert: '',
              data: cards.rows[0],
              dataPayTemp: paymentResults.rows,
              foods: foodFnb,
              drinks: drinkFnb,
              sumPayment: sumPayment,
              rules: ruleResults.rows,
              discounts: discounts.rows,
            });
          } catch (error) {
            errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling discountQueries.getDiscounts');
            return res.status(500).json('Server Error');
          }
        } catch (error) {
          errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling taxQueries.getTaxes');
          return res.status(500).json('Server Error');
        }
      } catch (error) {
        errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling paymentQueries.getPaymentPaidByID');
        return res.status(500).json('Server Error');
      }
    } catch (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling fnbQueries.getFnbs');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }
});

// ADD TEMPORARY PAYMENTS
router.post('/temp', verifyToken, allRoles, async (req, res) => {
  const { menu, price, barcode, customerName: customer_name, customerId: customer_id, amount, service, tax, discountName } = req.body;
  const sort = 'pay';

  const discount_name = discountName.split(',');

  if (amount <= 0) return res.status(400).json({ message: 'Total per item must not be 0 or less than 0' });

  const invoiceNumber = '';
  let totalPrice = price * amount;

  // DISCOUNT

  // if (discount_name.length > 1) return res.status(400).json('Cannot apply discount more than one');

  if (discount_name[0] !== '') {
    for (let i = 0; i < discount_name.length; i++) {
      try {
        const discounts = await pool.query(discountQueries.getDiscountByName, [discount_name[i]]);

        if (!discounts.rows.length) return res.status(404).json(`Cannot find the discount "${discount_name[i]}"`);

        if (!discounts.rows[0].percent || discounts.rows[0].percent === 0) {
          totalPrice = totalPrice - discounts.rows[0].value;
          if (totalPrice <= 0) return res.status(400).json('Total price is 0 or negative.');
        } else {
          totalPrice = totalPrice - (totalPrice * discounts.rows[0].percent) / 100;
        }
      } catch (error) {
        errorLog(paymentLogger, error, 'Error in HTTP POST /temp when calling discounts.getDiscountByName');
        return res.status(500).json('Server Error');
      }
    }
  }

  // SERVICE
  let payment = totalPrice + (totalPrice * 5) / 100;

  // TAX
  payment = payment + (payment * 10) / 100;

  try {
    const id = v4();
    await pool.query(paymentQueries.addPayment, [id, sort, barcode, customer_name, customer_id, payment, service, tax, discount_name, menu, false, amount, totalPrice, invoiceNumber, null, req.validUser.name]);

    // SEND LOG
    infoLog(paymentLogger, 'Temporary payment was successfully added', barcode, customer_name, customer_id, req.validUser.name);

    // UPDATE THE STOCKS
    try {
      const fnbsResults = await pool.query(fnbQueries.getFnbByMenu, [menu]);

      // fnbsResults.rows[0].raw_mat <--- array
      // fnbsResults.rows[0].raw_amount <--- array

      for (let i = 0; i < fnbsResults.rows[0].raw_mat.length; i++) {
        let stocksResults = await pool.query(stockQueries.getStockByName, [fnbsResults.rows[0].raw_mat[i]]);

        let newStock = stocksResults.rows[0].amount - fnbsResults.rows[0].raw_amount[i] * amount;

        if (newStock < 0) return res.status(400).json(`Stock ${fnbsResults.rows[0].raw_mat[i]} is not enough`);

        await pool.query(stockQueries.updateStockByName, [newStock, fnbsResults.rows[0].raw_mat[i]]);
      }

      return res.redirect(`/payment/search?card=${barcode}`);
    } catch (error) {
      errorLog(paymentLogger, error, 'Error in HTTP POST /temp when calling fnbQueries.getFnbByMenu');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP POST /temp when calling paymentQueries.addPayment');
    return res.status(500).json('Server Error');
  }
});

// DELETE TEMPORARY PAYMENTS
router.get('/temp/:id/delete', verifyToken, allRoles, async (req, res) => {
  const { id } = req.params;

  // GET A PAYMENT BY ID
  try {
    const paymentResults = await pool.query(paymentQueries.getPaymentById, [id]);

    if (!paymentResults.rows.length) return res.status(404).json('Payment not found');

    try {
      await pool.query(paymentQueries.deletePaymentById, [id]);

      // SEND LOG
      infoLog(paymentLogger, 'Temporary Payment was successfully deleted', paymentResults.rows[0].barcode, paymentResults.rows[0].customer_name, paymentResults.rows[0].customer_id, req.validUser.name);

      try {
        const fnbsResults = await pool.query(fnbQueries.getFnbByMenu, [paymentResults.rows[0].menu]);

        for (let i = 0; i < fnbsResults.rows[0].raw_mat.length; i++) {
          let stocksResults = await pool.query(stockQueries.getStockByName, [fnbsResults.rows[0].raw_mat[i]]);

          let newStock = stocksResults.rows[0].amount + fnbsResults.rows[0].raw_amount[i] * paymentResults.rows[0].amount;

          if (newStock < 0) return res.status(400).json(`Stock ${fnbsResults.rows[0].raw_mat[i]} is not enough`);

          await pool.query(stockQueries.updateStockByName, [newStock, fnbsResults.rows[0].raw_mat[i]]);
        }

        return res.redirect(`/payment/search?card=${paymentResults.rows[0].barcode}`);
      } catch (error) {
        errorLog(paymentLogger, error, 'Error in HTTP GET /temp/:id/delete when calling fnbQueries.getFnbByMenu');
        return res.status(500).json('Server Error');
      }
    } catch (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /temp/:id/delete when calling paymentQueries.deletePaymentById');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP GET /temp/:id/delete when calling paymentQueries.getPaymentById');
    return res.status(500).json('Server Error');
  }
});

// UPDATE PAYMENTS INTO PAID OFF
router.post('/', verifyToken, allRoles, (req, res) => {
  const { barcode, payment, customerId: customer_id } = req.body;

  pool.query(cardQueries.getCardById, [barcode], (error, getCardResults) => {
    if (error) {
      errorLog(paymentLogger, error, 'Error in HTTP POST / when calling cardQueries.getCardById');
      return res.status(500).json('Server Error');
    }

    const resBalance = getCardResults.rows[0].balance - payment;

    if (!getCardResults.rows.length) {
      return res.status(404).json('Card does not exist');
    } else if (resBalance < 0) {
      return res.status(400).json({ message: 'Saldo tidak mencukupi' });
    } else {
      pool.query(paymentQueries.getPaymentPaidByID, [customer_id, false], (error, getPaymentResults) => {
        if (error) {
          errorLog(paymentLogger, error, 'Error in HTTP POST / when calling paymentQueries.getPaymentPaidByID');
          return res.status(500).json('Server Error');
        }

        if (!getPaymentResults.rows.length) {
          return res.status(404).json('Payment Not Found');
        } else {
          // UPDATE BALANCE
          pool.query(cardQueries.updateBalance, [resBalance, getCardResults.rows[0].deposit, getCardResults.rows[0].barcode], (error, updateBalanceResults) => {
            if (error) {
              errorLog(paymentLogger, error, 'Error in HTTP POST / when calling cardQueries.updateBalance');
              return res.status(500).json('Server Error');
            }

            // SEND LOG
            infoLog(paymentLogger, 'Balance was successfully updated', updateBalanceResults.rows[0].barcode, updateBalanceResults.rows[0].customer_name, updateBalanceResults.rows[0].customer_id, req.validUser.name);

            // UPDATE PAID OFF AND GENERATE INVOICE
            const invoiceNumber = v4();
            pool.query(paymentQueries.updatePaymentPaid, [true, invoiceNumber, resBalance, customer_id, false], (error, updatePaymentResults) => {
              if (error) {
                errorLog(paymentLogger, error, 'Error in HTTP POST / when calling paymentQueries.updatePaymentPaid');
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

  pool.query(paymentQueries.getInvoice, [num], (error, getInvoiceResults) => {
    if (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /invoice/:num when calling paymentQueries.getInvoice');
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
router.get('/list', verifyToken, allRoles, async (req, res) => {
  let { page } = req.query;

  if (!page) {
    page = '1';
  }

  const pageInt = parseInt(page, 10);
  const limit = 20;
  const offset = (pageInt - 1) * limit;

  try {
    const payments = await pool.query(paymentQueries.getPaymentByPaidOff, [true, limit, offset]);

    return res.render('paymentList', {
      layout: 'layouts/main-layout',
      title: 'Payment List',
      data: payments.rows,
      messages: '',
      alert: '',
      page: page,
    });
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP GET /list when calling paymentQueries.getPaymentByPaidOff');
    return res.status(500).json('Server Error');
  }
});

// DELETE PAYMENT
router.get('/:invoice/delete', verifyToken, allRoles, (req, res) => {
  const { invoice } = req.params;

  pool.query(paymentQueries.getPaymentsByInvoice, [invoice], (error, getResults) => {
    if (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /:invoice/delete when calling paymentQueries.getPaymentsByInvoice');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length === 0) {
      res.status(404).json('Payment Not Found');
    } else {
      pool.query(paymentQueries.deletePaymentByInvoice, [invoice], (error, deleteResults) => {
        if (error) {
          errorLog(paymentLogger, error, 'Error in HTTP GET /:invoice/delete when calling paymentQueries.deletePaymentByInvoice');
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
//   pool.query(cardQueries.getCardById, [barcode], (error, results) => {
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

//           pool.query(cardQueries.updateBalance, [paymentInt, barcode], (error, updateResults) => {
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

router.post('/download', async (req, res) => {
  const { archiveFrom, archiveTo } = req.body;

  const dateFrom = new Date(archiveFrom);
  const dateTo = new Date(archiveTo);

  // console.log(Date.parse(dateFrom));
  // console.log(Date.parse(dateTo));

  const payments = await pool.query(`SELECT * FROM payments WHERE updated_at >= $1 AND updated_at <= $2`, [dateFrom, dateTo]);
  // console.log(payments.rows);

  const ws = fs.createWriteStream('./public/files/payments_from_yyyy-mm-dd_to_yyyy-mm-dd.csv');

  fastcsv
    .write(payments.rows, { headers: true })
    .on('finish', function () {
      return res.redirect('/public/files/payments_from_yyyy-mm-dd_to_yyyy-mm-dd.csv');
    })
    .pipe(ws);
});

module.exports = router;
