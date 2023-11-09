const express = require('express');
const router = express.Router();
const verifyToken = require('./middlewares/verifyToken');
const { cashierAndDeveloper, allRoles } = require('./middlewares/userRole');
const { errorLog, infoLog } = require('../config/logger/functions');
const { fnbLogger } = require('../config/logger/childLogger');
const pool = require('../db');
const fnbQueries = require('../database/fnbs/queries');
const { v4 } = require('uuid');

// CREATE MENU
router.get('/list', verifyToken, cashierAndDeveloper, async (req, res) => {
  try {
    const fnbs = await pool.query(fnbQueries.getFnbs, []);

    return res.render('fnbList', {
      layout: 'layouts/main-layout',
      title: 'Food & Beverages List',
      messages: '',
      alert: '',
      data: fnbs.rows,
    });
  } catch (error) {
    errorLog(fnbLogger, error, 'Error in GET /list while calling fnbQueries.getFnbs');
    return res.status(500).json('Server Error');
  }
});

//CLIENT
router.get('/add', verifyToken, allRoles, (req, res) => {
  return res.render('addFnb', {
    layout: 'layouts/main-layout',
    title: 'Food & Beverages List',
    messages: '',
    alert: '',
    data: {},
  });
});

//ADD FNB
router.post('/add', verifyToken, allRoles, async (req, res) => {
  const { code, menu, kind, price } = req.body;

  try {
    const fnbs = await pool.query(fnbQueries.getFnbByCode, [code]);

    if (fnbs.rows.length)
      return res.render('addFnb', {
        layout: 'layouts/main-layout',
        title: 'Food & Beverages List',
        messages: '',
        alert: 'The code already exists. Code cannot be the same as another',
        data: {
          code,
          menu,
          kind,
          price,
        },
      });

    try {
      const id = v4();
      await pool.query(fnbQueries.addFnb, [id, code, menu, kind, price, null, null]);

      infoLog(fnbLogger, 'Fnb was successfully added', '', '', '', req.validUser.name);

      return res.redirect('/fnb/list');
    } catch (error) {
      errorLog(fnbLogger, error, 'Error in POST / when calling fnbQueries.addFnb');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(fnbLogger, error, 'Error in POST / when calling fnbQueries.getFnbByCode');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
