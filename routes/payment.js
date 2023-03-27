const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');

// SEARCH
router.get('/search', (req, res) => {
  const { card: barcode } = req.query;

  // INITIAL PAGE
  if (!barcode) {
    res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Payment',
      alert: '',
    });
  } else {
    // SEARCH FOR CARD
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) console.log(error);
      if (results.rows.length === 0) {
        res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Payment',
          alert: 'Card does not exist',
        });
      } else {
        res.render('payment', {
          layout: 'layouts/main-layout',
          title: 'Top-Up',
          subtitle: 'Payment',
          alert: '',
          data: results.rows[0],
        });
      }
    });
  }
});

// TOP-UP
router.post('/', (req, res) => {
  const { barcode, payment } = req.body;
  let paymentInt = parseInt(payment, 10);

  // SEARCH FOR CARD
  pool.query(queries.getCardById, [barcode], (error, results) => {
    if (error) console.log(error);

    // CHECK WHETHER CUSTOMER IS ACTIVE AND DINE-IN
    if (!results.rows[0].is_active) {
      res.render('payment', {
        layout: 'layouts/main-layout',
        title: 'Payment',
        alert: 'Card is NOT ACTIVE.\nPlease activate the card first',
        data: results.rows[0],
      });
    } else if (!results.rows[0].dine_in) {
      res.render('payment', {
        layout: 'layouts/main-layout',
        title: 'Payment',
        alert: 'Card has NOT CHECKED IN yet. Only person who is dine-in can do Top-Up.',
        data: results.rows[0],
      });
    } else {
      // ADD NEW BALANCE
      paymentInt = results.rows[0].balance - paymentInt;

      // IF BALANCE IS NOT ENOUGH
      if (paymentInt < 0) {
        res.render('payment', {
          layout: 'layouts/main-layout',
          title: 'Payment',
          alert: 'Card does NOT have ENOUGH BALANCE to pay. Please Top-Up your balance first.',
          data: results.rows[0],
        });
      } else {
        pool.query(queries.updateBalance, [paymentInt, barcode], (error, updateResults) => {
          if (error) console.log(error);

          res.render('notificationSuccessWithBalance', {
            layout: 'layouts/main-layout',
            title: 'Payment Success',
            message: 'Payment succeed.',
            data: results.rows[0],
            balance: paymentInt,
          });
        });
      }
    }
  });
});

module.exports = router;
