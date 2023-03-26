const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const { v4 } = require('uuid');

// CREATE MENU
router.get('/search', (req, res) => {
  const barcode = req.query.card;

  if (!barcode) {
    res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Create a Card',
      alert: '',
    });
  } else {
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) return console.log(error);
      if (results.rows.length) {
        res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Create a Card',
          alert: 'Card is already added',
        });
      } else {
        res.render('createCard', {
          layout: 'layouts/main-layout',
          title: 'Create Card',
          data: barcode,
        });
      }
    });
  }
});

//ADD CARD
router.post('/', (req, res) => {
  const id = v4();
  const { barcode } = req.body;
  const balance = 0;
  const customer_name = '';
  const is_member = false;
  const is_active = true;
  const dine_in = false;

  pool.query(queries.addCard, [id, barcode, balance, customer_name, is_member, is_active, dine_in], (error, results) => {
    if (error) return console.log(error);
    res.render('notificationSuccess', {
      layout: 'layouts/main-layout',
      title: 'Notification',
      message: 'Card has been added successfully',
      data: results.rows[0],
    });
  });
});

module.exports = router;
