const express = require('express');
const verifyToken = require('./middlewares/verifyToken');
const { allRoles } = require('./middlewares/userRole');
const { paymentLogger } = require('../config/logger/childLogger');
const { errorLog } = require('../config/logger/functions');
const router = express.Router();
const paymentQueries = require('../database/payments/queries');
const cardQueries = require('../database/cards/queries');
const pool = require('../db');
const { postWAReceiptSend, postWANotifSend } = require('./api/openWA');

router.get('/receipt/:id/whatsapp', verifyToken, allRoles, async (req, res) => {
  const { id } = req.params;
  const { number } = req.query;

  try {
    const payments = await pool.query(paymentQueries.getPaymentById, [id]);

    if (!payments.rows.length)
      return res.status(404).json({
        response: {
          status: 404,
          message: 'Not Found',
          url: req.originalUrl,
        },
        data: {},
      });

    payments.rows[0].number = number;

    if (payments.rows[0].action === 'topup' || payments.rows[0].action === 'pay' || payments.rows[0].action === 'checkout') {
      if (payments.rows[0].invoice_status === 'paid') {
        postWAReceiptSend(payments.rows[0]);
        return res.status(200).json({
          response: {
            status: 200,
            message: 'OK',
            url: req.originalUrl,
          },
          data: {
            message: 'Receipt sent via WhatsApp',
          },
        });
      }
    }

    return res.status(400).json({
      response: {
        status: 400,
        message: 'Bad Request',
        url: req.originalUrl,
      },
      data: {},
    });
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP GET /receipt/:id/whatsapp when calling pool.query');
    return res.status(500).json('Server Error');
  }
});

router.get('/notification/:id/whatsapp', verifyToken, allRoles, async (req, res) => {
  const { id } = req.params;
  const { number } = req.query;

  try {
    const cards = await pool.query(cardQueries.getCardByCardId, [id]);

    if (!cards.rows.length)
      return res.status(404).json({
        response: {
          status: 404,
          message: 'Not Found',
          url: req.originalUrl,
        },
        data: {},
      });

    cards.rows[0].number = number;

    postWANotifSend(cards.rows[0]);

    return res.status(200).json({
      response: {
        status: 200,
        message: 'OK',
        url: req.originalUrl,
      },
      data: {
        message: 'Receipt sent via WhatsApp',
      },
    });
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP GET /receipt/:id/whatsapp when calling pool.query');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
