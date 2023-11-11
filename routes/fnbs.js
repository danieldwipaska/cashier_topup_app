const express = require('express');
const router = express.Router();
const verifyToken = require('./middlewares/verifyToken');
const { cashierAndDeveloper, allRoles } = require('./middlewares/userRole');
const { errorLog, infoLog } = require('../config/logger/functions');
const { fnbLogger } = require('../config/logger/childLogger');
const pool = require('../db');
const fnbQueries = require('../database/fnbs/queries');
const { v4 } = require('uuid');

// CREATE FNB
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

// GET A FNB
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const fnbs = await pool.query(fnbQueries.getFnbById, [id]);
    if (!fnbs.rows.length) return res.status(404).json('Food / Beverages Not Found');

    return res.status(200).json(fnbs.rows[0]);
  } catch (error) {
    errorLog(fnbLogger, error, 'Error in GET /:id when calling fnbQueries.getFnbById');
    return res.status(500).json('Server Error');
  }
});

// UPDATE FNB
router.post('/:id', verifyToken, allRoles, async (req, res) => {
  const { id } = req.params;
  const { code, menu, price, kind } = req.body;

  try {
    const fnbs = await pool.query(fnbQueries.getFnbById, [id]);
    if (!fnbs.rows.length) return res.status(404).json('Food / Beverages Not Found');

    try {
      await pool.query(fnbQueries.updateFnbById, [code, menu, kind, price, fnbs.rows[0].raw_mat, fnbs.rows[0].raw_amount, id]);

      infoLog(fnbLogger, 'Fnb was successfully updated', '', '', '', req.validUser.name);

      return res.redirect('/fnb/list');
    } catch (error) {
      errorLog(fnbLogger, error, 'Error in POST /:id when calling fnbQueries.updateFnbById');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(fnbLogger, error, 'Error in POST /:id when calling fnbQueries.getFnbById');
    return res.status(500).json('Server Error');
  }
});

// DELETE FNB
router.get('/:id/delete', verifyToken, allRoles, async (req, res) => {
  const { id } = req.params;

  try {
    const fnbs = await pool.query(fnbQueries.getFnbById, [id]);
    if (!fnbs.rows.length) return res.status(404).json('Food / Beverages Not Found');

    try {
      await pool.query(fnbQueries.deleteFnbById, [id]);

      infoLog(fnbLogger, 'Fnb was successfully deleted', '', '', '', req.validUser.name);

      return res.redirect('/fnb/list');
    } catch (error) {
      errorLog(fnbLogger, error, 'Error in GET /:id/delete when calling fnbQueries.getFnbById');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(fnbLogger, error, 'Error in GET /:id/delete when calling fnbQueries.getFnbById');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
