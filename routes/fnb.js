const express = require('express');
const router = express.Router();
const pool = require('../db');
const fnbQueries = require('../database/fnbs/queries');
const stockQueries = require('../database/stocks/queries');
const { v4 } = require('uuid');
const verifyToken = require('./middlewares/verifyToken');
const { fnbLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cashierAndDeveloper } = require('./middlewares/userRole');

// PAGE FOR ADD FNB
router.get('/add', verifyToken, cashierAndDeveloper, async (req, res) => {
  try {
    const stocks = await pool.query(stockQueries.getStocks, []);

    return res.render('addFnb', {
      layout: 'layouts/main-layout',
      title: 'Food and Beverages',
      data: stocks.rows,
    });
  } catch (error) {
    errorLog(fnbLogger, error, 'Error in HTTP GET /add when calling stockQueries.getStocks');
    return res.status(500).json('Server Error');
  }
});

// GET ALL FNB
router.get('/list', verifyToken, cashierAndDeveloper, (req, res) => {
  pool.query(fnbQueries.getFnbs, [], (error, results) => {
    if (error) {
      errorLog(fnbLogger, error, 'Error in HTTP GET /list when calling fnbQueries.getFnbs');
      return res.status(500).json('Server Error');
    }

    return res.render('fnb', {
      layout: 'layouts/main-layout',
      title: 'Food and Beverages',
      alert: '',
      messages: '',
      data: results.rows,
    });
  });
});

// ADD FNB
router.post('/', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { menu, kind, netto, price, rawMat, rawAmount } = req.body;

  try {
    const fnbs = await pool.query(fnbQueries.getFnbByMenu, [menu]);
    if (fnbs.rows.length) return res.status(400).json('Menu does already exist');

    try {
      const rawMatArr = rawMat.split(' ');
      const rawAmountArr = rawAmount.split(' ').map((amount) => parseInt(amount, 10));
      rawMatArr.pop();
      rawAmountArr.pop();

      const id = v4();

      await pool.query(fnbQueries.addFnb, [id, menu, kind, netto, price, rawMatArr, rawAmountArr]);

      // SEND LOG
      infoLog(fnbLogger, 'Fnb was successfully added', '', '', '', req.validUser.name);

      return res.redirect('/fnb/list');
    } catch (error) {
      errorLog(fnbLogger, error, 'Error in HTTP POST / when calling fnbQueries.addFnb');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(fnbLogger, error, 'Error in HTTP POST / when calling fnbQueries.getFnbByMenu');
    return res.status(500).json('Server Error');
  }
});

// UPDATE A FNB
router.post('/:id', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { id } = req.params;
  const { menu, kind, netto, price, rawMat, rawAmount } = req.body;

  try {
    const fnbs = await pool.query(fnbQueries.getFnbById, [id]);
    if (!fnbs.rows.length) return res.status(404).json('Fnb does not exist');

    try {
      const fnbs = await pool.query(fnbQueries.updateFnbById, [menu, kind, netto, price, rawMat, rawAmount, id]);

      // SEND LOG
      infoLog(fnbLogger, 'Fnb was successfully updated', '', '', '', req.validUser.name);

      return res.redirect('/fnb/list');
    } catch (error) {
      errorLog(fnbLogger, error, 'Error in HTTP POST /:id when calling fnbQueries.updateFnbById');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(fnbLogger, error, 'Error in HTTP POST /:id when calling fnbQueries.getFnbById');
    return res.status(500).json('Server Error');
  }
});

// DELETE A FNB
router.get('/:id/delete', verifyToken, cashierAndDeveloper, (req, res) => {
  const { id } = req.params;

  pool.query(fnbQueries.getFnbById, [id], (error, getResults) => {
    if (error) {
      errorLog(fnbLogger, error, 'Error in HTTP GET /:id/delete when calling fnbQueries.getFnbById');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length === 0) {
      pool.query(fnbQueries.getFnbs, [], (error, results) => {
        if (error) {
          errorLog(fnbLogger, error, 'Error in HTTP GET /:id/delete when calling fnbQueries.getFnbs');
          return res.status(500).json('Server Error');
        }

        return res.render('fnb', {
          layout: 'layouts/main-layout',
          title: 'Food and Beverages',
          alert: 'Menu is missing',
          messages: '',
          data: results.rows,
        });
      });
    } else {
      pool.query(fnbQueries.deleteFnbById, [id], (error, deleteResults) => {
        if (error) {
          errorLog(fnbLogger, error, 'Error in HTTP GET /:id/delete when calling fnbQueries.deleteFnbById');
          return res.status(500).json('Server Error');
        }

        // SEND LOG
        infoLog(fnbLogger, 'Fnb was successfully deleted', '', '', '', req.validUser.name);

        return res.redirect('/fnb/list');
      });
    }
  });
});

module.exports = router;
