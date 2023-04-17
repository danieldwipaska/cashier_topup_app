const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const payments = require('../database/payments/queries');
const verifyToken = require('./middlewares/verifyToken');
const { v4 } = require('uuid');
const { errorLog, infoLog } = require('../config/logger/functions');
const { topupLogger } = require('../config/logger/childLogger');
const { cashierAndDeveloper } = require('./middlewares/userRole');

// SEARCH
router.get('/search', verifyToken, cashierAndDeveloper, (req, res) => {
  const { card: barcode } = req.query;

  // INITIAL PAGE
  if (!barcode) {
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Top-Up',
      alert: '',
    });
  } else {
    // SEARCH FOR CARD
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) {
        errorLog(topupLogger, error, 'Error in HTTP GET /search when calling queries.getCardById');
        return res.status(500).json('Server Error');
      }
      if (results.rows.length === 0) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Top-Up',
          alert: 'Card does not exist',
        });
      } else {
        return res.render('topup', {
          layout: 'layouts/main-layout',
          title: 'Top-Up',
          subtitle: 'Top-Up',
          alert: '',
          data: results.rows[0],
        });
      }
    });
  }
});

// TOP-UP
router.post('/', verifyToken, cashierAndDeveloper, (req, res) => {
  const { barcode, addBalance } = req.body;
  const balanceInt = parseInt(addBalance, 10);

  // SEARCH FOR CARD
  pool.query(queries.getCardById, [barcode], (error, results) => {
    if (error) {
      errorLog(topupLogger, error, 'Error in HTTP POST / when calling queries.getCardByID');
      return res.status(500).json('Server Error');
    }

    if (!results.rows.length) {
      return res.status(404).json('Card does not exist');
    } else if (!results.rows[0].is_active) {
      // CHECK WHETHER CUSTOMER IS ACTIVE
      return res.render('topup', {
        layout: 'layouts/main-layout',
        title: 'Top-Up',
        alert: 'Card is NOT ACTIVE.\nPlease activate the card first',
        data: results.rows[0],
      });
    } else if (!results.rows[0].dine_in) {
      // CHECK WHETHER CUSTOMER IS DINE-IN
      return res.render('topup', {
        layout: 'layouts/main-layout',
        title: 'Top-Up',
        alert: 'Card has NOT CHECKED IN yet. Only person who is dine-in can do Top-Up.',
        data: results.rows[0],
      });
    } else {
      // ADD NEW BALANCE
      const resBalance = balanceInt + results.rows[0].balance;
      pool.query(queries.updateBalance, [resBalance, barcode], (error, updateResults) => {
        if (error) {
          errorLog(topupLogger, error, 'Error in HTTP POST / when calling queries.updateBalance');
          return res.status(500).json('Server Error');
        }

        // SEND LOG
        infoLog(topupLogger, 'Balance was successfully updated', updateResults.rows[0].barcode, updateResults.rows[0].customer_name, updateResults.rows[0].customer_id, req.validUser.name);

        // CREATE INVOICE
        const id = v4();
        const invoiceNumber = v4();
        const sort = 'topup';
        pool.query(payments.addPayment, [id, sort, results.rows[0].barcode, results.rows[0].customer_name, results.rows[0].customer_id, balanceInt, '', true, 0, invoiceNumber, resBalance, req.validUser.name], (error, addPaymentResults) => {
          if (error) {
            errorLog(topupLogger, error, 'Error in HTTP POST / when calling payments.addPayment');
            return res.status(500).json('Server Error');
          }

          // SEND LOG
          infoLog(topupLogger, 'Payment was successfully added and invoice number was successfully generated', results.rows[0].barcode, results.rows[0].customer_name, results.rows[0].customer_id, req.validUser.name);

          return res.render('notificationSuccessWithBalance', {
            layout: 'layouts/main-layout',
            title: 'Top-Up Success',
            message: 'Card Top-Up succeed.',
            data: updateResults.rows[0],
            invoiceNumber: invoiceNumber,
          });
        });
      });
    }
  });
});

module.exports = router;
