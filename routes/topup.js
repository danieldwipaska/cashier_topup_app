const express = require('express');
const router = express.Router();
const pool = require('../db');
const cardQueries = require('../database/cards/queries');
const paymentQueries = require('../database/payments/queries');
// const memberqueries = require('../database/members/queries');
const verifyToken = require('./middlewares/verifyToken');
const { v4 } = require('uuid');
const { errorLog, infoLog } = require('../config/logger/functions');
const { topupLogger, checkinLogger } = require('../config/logger/childLogger');
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
    pool.query(cardQueries.getCardById, [barcode], (error, results) => {
      if (error) {
        errorLog(topupLogger, error, 'Error in HTTP GET /search when calling cardQueries.getCardById');
        return res.status(500).json('Server Error');
      }
      if (results.rows.length === 0) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Top-Up',
          alert: 'Card does not exist',
        });
      } else if (!results.rows[0].is_active) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Top-Up',
          alert: 'Card is NOT ACTIVE',
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
router.post('/', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { barcode, name: customer_name, addBalance, deposit } = req.body;

  const balanceInt = parseInt(addBalance, 10);
  let depositInt = parseInt(deposit, 10);
  let depositCount = depositInt;

  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);

    if (!cards.rows.length) return res.status(404).json('Card does not exist');

    // FOR NEW CARD
    if (!cards.rows[0].is_active)
      return res.render('topup', {
        layout: 'layouts/main-layout',
        title: 'Top-Up',
        alert: 'Card is NOT ACTIVE.\nPlease activate the card first',
        data: cards.rows[0],
      });

    try {
      const paymentResults = await pool.query(paymentQueries.getPaymentByCustomerIdAndSort, [cards.rows[0].customer_id, 'topup']);

      if (paymentResults.rows.length) {
        depositCount = 0;
      }

      try {
        // ADD NEW BALANCE
        const resBalance = balanceInt + cards.rows[0].balance - depositCount;

        const cardUpdated = await pool.query(cardQueries.updateBalance, [resBalance, depositInt, barcode]);

        // SEND LOG
        infoLog(topupLogger, 'Balance was successfully updated', cardUpdated.rows[0].barcode, cardUpdated.rows[0].customer_name, cardUpdated.rows[0].customer_id, req.validUser.name);

        try {
          // CREATE INVOICE
          const id = v4();
          const invoiceNumber = v4();
          const sort = 'topup';

          await pool.query(paymentQueries.addPayment, [id, sort, cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, balanceInt, null, null, '', true, 0, 0, invoiceNumber, resBalance, req.validUser.name]);

          // SEND LOG
          infoLog(topupLogger, 'Payment was successfully added and invoice number was successfully generated', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

          return res.render('notificationSuccessWithBalance', {
            layout: 'layouts/main-layout',
            title: 'Top-Up Success',
            message: 'Card Top-Up succeed.',
            data: cardUpdated.rows[0],
            invoiceNumber: invoiceNumber,
          });
        } catch (error) {
          errorLog(topupLogger, error, 'Error in HTTP POST / when calling paymentQueries.addPayment');
          return res.status(500).json('Server Error');
        }
      } catch (error) {
        errorLog(topupLogger, error, 'Error in HTTP POST / when calling cardQueries.updateBalance');
        return res.status(500).json('Server Error');
      }
    } catch (error) {
      errorLog(topupLogger, error, 'Error in HTTP POST / when calling paymentQueries.getPaymentByCustomerIdAndSort');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(topupLogger, error, 'Error in HTTP POST / when calling cardQueries.getCardByID');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
