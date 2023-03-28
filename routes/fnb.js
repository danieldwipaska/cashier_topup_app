const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/fnbs/queries');
const { v4 } = require('uuid');

// PAGE FOR ADD FNB
router.get('/add', (req, res) => {
  res.render('addFnb', {
    layout: 'layouts/main-layout',
    title: 'Food and Beverages',
  });
});

// GET ALL FNB
router.get('/list', (req, res) => {
  pool.query(queries.getFnbs, [], (error, results) => {
    if (error) console.log(error);

    res.render('fnb', {
      layout: 'layouts/main-layout',
      title: 'Food and Beverages',
      alert: '',
      messages: '',
      data: results.rows,
    });
  });
});

// ADD CARD
router.post('/', (req, res) => {
  const { menu, netto, price } = req.body;

  pool.query(queries.getFnbByMenu, [menu], (error, getResults) => {
    if (error) console.log(error);

    if (getResults.rows.length) {
      pool.query(queries.getFnbs, [], (error, results) => {
        if (error) console.log(error);

        res.render('fnb', {
          layout: 'layouts/main-layout',
          title: 'Food and Beverages',
          alert: 'Menu is already added',
          messages: '',
          data: results.rows,
        });
      });
    } else {
      const id = v4();
      pool.query(queries.addFnb, [id, menu, netto, price], (error, addResults) => {
        if (error) console.log();

        res.redirect('/fnb/list');
      });
    }
  });
});

// DELETE A FNB
router.get('/:id/delete', (req, res) => {
  const { id } = req.params;

  pool.query(queries.getFnbById, [id], (error, getResults) => {
    if (error) console.log(error);

    if (getResults.rows.length === 0) {
      pool.query(queries.getFnbs, [], (error, results) => {
        if (error) console.log(error);

        res.render('fnb', {
          layout: 'layouts/main-layout',
          title: 'Food and Beverages',
          alert: 'Menu is missing',
          messages: '',
          data: results.rows,
        });
      });
    } else {
      pool.query(queries.deleteFnbById, [id], (error, deleteResults) => {
        if (error) console.log();

        res.redirect('/fnb/list');
      });
    }
  });
});

module.exports = router;
