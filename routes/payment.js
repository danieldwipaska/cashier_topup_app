const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const payments = require('../database/payments/queries');
const fnbs = require('../database/fnbs/queries');
const verifyToken = require('./middlewares/verifyToken');
const { v4 } = require('uuid');

// SEARCH
router.get('/search', verifyToken, (req, res) => {
  const { card: barcode } = req.query;

  // INITIAL PAGE
  if (!barcode) {
    res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Payment',
      alert: '',
    });
  } else {
    // SEARCH FOR CARD
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) return console.log(error);
      if (results.rows.length === 0) {
        res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Payment',
          alert: 'Card does NOT EXIST',
        });
      } else if (!results.rows[0].dine_in) {
        res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Payment',
          alert: 'Card is NOT DINE-IN',
        });
      } else {
        pool.query(fnbs.getFnbs, [], (error, fnbResults) => {
          if (error) return console.log(error);

          const foodFnb = fnbResults.rows.filter((fnbResult) => fnbResult.kind === 'food');
          const drinkFnb = fnbResults.rows.filter((fnbResult) => fnbResult.kind === 'drink');

          pool.query(payments.getPaymentPaidByID, [results.rows[0].customer_id, false], (error, payment) => {
            if (error) return console.log(error);

            let sumPayment = 0;
            payment.rows.forEach((menu) => {
              sumPayment += menu.payment;
            });
            res.render('payment', {
              layout: 'layouts/main-layout',
              title: 'Top-Up',
              subtitle: 'Payment',
              alert: '',
              data: results.rows[0],
              dataPayTemp: payment.rows,
              foods: foodFnb,
              drinks: drinkFnb,
              sumPayment: sumPayment,
            });
          });
        });
      }
    });
  }
});

// ADD TEMPORARY PAYMENTS
router.post('/temp', verifyToken, (req, res) => {
  const { menu, price, barcode, customerName: customer_name, customerId: customer_id, amount } = req.body;
  const sort = 'pay';

  if (amount <= 0) {
    return res.status(400).json({ message: 'Jumlah per item tidak boleh nol atau minus' });
  }

  const invoiceNumber = '';
  let payment = price * amount;

  // SAVE TO DATABASE
  const id = v4();
  pool.query(payments.addPayment, [id, sort, barcode, customer_name, customer_id, payment, menu, false, amount, invoiceNumber], (error, addPaymentResults) => {
    if (error) return console.log(error);

    res.redirect(`/payment/search?card=${barcode}`);
  });
});

// DELETE TEMPORARY PAYMENTS
router.get('/temp/:id/delete', verifyToken, (req, res) => {
  const { id } = req.params;

  pool.query(payments.getPaymentById, [id], (error, getPaymentResults) => {
    if (error) return console.log(error);

    if (!getPaymentResults.rows.length) {
      res.status(404).json('Payment Not Found');
    } else {
      pool.query(payments.deletePaymentById, [id], (error, deletePaymentResults) => {
        if (error) return console.log(error);

        res.redirect(`/payment/search?card=${getPaymentResults.rows[0].barcode}`);
      });
    }
  });
});

// UPDATE PAYMENTS INTO PAID OFF
router.post('/', verifyToken, (req, res) => {
  const { barcode, payment, customerId: customer_id } = req.body;

  pool.query(queries.getCardById, [barcode], (error, getCardResults) => {
    if (error) return console.log(error);

    total = getCardResults.rows[0].balance - payment;

    if (total < 0) {
      return res.status(400).json({ message: 'Saldo tidak mencukupi' });
    } else {
      pool.query(payments.getPaymentPaidByID, [customer_id, false], (error, getPaymentResults) => {
        if (error) return console.log(error);

        if (!getPaymentResults.rows.length) {
          res.status(404).json('Payment Not Found');
        } else {
          // UPDATE
          const invoiceNumber = v4();
          pool.query(payments.updatePaymentPaid, [true, invoiceNumber, customer_id, false], (error, updatePaymentResults) => {
            if (error) return console.log(error);

            pool.query(queries.updateBalance, [total, getCardResults.rows[0].barcode], (error, updateBalanceResults) => {
              res.render('notificationSuccessWithBalance', {
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

// GENERATE INVOICE
router.get('/invoice/:num', verifyToken, (req, res) => {
  const { num } = req.params;

  pool.query(payments.getInvoice, [num], (error, getInvoiceResults) => {
    if (error) return console.log(error);

    let paymentSum = 0;

    getInvoiceResults.rows.forEach((getInvoiceResult) => {
      paymentSum += getInvoiceResult.payment;
    });

    res.render('invoiceSimple', {
      layout: 'layouts/receipt-layout',
      title: 'invoice',
      data: getInvoiceResults.rows,
      paymentSum: paymentSum,
    });
  });
});

// PAYMENT LIST
router.get('/list', (req, res) => {
  pool.query(payments.getPayments, [], (error, results) => {
    if (error) return console.log(error);

    res.render('paymentList', {
      layout: 'layouts/main-layout',
      title: 'Payment List',
      data: results.rows,
      messages: '',
      alert: '',
    });
  });
});

// DELETE PAYMENT
router.get('/:id/delete', verifyToken, (req, res) => {
  const { id } = req.params;

  pool.query(payments.getPaymentById, [id], (error, getResults) => {
    if (error) console.log(error);

    if (getResults.rows.length === 0) {
      res.status(404).json('Payment Not Found');
    } else {
      pool.query(payments.deletePaymentById, [id], (error, deleteResults) => {
        if (error) console.log();

        res.redirect('/payment/list');
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
