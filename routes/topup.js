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
      if (!results.rows.length) {
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
  const { barcode, addBalance, deposit, customerName: customer_name, customerId: customer_id } = req.body;

  const addBalanceInt = parseInt(addBalance, 10);
  let depositInt = parseInt(deposit, 10);

  const invoice_number = v4();
  const invoice_status = 'paid';
  const served_by = 'Greeter';
  const collected_by = req.validUser.name;

  try {
    // CHECK WHETHER THE CARD EXISTS OR NOT
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

    if (cards.rows[0].customer_id && cards.rows[0].customer_id !== customer_id) return res.status(401).json('The Customer ID of The Card and of The Invoice do not match');

    try {
      // IF ADD-BALANCE LESS THAN DEPOSIT
      if (addBalanceInt < depositInt) return res.status(401).json('Add-Balance should not be less than deposit, or should not be 0');

      try {
        // ADD NEW BALANCE
        let resBalance = cards.rows[0].balance;

        if (depositInt === 0) {
          // If Customer has depositted
          resBalance += addBalanceInt;
          depositInt = cards.rows[0].deposit;
        } else {
          // if Not
          resBalance += addBalanceInt - depositInt;
        }

        const cardUpdated = await pool.query(cardQueries.cardStatus, [true, customer_name, customer_id, resBalance, depositInt, barcode]);

        // SEND LOG
        infoLog(topupLogger, 'Balance was successfully updated', cardUpdated.rows[0].barcode, cardUpdated.rows[0].customer_name, cardUpdated.rows[0].customer_id, req.validUser.name);

        try {
          // CREATE INVOICE
          const id = v4();
          const action = 'topup';
          const payment = addBalanceInt;
          const initial_balance = cards.rows[0].balance;
          const final_balance = resBalance;

          await pool.query(paymentQueries.addPayment, [id, action, barcode, customer_name, customer_id, payment, invoice_number, invoice_status, initial_balance, final_balance, served_by, collected_by]);

          // SEND LOG
          infoLog(topupLogger, 'Payment was successfully added and invoice number was successfully generated', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

          return res.render('notificationSuccessWithBalance', {
            layout: 'layouts/main-layout',
            title: 'Top-Up Success',
            message: 'Card Top-Up succeed.',
            data: cardUpdated.rows[0],
            invoiceNumber: invoice_number,
            isTopup: true,
          });
        } catch (error) {
          errorLog(topupLogger, error, 'Error in HTTP POST / when calling paymentQueries.addPayment');
          return res.status(500).json('Server Error');
        }
      } catch (error) {
        errorLog(topupLogger, error, 'Error in HTTP POST / when calling cardQueries.cardStatus');
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
