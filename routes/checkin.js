const express = require('express');
const router = express.Router();
const queries = require('../database/cards/queries');
const pool = require('../db');
const verifyToken = require('./middlewares/verifyToken');
const { v4 } = require('uuid');
const { errorLog, infoLog } = require('../config/logger/functions');
const { checkinLogger } = require('../config/logger/childLogger');
const { cashierAndDeveloper } = require('./middlewares/userRole');

// Status MENU
router.get('/search', verifyToken, cashierAndDeveloper, (req, res) => {
  const { card: barcode } = req.query;

  if (!barcode) {
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Check-In Status',
      alert: '',
    });
  } else {
    //SEARCH FOR CARD
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) {
        errorLog(checkinLogger, error, 'Error in HTTP GET /search when calling queries.getCardById');
        return res.status(500).json('Server Error');
      }

      if (results.rows.length === 0) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Check-In Status',
          alert: 'Card does not exists',
        });
      } else {
        return res.render('checkin', {
          layout: 'layouts/main-layout',
          title: 'Check-In Status',
          data: results.rows[0],
          alert: '',
        });
      }
    });
  }
});

// CHECK-IN
router.post('/', verifyToken, cashierAndDeveloper, (req, res) => {
  const { barcode, name: customer_name, balance } = req.body;

  // SEARCH FOR CARD
  pool.query(queries.getCardById, [barcode], (error, results) => {
    if (error) {
      errorLog(checkinLogger, error, 'Error in HTTP POST / when calling queries.getCardById');
      return res.status(500).json('Server Error');
    }

    if (results.rows[0].is_active === false) {
      // IF CARD IS NOT ACTIVE
      return res.render('checkin', {
        layout: 'layouts/main-layout',
        title: 'Check-In Status',
        alert: 'Card is NOT ACTIVE.\nPlease activate the card first',
        data: results.rows[0],
      });
    } else if (results.rows[0].dine_in === true) {
      // IF CARD IS ALREADY CHECK-IN
      return res.render('checkin', {
        layout: 'layouts/main-layout',
        title: 'Check-In Status',
        alert: 'Card is already check-in',
        data: results.rows[0],
      });
    } else {
      const customer_id = v4();
      // UPDATE DINE-IN STATUS
      pool.query(queries.cardStatus, [true, customer_name, customer_id, balance, barcode], (error, cardCheckinResults) => {
        if (error) {
          errorLog(checkinLogger, error, 'Error in HTTP POST / when calling queries.cardStatus');
          return res.status(500).json('Server Error');
        }

        // SEND LOG
        infoLog(checkinLogger, 'dine-in status was successfully updated into true', barcode, customer_name, customer_id, req.validUser.name);

        // RESPONSE
        return res.render('notificationSuccess', {
          layout: 'layouts/main-layout',
          title: 'Check-in',
          message: 'Card has been checked in successfully.',
        });
      });
    }
  });
});

module.exports = router;
