const express = require('express');
const router = express.Router();
const queries = require('../database/cards/queries');
const pool = require('../db');
const verifyToken = require('./middlewares/verifyToken');

// Status MENU
router.get('/search', verifyToken, (req, res) => {
  const { card: barcode } = req.query;

  if (!barcode) {
    res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Check-In Status',
      alert: '',
    });
  } else {
    //SEARCH FOR CARD
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) return console.log(error);
      if (results.rows.length === 0) {
        res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Check-In Status',
          alert: 'Card does not exists',
        });
      } else {
        res.render('checkin', {
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
router.post('/', verifyToken, (req, res) => {
  const { barcode, name: customer_name, balance } = req.body;

  // SEARCH FOR CARD
  pool.query(queries.getCardById, [barcode], (error, results) => {
    if (error) return console.log(error);

    if (results.rows[0].is_active === false) {
      // IF CARD IS NOT ACTIVE
      res.render('checkin', {
        layout: 'layouts/main-layout',
        title: 'Check-In Status',
        alert: 'Card is NOT ACTIVE.\nPlease activate the card first',
        data: results.rows[0],
      });
    } else if (results.rows[0].dine_in === true) {
      // IF CARD IS ALREADY CHECK-IN
      res.render('checkin', {
        layout: 'layouts/main-layout',
        title: 'Check-In Status',
        alert: 'Card is already check-in',
        data: results.rows[0],
      });
    } else {
      // UPDATE DINE-IN STATUS
      pool.query(queries.cardStatus, [true, customer_name, balance, barcode], (error, results) => {
        if (error) return console.log(error);
        res.render('notificationSuccess', {
          layout: 'layouts/main-layout',
          title: 'Check-in',
          message: 'Card has been checked in successfully.',
        });
      });
    }
  });
});

module.exports = router;
