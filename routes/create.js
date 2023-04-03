const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const { v4 } = require('uuid');
const verifyToken = require('./middlewares/verifyToken');
const cardlogs = require('../database/cardlogs/queries');

// CREATE MENU
router.get('/search', verifyToken, (req, res) => {
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
    if (error) return console.log(error);

    // ADD A CARD LOG
    const cardlogId = v4();
    pool.query(cardlogs.addCardlog, [cardlogId, barcode, results.rows[0].customer_name, results.rows[0].customer_id, 'Create', req.validUser.name], (error, addCardlogResults) => {
      if (error) return console.log(error);

      res.render('notificationSuccess', {
        layout: 'layouts/main-layout',
        title: 'Notification',
        message: 'Card has been added successfully',
        data: results.rows[0],
      });
    });
  });
});

module.exports = router;
