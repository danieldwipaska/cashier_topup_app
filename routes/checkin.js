const express = require('express');
const router = express.Router();
const queries = require('../database/cards/queries');
const pool = require('../db');

// Status MENU
router.get('/search', (req, res) => {
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
router.post('/', (req, res) => {
  const { barcode, name: customer_name } = req.body;

  // SEARCH FOR CARD
  pool.query(queries.getCardById, [barcode], (error, results) => {
    if (error) return console.log(error);
    // IF CARD IS ALREADY CHECK-IN
    if (results.rows[0].dine_in === true) {
      res.render('checkin', {
        layout: 'layouts/main-layout',
        title: 'Dine-in Status',
        alert: 'Card is already check-in',
        data: results.rows[0],
      });
    } else {
      // IF CARD NOT CHECK-IN YET
      pool.query(queries.cardStatus, [true, customer_name, barcode], (error, results) => {
        if (error) return console.log(error);
        res.render('notificationSuccess', {
          layout: 'layouts/main-layout',
          title: 'Check-in',
          message: 'Card has been checked in successfully.',
          data: results.rows[0],
        });
      });
    }
  });
});

module.exports = router;
