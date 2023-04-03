const express = require('express');
const router = express.Router();
const queries = require('../database/cards/queries');
const pool = require('../db');
const verifyToken = require('./middlewares/verifyToken');
const cardlogs = require('../database/cardlogs/queries');
const { v4 } = require('uuid');

// Status MENU
router.get('/search', verifyToken, (req, res) => {
  const { card: barcode } = req.query;

  if (!barcode) {
    res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Check-Out Status',
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
          subtitle: 'Check-Out Status',
          alert: 'Card does not exists',
        });
      } else {
        res.render('checkout', {
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
router.post('/', verifyToken, (req, res) => {
  const { barcode } = req.body;

  // SEARCH FOR CARD
  pool.query(queries.getCardById, [barcode], (error, results) => {
    if (error) return console.log(error);

    // IF CARD IS ALREADY CHECK-OUT
    if (results.rows[0].dine_in === false) {
      res.render('checkout', {
        layout: 'layouts/main-layout',
        title: 'Check-Out Status',
        alert: 'Card is already check-out',
        data: results.rows[0],
      });
    } else {
      // IF CARD NOT CHECK-OUT YET
      pool.query(queries.cardStatus, [false, '', '', 0, barcode], (error, cardCheckoutResults) => {
        if (error) return console.log(error);

        // ADD A CARD LOG
        const id = v4();
        pool.query(cardlogs.addCardlog, [id, barcode, results.rows[0].customer_name, results.rows[0].customer_id, 'Check-out', req.validUser.name], (error, addCardlogResults) => {
          if (error) return console.log(error);

          res.render('notificationSuccess', {
            layout: 'layouts/main-layout',
            title: 'Check-Out',
            message: 'Card has been checked out successfully.',
          });
        });
      });
    }
  });
});

module.exports = router;
