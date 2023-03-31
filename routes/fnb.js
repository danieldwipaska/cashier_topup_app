const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/fnbs/queries');
const { v4 } = require('uuid');
const verifyToken = require('./middlewares/verifyToken');

// PAGE FOR ADD FNB
router.get('/add', verifyToken, (req, res) => {
  res.render('addFnb', {
    layout: 'layouts/main-layout',
    title: 'Food and Beverages',
  });
});

// GET ALL FNB
router.get('/list', verifyToken, (req, res) => {
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
router.post('/', verifyToken, (req, res) => {
  const { menu, kind, netto, price } = req.body;

  pool.query(queries.getFnbByMenu, [menu], (error, getResults) => {
    if (error) return console.log(error);

    if (getResults.rows.length) {
      pool.query(queries.getFnbs, [], (error, results) => {
        if (error) return console.log(error);

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
      pool.query(queries.addFnb, [id, menu, kind, netto, price], (error, addResults) => {
        if (error) return console.log();

        res.redirect('/fnb/list');
      });
    }
  });
});

// DELETE A FNB
router.get('/:id/delete', verifyToken, (req, res) => {
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
