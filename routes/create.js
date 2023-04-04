const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const { v4 } = require('uuid');
const verifyToken = require('./middlewares/verifyToken');
const { createLogger } = require('../config/logger/childLogger');
const { infoLog, errorLog } = require('../config/logger/functions');

// CREATE MENU
router.get('/search', verifyToken, (req, res) => {
  const barcode = req.query.card;

  if (!barcode) {
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Create a Card',
      alert: '',
    });
  } else {
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) {
        errorLog(createLogger, error, 'Error in HTTP GET /search when calling queries.getCardById');
        return res.status(500).json('Server Error');
      }
      if (results.rows.length) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Create a Card',
          alert: 'Card is already added',
        });
      } else {
        return res.render('createCard', {
          layout: 'layouts/main-layout',
          title: 'Create Card',
          data: barcode,
        });
      }
    });
  }
});

//ADD CARD
router.post('/', verifyToken, (req, res) => {
  const id = v4();
  const { barcode } = req.body;
  const balance = 0;
  const customer_name = '';
  const customer_id = '';
  const is_member = false;
  const is_active = true;
  const dine_in = false;

  pool.query(queries.addCard, [id, barcode, balance, customer_name, customer_id, is_member, is_active, dine_in], (error, results) => {
    if (error) {
      errorLog(createLogger, error, 'Error in HTTP POST / when calling queries.addCard');
      return res.status(500).json('Server Error');
    }

    // SEND LOG
    infoLog(createLogger, 'Card was successfully created', barcode, customer_name, customer_id, req.validUser.name);

    // RESPONSE
    return res.render('notificationSuccess', {
      layout: 'layouts/main-layout',
      title: 'Notification',
      message: 'Card has been added successfully',
      data: results.rows[0],
    });
  });
});

module.exports = router;
