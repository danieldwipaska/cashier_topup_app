const express = require('express');
const { checkoutLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const router = express.Router();
const queries = require('../database/cards/queries');
const pool = require('../db');
const { cashierAndDeveloper } = require('./middlewares/userRole');
const verifyToken = require('./middlewares/verifyToken');

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
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) {
        errorLog(checkoutLogger, error, 'Error in HTTP GET /search when calling queries.getCardById');
        return res.status(500).json('Server Error');
      }

      if (results.rows.length === 0) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Check-Out Status',
          alert: 'Card does not exists',
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
router.post('/', verifyToken, cashierAndDeveloper, (req, res) => {
  const { barcode } = req.body;

  // SEARCH FOR CARD
  pool.query(queries.getCardById, [barcode], (error, results) => {
    if (error) {
      errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling queries.getCardById');
      return res.status(500).json('Server Error');
    }

    if (!results.rows.length) {
      // IF CARD DOES NOT EXIST
      return res.status(404).json('Card does not exist');
    } else if (results.rows[0].dine_in === false) {
      // IF CARD IS ALREADY CHECKOUT
      return res.render('checkout', {
        layout: 'layouts/main-layout',
        title: 'Check-Out Status',
        alert: 'Card is already check-out',
        data: results.rows[0],
      });
    } else {
      // UPDATE CARD
      pool.query(queries.cardStatus, [false, '', '', 0, results.rows[0].barcode], (error, cardCheckoutResults) => {
        if (error) {
          errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling queries.cardStatus');
          return res.status(500).json('Server Error');
        }

        infoLog(checkoutLogger, 'dine-in was successfully updated into false', results.rows[0].barcode, results.rows[0].customer_name, results.rows[0].customer_id, req.validUser.name);

        return res.render('notificationSuccess', {
          layout: 'layouts/main-layout',
          title: 'Check-Out',
          message: 'Card has been checked out successfully.',
        });
      });
    }
  });
});

module.exports = router;
