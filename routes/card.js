const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const cardlogs = require('../database/cardlogs/queries');
const verifyToken = require('./middlewares/verifyToken');

// GET ALL CARDS
router.get('/list', verifyToken, (req, res) => {
  pool.query(queries.getCards, [], (error, getCardsResults) => {
    if (error) return console.log(error);

    res.render('card', {
      layout: 'layouts/main-layout',
      title: 'Card List',
      data: getCardsResults.rows,
    });
  });
});

// GET ALL LOGS
router.get('/log', verifyToken, (req, res) => {
  pool.query(cardlogs.getCardlogs, [], (error, getLogsResults) => {
    if (error) return console.log(error);

    res.render('cardlog', {
      layout: 'layouts/main-layout',
      title: 'Card Log',
      alert: '',
      messages: '',
      data: getLogsResults.rows,
    });
  });
});

module.exports = router;
