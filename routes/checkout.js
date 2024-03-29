const express = require('express');
const { v4 } = require('uuid');
const { checkoutLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const router = express.Router();
const cardQueries = require('../database/cards/queries');
const paymentQueries = require('../database/payments/queries');
const memberQueries = require('../database/members/queries');
const pool = require('../db');
const { cashierAndDeveloper } = require('./middlewares/userRole');
const verifyToken = require('./middlewares/verifyToken');
const { convertTZ } = require('./functions/convertDateTimezone');
const { CARD_UPDATE_FAILED, CARD_UPDATE_SUCCESS } = require('./var/reports');

// Status MENU
router.get('/search', verifyToken, cashierAndDeveloper, (req, res) => {
  const { card: barcode } = req.query;

  if (!barcode) {
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Check-Out Status',
      alert: '',
    });
  } else {
    //SEARCH FOR CARD
    pool.query(cardQueries.getCardById, [barcode], (error, results) => {
      if (error) {
        errorLog(checkoutLogger, error, 'Error in HTTP GET /search when calling cardQueries.getCardById');
        return res.status(500).json('Server Error');
      }

      if (results.rows.length === 0) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Check-Out Status',
          alert: 'Card does not exists',
        });
      } else if (!results.rows[0].is_active) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Check-Out Status',
          alert: 'Card is NOT ACTIVE.',
        });
      } else if (results.rows[0].is_member) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Check-Out Status',
          alert: 'Card is a MEMBER CARD. Member Cards cannot be checked out. Please use Abort Member to check-out.',
        });
      } else {
        return res.render('checkout', {
          layout: 'layouts/main-layout',
          title: 'Check-Out Status',
          data: results.rows[0],
          alert: '',
        });
      }
    });
  }
});

// CHECK-OUT
router.post('/', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { barcode, customerName: customer_name, customerId: customer_id, paymentMethod: payment_method, notes } = req.body;

  const served_by = 'Greeter';
  const collected_by = req.validUser.name;

  // SEARCH FOR CARD
  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);

    if (!cards.rows.length) {
      // IF CARD DOES NOT EXIST
      return res.status(404).json('Card does not exist');
    } else if (cards.rows[0].is_active === false) {
      // IF CARD IS ALREADY CHECKOUT
      return res.render('checkout', {
        layout: 'layouts/main-layout',
        title: 'Check-Out Status',
        alert: 'Card is NOT ACTIVE yet',
        data: cards.rows[0],
      });
    } else {
      const initial_balance = cards.rows[0].balance;
      const final_balance = 0;

      // UPDATE CARD
      try {
        const cardUpdated = await pool.query(cardQueries.cardStatus, [false, null, null, 0, 0, cards.rows[0].barcode]);

        infoLog(checkoutLogger, 'Card is_active was successfully updated into false', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

        try {
          // ADD PAYMENT
          const id = v4();
          const action = 'checkout';
          const payment = cards.rows[0].balance + cards.rows[0].deposit;
          const invoice_number = `CHE${Date.now()}`;
          const invoice_status = 'paid';
          const menu_names = []; // NO MENU
          const menu_amount = []; // NO MENU
          const menu_prices = []; // NO MENU
          const menu_kinds = []; // NO MENU
          const menu_discounts = []; // NO MENU
          const menu_discount_percents = []; // NO MENU

          const payments = await pool.query(paymentQueries.addPayment, [
            id,
            action,
            barcode,
            customer_name,
            customer_id,
            payment,
            invoice_number,
            invoice_status,
            initial_balance,
            final_balance,
            served_by,
            collected_by,
            payment_method,
            notes,
            menu_names,
            menu_amount,
            menu_prices,
            menu_kinds,
            menu_discounts,
            menu_discount_percents,
          ]);

          // SEND LOG
          infoLog(checkoutLogger, 'Payment was successfully added and invoice number was successfully generated', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

          return res.render('notificationSuccessWithBalance', {
            layout: 'layouts/main-layout',
            title: 'Check-Out Success',
            message: 'Card has been checked out successfully.',
            data: cardUpdated.rows[0],
            invoiceNumber: invoice_number,
            status: 'topup',
            payment: payments.rows[0],
          });
        } catch (error) {
          errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling paymentQueries.addPayment');
          return res.render('notificationErrorWithProgress', {
            layout: 'layouts/main-layout',
            title: 'Top-Up Error',
            message: 'Please do these steps: (1) Top-up the card with the same balance as the checkout; (2) Try to checkout the card again.',
            success: [CARD_UPDATE_SUCCESS],
            failed: [PAYMENT_REPORT_FAILED],
          });
        }
      } catch (error) {
        errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling cardQueries.cardStatus');
        return res.render('notificationErrorWithProgress', {
          layout: 'layouts/main-layout',
          title: 'Checkout Error',
          message: 'Please screenshot this error and send it to the developer.',
          success: [],
          failed: [CARD_UPDATE_FAILED, PAYMENT_REPORT_FAILED],
        });
      }
    }
  } catch (error) {
    errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
