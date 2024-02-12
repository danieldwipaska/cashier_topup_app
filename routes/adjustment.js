const express = require('express');
const verifyToken = require('./middlewares/verifyToken');
const router = express.Router();
const pool = require('../db');
const cardQueries = require('../database/cards/queries');
const memberQueries = require('../database/members/queries');
const paymentQueries = require('../database/payments/queries');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cashierAndDeveloper, allRoles, developerOnly } = require('./middlewares/userRole');
const { v4 } = require('uuid');
const { transferLogger } = require('../config/logger/childLogger');

router.get('/search', verifyToken, developerOnly, async (req, res) => {
  const { card: barcode } = req.query;
  if (!barcode)
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Balance Adjustment',
      subtitle: 'Balance Adjustment',
      alert: '',
    });

  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);
    if (!cards.rows.length)
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Balance Adjustment',
        subtitle: 'Balance Adjustment',
        alert: 'Card does not exist',
      });

    if (!cards.rows[0].is_active)
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Balance Adjustment',
        subtitle: 'Balance Adjustment',
        alert: 'Card is NOT ACTIVE.',
      });

    if (!cards.rows[0].customer_id)
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Balance Adjustment',
        subtitle: 'Balance Adjustment',
        alert: 'Card does not belong to anyone. Only a card that belongs to a customer can be transferred',
      });

    return res.render('adjustment', {
      layout: 'layouts/main-layout',
      title: 'Balance Adjustment',
      subtitle: 'Balance Adjustment',
      alert: '',
      data: cards.rows[0],
    });
  } catch (error) {
    errorLog(transferLogger, error, 'Error in GET /search when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }
});

// BALANCE ADJUSTMENT
router.post('/', verifyToken, developerOnly, async (req, res) => {
  const { barcode, adjustedBalance, notes } = req.body;

  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);
    if (!cards.rows.length) return res.status(404).json('Card does not exist');

    try {
      const cardUpdated = await pool.query(cardQueries.updateBalance, [adjustedBalance, cards.rows[0].deposit, cards.rows[0].barcode]);

      infoLog(transferLogger, 'Balance adjusted successfully', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

      try {
        const id = v4();
        const invoice_number = `ADJ${Date.now()}`;
        const action = 'adjustment';
        const servedBy = 'Greeter';
        const collectedBy = 'Kasir Bahari';
        const payment_method = 'None';
        const invoiceStatus = 'paid';
        await pool.query(paymentQueries.addPayment, [
          id,
          action,
          cards.rows[0].barcode,
          cards.rows[0].customer_name,
          cards.rows[0].customer_id,
          adjustedBalance - cards.rows[0].balance,
          invoice_number,
          invoiceStatus,
          cards.rows[0].balance,
          adjustedBalance,
          servedBy,
          collectedBy,
          payment_method,
          notes,
          cards.rows[0].menu_names,
          cards.rows[0].menu_amount,
          cards.rows[0].menu_prices,
          cards.rows[0].menu_kinds,
          cards.rows[0].menu_discounts,
          cards.rows[0].menu_discount_percents,
        ]);

        return res.render('notificationSuccessWithBalance', {
          layout: 'layouts/main-layout',
          title: 'Adjustment Success',
          message: 'Card Adjustment succeed.',
          data: cardUpdated.rows[0],
          invoiceNumber: invoice_number,
          isTopup: false,
        });
      } catch (error) {
        errorLog(transferLogger, error, 'Error in POST / when calling paymentQueries.addPayment');
        return res.status(500).json('Server Error');
      }
    } catch (error) {
      errorLog(transferLogger, error, 'Error in POST / when calling cardQueries.updateBalance');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(transferLogger, error, 'Error in POST / when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
