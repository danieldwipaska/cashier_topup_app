const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const verifyToken = require('./middlewares/verifyToken');

// SEARCH
router.get('/search', verifyToken, (req, res) => {
  const { card: barcode } = req.query;

  // INITIAL PAGE
  if (!barcode) {
    res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Top-Up',
      alert: '',
    });
  } else {
    // SEARCH FOR CARD
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) return console.log(error);
      if (results.rows.length === 0) {
        res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Top-Up',
          alert: 'Card does not exist',
        });
      } else {
        res.render('topup', {
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
router.post('/', verifyToken, (req, res) => {
  const { barcode, addBalance } = req.body;
  let balanceInt = parseInt(addBalance, 10);

  // SEARCH FOR CARD
  pool.query(queries.getCardById, [barcode], (error, results) => {
    if (error) return console.log(error);

    // CHECK WHETHER CUSTOMER IS ACTIVE AND DINE-IN
    if (!results.rows[0].is_active) {
      res.render('topup', {
        layout: 'layouts/main-layout',
        title: 'Top-Up',
        alert: 'Card is NOT ACTIVE.\nPlease activate the card first',
        data: results.rows[0],
      });
    } else if (!results.rows[0].dine_in) {
      res.render('topup', {
        layout: 'layouts/main-layout',
        title: 'Top-Up',
        alert: 'Card has NOT CHECKED IN yet. Only person who is dine-in can do Top-Up.',
        data: results.rows[0],
      });
    } else {
      // ADD NEW BALANCE
      balanceInt += results.rows[0].balance;
      pool.query(queries.updateBalance, [balanceInt, barcode], (error, updateResults) => {
        if (error) return console.log(error);

        res.render('notificationSuccessWithBalance', {
          layout: 'layouts/main-layout',
          title: 'Top-Up Success',
          message: 'Card Top-Up succeed.',
          data: updateResults.rows[0],
        });
      });
    }
  });
});

module.exports = router;
