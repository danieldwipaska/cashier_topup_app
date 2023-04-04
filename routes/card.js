const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const verifyToken = require('./middlewares/verifyToken');
const { errorLog } = require('../config/logger/functions');
const { cardLogger } = require('../config/logger/childLogger');

// GET ALL CARDS
router.get('/list', verifyToken, (req, res) => {
  pool.query(queries.getCards, [], (error, getCardsResults) => {
    if (error) {
      errorLog(cardLogger, error, 'Error in HTTP GET /list when calling queries.getCards');
    }

    return res.render('card', {
      layout: 'layouts/main-layout',
      title: 'Card List',
      data: getCardsResults.rows,
    });
  });
});

module.exports = router;
