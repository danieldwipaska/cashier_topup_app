const express = require('express');
const router = express.Router();
const pool = require('../db');
const cardQueries = require('../database/cards/queries');
const verifyToken = require('./middlewares/verifyToken');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cardLogger } = require('../config/logger/childLogger');
const { cashierAndDeveloper } = require('./middlewares/userRole');

// GET ALL CARDS
router.get('/list', verifyToken, cashierAndDeveloper, (req, res) => {
  pool.query(cardQueries.getCards, [], (error, getCardsResults) => {
    if (error) {
      errorLog(cardLogger, error, 'Error in HTTP GET /list when calling cardQueries.getCards');
    }

    let debtBalance = 0;
    let debtDeposit = 0;

    getCardsResults.rows.forEach((result) => {
      debtBalance += result.balance;
      debtDeposit += result.deposit;
    });

    let debtTotal = debtBalance + debtDeposit;

    return res.render('card', {
      layout: 'layouts/main-layout',
      title: 'Card List',
      data: getCardsResults.rows,
      debtBalance,
      debtDeposit,
      debtTotal,
    });
  });
});

// DELETE CARD
router.get('/:id/delete', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { id } = req.params;

  // GET CARD
  try {
    const cards = await pool.query(cardQueries.getCardByCardId, [id]);

    if (!cards.rows.length) return res.status(404).json('Card not found');

    // DELETE CARD
    try {
      await pool.query(cardQueries.deleteCardById, [cards.rows[0].id]);

      // SEND LOG
      infoLog(cardLogger, 'Card was successfully deleted', '', '', '', req.validUser.name);

      return res.redirect('/card/list');
    } catch (error) {
      errorLog(cardLogger, error, 'Error in HTTP GET /:id/delete when calling cardQueries.deleteCardById');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(memberLogger, error, 'Error in HTTP GET /:id/delete when calling cardQueries.getCardByCardId');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
