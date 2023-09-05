const express = require('express');
const router = express.Router();
const pool = require('../db');
const cardQueries = require('../database/cards/queries');
const verifyToken = require('./middlewares/verifyToken');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cardLogger } = require('../config/logger/childLogger');
const { cashierAndDeveloper, allRoles } = require('./middlewares/userRole');
const { convertTZ } = require('./functions/convertDateTimezone');
const { convertTimeHour } = require('./functions/convertTimeString');
const fastcsv = require('fast-csv');
const fs = require('fs');

// GET ALL CARDS
router.get('/list', verifyToken, allRoles, async (req, res) => {
  try {
    const cards = await pool.query(cardQueries.getCards, []);

    let debtBalance = 0;
    let debtDeposit = 0;

    cards.rows.forEach((result) => {
      debtBalance += result.balance;
      debtDeposit += result.deposit;
      result.updated_at = convertTZ(result.updated_at, 'Asia/Jakarta');
    });

    let debtTotal = debtBalance + debtDeposit;

    return res.render('card', {
      layout: 'layouts/main-layout',
      title: 'Card List',
      data: cards.rows,
      debtBalance,
      debtDeposit,
      debtTotal,
    });
  } catch (error) {
    errorLog(cardLogger, error, 'Error in HTTP GET /list when calling cardQueries.getCards');
  }
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

// BALANCE CHECK
router.get('/search', verifyToken, allRoles, (req, res) => {
  const { card: barcode } = req.query;

  // INITIAL PAGE
  if (!barcode) {
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Balance Check',
      alert: '',
    });
  } else {
    // SEARCH FOR CARD
    pool.query(cardQueries.getCardById, [barcode], (error, results) => {
      if (error) {
        errorLog(topupLogger, error, 'Error in HTTP GET /search when calling cardQueries.getCardById');
        return res.status(500).json('Server Error');
      }
      if (!results.rows.length) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Balance Check',
          alert: 'Card does not exist',
        });
      } else if (!results.rows[0].is_active) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Balance Check',
          alert: 'Card is NOT ACTIVE',
        });
      } else {
        return res.render('balanceCheck', {
          layout: 'layouts/main-layout',
          title: 'Card',
          subtitle: 'Balance Check',
          alert: '',
          data: results.rows[0],
        });
      }
    });
  }
});

// DOWNLOAD
router.post('/download', async (req, res) => {
  const { archiveFrom, archiveTo } = req.body;
  // console.log('hitted');

  // ARCHIVEFROM PROCCESSING
  const archiveFromArr = archiveFrom.split('');

  const archiveFromTemplate1 = archiveFromArr.slice(0, 11).join('');
  const archiveFromTemplate2 = archiveFromArr.slice(13, 16).join('');

  const archiveFromGmtString = convertTimeHour(archiveFrom);

  const dateFromString = archiveFromTemplate1 + archiveFromGmtString + archiveFromTemplate2;

  // ARCHIVETO PROCESSING
  const archiveToArr = archiveTo.split('');
  const archiveToTemplate1 = archiveToArr.slice(0, 11).join('');
  const archiveToTemplate2 = archiveToArr.slice(13, 16).join('');

  const archiveToGmtString = convertTimeHour(archiveTo);

  const dateToString = archiveToTemplate1 + archiveToGmtString + archiveToTemplate2;

  try {
    // console.log(dateFromString);
    // console.log(dateToString);
    const dateFrom = new Date(dateFromString);
    const dateTo = new Date(dateToString);
    // console.log(dateFrom);
    // console.log(dateTo);

    const cards = await pool.query(`SELECT * FROM cards WHERE updated_at >= $1 AND updated_at <= $2`, [dateFrom, dateTo]);
    // console.log(cards.rows);

    cards.rows.forEach((card) => {
      const createdDate = convertTZ(card.created_at, 'Asia/Jakarta');
      const updatedDate = convertTZ(card.updated_at, 'Asia/Jakarta');

      card.created_at = createdDate.toLocaleString();
      card.updated_at = updatedDate.toLocaleString();
    });

    const ws = fs.createWriteStream('./public/files/cards_from_yyyy-mm-dd_to_yyyy-mm-dd.csv');

    fastcsv
      .write(cards.rows, { headers: true })
      .on('finish', function () {
        return res.redirect('/public/files/cards_from_yyyy-mm-dd_to_yyyy-mm-dd.csv');
      })
      .pipe(ws);
  } catch (error) {
    return res.status(500).json('server error');
  }
});

module.exports = router;
