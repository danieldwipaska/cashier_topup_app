const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/stocks/queries');
const { v4 } = require('uuid');
const verifyToken = require('./middlewares/verifyToken');
const { stockLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cashierAndDeveloper, allRoles } = require('./middlewares/userRole');

// GET ALL STOCKS
router.get('/list', verifyToken, allRoles, async (req, res) => {
  try {
    // GET STOCKS
    const stocks = await pool.query(queries.getStocks, []);

    return res.render('stock', {
      layout: 'layouts/main-layout',
      title: 'Stocks',
      alert: '',
      messages: '',
      data: stocks.rows,
    });
  } catch (err) {
    // ERROR LOG
    errorLog(stockLogger, err, 'Error in HTTP GET /list when calling queries.getStocks');
    return res.status(500).json('Server Error');
  }
});

// ADD A STOCK
router.post('/', verifyToken, allRoles, async (req, res) => {
  const { name, amount, unit } = req.body;

  try {
    // CHECK WHETHER THE STOCK NAME ALREADY EXISTS
    const stocks = await pool.query(queries.getStockByName, [name]);

    if (stocks.rows.length) return res.status(400).json('Stock already exists');

    try {
      const id = v4();
      // SAVE THE STOCK
      await pool.query(queries.addStock, [id, name, amount, unit]);

      // SEND LOG
      infoLog(stockLogger, 'Stock was successfully added', '', '', '', req.validUser.name);

      return res.redirect('/stock/list');
    } catch (err) {
      // ERROR LOG
      errorLog(stockLogger, err, 'Error in HTTP POST / when calling queries.addStock');
      return res.status(500).json('Server Error');
    }
  } catch (err) {
    // ERROR LOG
    errorLog(stockLogger, err, 'Error in HTTP POST / when calling queries.getStockByName');
    return res.status(500).json('Server Error');
  }
});

// UPDATE A STOCK
router.post('/:id', verifyToken, allRoles, async (req, res) => {
  const { id } = req.params;
  const { name, amount, unit } = req.body;

  try {
    const stocks = await pool.query(queries.getStockById, [id]);

    if (!stocks.rows.length) return res.status(404).json('Stock does not exist');

    try {
      await pool.query(queries.updateStockById, [name, amount, unit, id]);

      // SEND LOG
      infoLog(stockLogger, 'Stock was successfully updated', '', '', '', req.validUser.name);

      return res.redirect('/stock/list');
    } catch (err) {
      // ERROR LOG
      errorLog(stockLogger, err, 'Error in HTTP POST /:id when calling queries.updateStockById');
      return res.status(500).json('Server Error');
    }
  } catch (err) {
    // ERROR LOG
    errorLog(stockLogger, err, 'Error in HTTP POST /:id when calling queries.getStockById');
    return res.status(500).json('Server Error');
  }
});

// DELETE A STOCK
router.get('/:id/delete', verifyToken, allRoles, async (req, res) => {
  const { id } = req.params;

  try {
    const stocks = await pool.query(queries.getStockById, [id]);

    if (!stocks.rows.length) return res.status(404).json('Stock does not exist');

    try {
      await pool.query(queries.deleteStockById, [id]);

      // SEND LOG
      infoLog(stockLogger, 'Stock was successfully deleted', '', '', '', req.validUser.name);

      return res.redirect('/stock/list');
    } catch (err) {
      // ERROR LOG
      errorLog(stockLogger, err, 'Error in HTTP get /:id/delete when calling queries.getStockById');
      return res.status(500).json('Server Error');
    }
  } catch (err) {
    // ERROR LOG
    errorLog(stockLogger, err, 'Error in HTTP get /:id/delete when calling queries.getStockById');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
