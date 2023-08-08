const express = require('express');
const router = express.Router();
const pool = require('../db');
const cardQueries = require('../database/cards/queries');
const paymentQueries = require('../database/payments/queries');
const tokenQueries = require('../database/tokens/queries');
const taxQueries = require('../database/taxes/queries');
const fnbQueries = require('../database/fnbs/queries');
const stockQueries = require('../database/stocks/queries');
const discountQueries = require('../database/discounts/queries');
const verifyToken = require('./middlewares/verifyToken');
const { v4 } = require('uuid');
const { errorLog, infoLog } = require('../config/logger/functions');
const { paymentLogger } = require('../config/logger/childLogger');
const { allRoles, cashierAndDeveloper } = require('./middlewares/userRole');
const fastcsv = require('fast-csv');
const fs = require('fs');
const { convertTZ } = require('./functions/convertDateTimezone');

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

    return res.render('payment', {
      layout: 'layouts/main-layout',
      title: 'Payments',
      subtitle: 'Payment',
      alert: '',
      data: cards.rows[0],
    });
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }
});

// PAYMENTS
router.post('/', verifyToken, allRoles, async (req, res) => {
  const { barcode, customerName: customer_name, customerId: customer_id, payment, invoiceNumber: invoice_number, invoiceStatus: invoice_status, servedBy: served_by, collectedBy: collected_by } = req.body;

  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);
    if (!cards.rows.length) return res.status(404).json('Card Not Found');

    if (cards.rows[0].customer_id !== customer_id) return res.status(401).json('The Card Does Not Belong To The Customer');

    try {
      const deposit = cards.rows[0].deposit;
      const initial_balance = cards.rows[0].balance;

      const final_balance = initial_balance - payment;
      if (final_balance < 0) return res.status(401).json('Balance Not Enough');

      const date = new Date();
      const dateNow = convertTZ(date, 'Asia/Jakarta');

      const updatedCards = await pool.query(cardQueries.updateBalance, [final_balance, deposit, dateNow, barcode]);

      try {
        const id = v4();
        const action = 'pay';

        const payments = await pool.query(paymentQueries.addPayment, [id, action, barcode, customer_name, customer_id, payment, invoice_number, invoice_status, initial_balance, final_balance, served_by, collected_by, dateNow, dateNow]);

        // SEND LOG
        infoLog(paymentLogger, 'Payment was successfully added and invoice number was successfully generated', updatedCards.rows[0].barcode, updatedCards.rows[0].customer_name, updatedCards.rows[0].customer_id, req.validUser.name);

        return res.render('notificationSuccessWithBalance', {
          layout: 'layouts/main-layout',
          title: 'Payment Success',
          message: 'Card Payment succeed.',
          data: updatedCards.rows[0],
          invoiceNumber: invoice_number,
          isTopup: '',
        });
      } catch (error) {
        errorLog(paymentLogger, error, 'Error in HTTP POST / when calling paymentQueries.addPayment');
        return res.status(500).json('Server Error');
      }
    } catch (error) {
      errorLog(paymentLogger, error, 'Error in HTTP POST / when calling cardQueries.updateBalance');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP POST / when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }
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
    const payments = await pool.query(paymentQueries.getPayments, [limit, offset]);

    payments.rows.forEach((payment) => {
      payment.created_at = convertTZ(payment.created_at, 'Asia/Jakarta');
    });

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
router.get('/:id/delete', verifyToken, cashierAndDeveloper, (req, res) => {
  const { id } = req.params;

  pool.query(paymentQueries.getPaymentById, [id], (error, getResults) => {
    if (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /:invoice/delete when calling paymentQueries.getPaymentsByInvoice');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length === 0) {
      res.status(404).json('Payment Not Found');
    } else {
      pool.query(paymentQueries.deletePaymentById, [id], (error, deleteResults) => {
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

// router.get('/token', async (req, res) => {
//   let dataCollection = [];

//   // getMokaInvoices();

//   const clientId = '6d72c3e6b7dc3ddbb6e162feb275f0d298ead57c070ccc1a0de07a5ddea514cb';
//   const clientSecret = '0643375a7d36cfaffd6f78a438fb96015922b9e741ac3d08d5aca3c139ae7036';
//   let accessToken = null;
//   let accessTokenExpiresAt = 0;
//   let refreshToken = '';

//   async function getNewAccessToken() {
//     try {
//       const response = await axios.post('https://api.mokapos.com/oauth/token', {
//         grant_type: 'refresh_token',
//         client_id: clientId,
//         client_secret: clientSecret,
//         refresh_token: refreshToken,
//       });

//       const newAccessToken = response.data.access_token;
//       const newExpiresIn = response.data.expires_in;

//       // Update the access token and its expiration time
//       accessToken = newAccessToken;
//       accessTokenExpiresAt = Date.now() + newExpiresIn * 1000;

//       // Optionally, update the refresh token if the server provides a new one.
//       const newRefreshToken = response.data.refresh_token;
//       if (newRefreshToken) {
//         // Store the newRefreshToken securely for future use.
//         refreshToken = newRefreshToken;
//       }

//       return newAccessToken;
//     } catch (error) {
//       // Handle error (e.g., invalid refresh token, server errors, etc.).
//       console.error('Error refreshing access token:', error.message);
//       throw error;
//     }
//   }

//   async function makeAuthenticatedRequest() {
//     if (!accessToken || shouldRefreshToken()) {
//       // Get a new access token if not available or about to expire
//       try {
//         accessToken = await getNewAccessToken();
//       } catch (error) {
//         // Handle token refresh errors here
//         return;
//       }
//     }

//     // Make the actual API request with the access token
//     try {
//       const response = await axios.get('https://api.mokapos.com/v3/outlets/852790/reports/get_latest_transactions?per_page=10', {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//       });
//       // Process the response
//       const mokaData = document.querySelector('.moka-data');

//       let dataString = '';

//       response.data.data.payments.forEach((element, i) => {
//         dataString += `<button type="button" class="btn btn-light shadow text-start p-3" id="${i}">${element.payment_no}&emsp;&emsp;${element.customer_name}</button>`;

//         dataCollection.push(element);
//       });

//       mokaData.innerHTML = dataString;
//     } catch (error) {
//       // Handle API request errors here
//     }
//   }

//   await makeAuthenticatedRequest();
//   // Periodically check for token expiration and make authenticated requests

// });

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

  const dateFromUtc = convertTZ(dateFrom, 'Asia/Jakarta');
  const dateToUtc = convertTZ(dateTo, 'Asia/Jakarta');

  // console.log(Date.parse(dateFrom));
  // console.log(Date.parse(dateTo));
  console.log(dateFromUtc);
  console.log(dateToUtc);

  console.log(dateFrom);
  console.log(dateTo);

  const payments = await pool.query(`SELECT * FROM payments WHERE created_at >= $1 AND created_at <= $2`, [dateFromUtc, dateToUtc]);
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
