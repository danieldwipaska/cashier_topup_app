const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const payments = require('../database/payments/queries');
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
router.post('/', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { barcode, name: customer_name, addBalance, deposit } = req.body;

  try {
    const balanceInt = parseInt(addBalance, 10);
    const depositInt = parseInt(deposit, 10);

    const cards = await pool.query(queries.getCardById, [barcode]);

    if (!cards.rows.length) return res.status(404).json('Card does not exist');

    if (!cards.rows[0].is_active)
      return res.render('topup', {
        layout: 'layouts/main-layout',
        title: 'Top-Up',
        alert: 'Card is NOT ACTIVE.\nPlease activate the card first',
        data: results.rows[0],
      });

    // FOR NEW CARD
    if (!cards.rows[0].dine_in) {
      try {
        const customer_id = v4();
        // UPDATE DINE-IN STATUS
        await pool.query(queries.cardStatus, [true, customer_name, customer_id, 0, 0, barcode]);

        // SEND LOG
        infoLog(topupLogger, 'dine-in status was successfully updated into true', barcode, customer_name, customer_id, req.validUser.name);

        try {
          // ADD NEW BALANCE
          const resBalance = balanceInt + cards.rows[0].balance - depositInt;

          const cardUpdated = await pool.query(queries.updateBalance, [resBalance, depositInt, barcode]);

          // SEND LOG
          infoLog(topupLogger, 'Balance was successfully updated', cardUpdated.rows[0].barcode, cardUpdated.rows[0].customer_name, cardUpdated.rows[0].customer_id, req.validUser.name);

          try {
            const id = v4();
            const invoiceNumber = v4();
            const sort = 'topup';

            await pool.query(payments.addPayment, [id, sort, barcode, customer_name, customer_id, balanceInt, null, null, '', true, 0, 0, invoiceNumber, resBalance, req.validUser.name]);

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
            errorLog(topupLogger, error, 'Error in HTTP POST / when calling payments.addPayment');
            return res.status(500).json('Server Error');
          }
        } catch (error) {
          errorLog(topupLogger, error, 'Error in HTTP POST / when calling queries.updateBalance');
          return res.status(500).json('Server Error');
        }
      } catch (error) {
        errorLog(topupLogger, error, 'Error in HTTP POST / when calling queries.cardStatus');
        return res.status(500).json('Server Error');
      }
    }

    try {
      // FOR USED CARDS
      // ADD NEW BALANCE
      const resBalance = balanceInt + cards.rows[0].balance;

      const cardUpdated = await pool.query(queries.updateBalance, [resBalance, depositInt, barcode]);

      // SEND LOG
      infoLog(topupLogger, 'Balance was successfully updated', cardUpdated.rows[0].barcode, cardUpdated.rows[0].customer_name, cardUpdated.rows[0].customer_id, req.validUser.name);

      try {
        // CREATE INVOICE
        const id = v4();
        const invoiceNumber = v4();
        const sort = 'topup';

        await pool.query(payments.addPayment, [id, sort, cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, balanceInt, null, null, '', true, 0, 0, invoiceNumber, resBalance, req.validUser.name]);

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
        errorLog(topupLogger, error, 'Error in HTTP POST / when calling payments.addPayment');
        return res.status(500).json('Server Error');
      }
    } catch (error) {
      errorLog(topupLogger, error, 'Error in HTTP POST / when calling queries.updateBalance');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(topupLogger, error, 'Error in HTTP POST / when calling queries.getCardByID');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
