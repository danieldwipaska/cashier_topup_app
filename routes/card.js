const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');

// GET ALL CARDS
router.get('/list', (req, res) => {
  pool.query(queries.getCards, [], (error, getCardsResults) => {
    if (error) return console.log(error);

    res.render('card', {
      layout: 'layouts/main-layout',
      title: 'Card List',
      data: getCardsResults.rows,
    });
  });
});

module.exports = router;
