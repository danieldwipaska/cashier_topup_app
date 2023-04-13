const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/fnbs/queries');
const { v4 } = require('uuid');
const verifyToken = require('./middlewares/verifyToken');
const { fnbLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cashierAndDeveloper } = require('./middlewares/userRole');

// PAGE FOR ADD FNB
router.get('/add', verifyToken, cashierAndDeveloper, (req, res) => {
  return res.render('addFnb', {
    layout: 'layouts/main-layout',
    title: 'Food and Beverages',
  });
});

// GET ALL FNB
router.get('/list', verifyToken, cashierAndDeveloper, (req, res) => {
  pool.query(queries.getFnbs, [], (error, results) => {
    if (error) {
      errorLog(fnbLogger, error, 'Error in HTTP GET /list when calling queries.getFnbs');
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
router.post('/', verifyToken, cashierAndDeveloper, (req, res) => {
  const { menu, kind, netto, price } = req.body;

  pool.query(queries.getFnbByMenu, [menu], (error, getResults) => {
    if (error) {
      errorLog(fnbLogger, error, 'Error in HTTP POST / when calling queries.getFnbByMenu');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length) {
      pool.query(queries.getFnbs, [], (error, results) => {
        if (error) {
          errorLog(fnbLogger, error, 'Error in HTTP POST / when calling queries.getFnbs');
          return res.status(500).json('Server Error');
        }

        return res.render('fnb', {
          layout: 'layouts/main-layout',
          title: 'Food and Beverages',
          alert: 'Menu is already added',
          messages: '',
          data: results.rows,
        });
      });
    } else {
      const id = v4();
      pool.query(queries.addFnb, [id, menu, kind, netto, price], (error, addResults) => {
        if (error) {
          errorLog(fnbLogger, error, 'Error in HTTP POST / when calling queries.addFnb');
          return res.status(500).json('Server Error');
        }

        // SEND LOG
        infoLog(fnbLogger, 'Fnb was successfully added', '', '', '', req.validUser.name);

        return res.redirect('/fnb/list');
      });
    }
  });
});

// DELETE A FNB
router.get('/:id/delete', verifyToken, cashierAndDeveloper, (req, res) => {
  const { id } = req.params;

  pool.query(queries.getFnbById, [id], (error, getResults) => {
    if (error) {
      errorLog(fnbLogger, error, 'Error in HTTP GET /:id/delete when calling queries.getFnbById');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length === 0) {
      pool.query(queries.getFnbs, [], (error, results) => {
        if (error) {
          errorLog(fnbLogger, error, 'Error in HTTP GET /:id/delete when calling queries.getFnbs');
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
      pool.query(queries.deleteFnbById, [id], (error, deleteResults) => {
        if (error) {
          errorLog(fnbLogger, error, 'Error in HTTP GET /:id/delete when calling queries.deleteFnbById');
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
