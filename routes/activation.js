const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const verifyToken = require('./middlewares/verifyToken');

// ACTIVATION MENU
router.get('/search', verifyToken, (req, res) => {
  const barcode = req.query.card;

  if (!barcode) {
    res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Activation/Deactivation',
      alert: '',
    });
  } else {
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) return console.log(error);
      if (results.rows.length === 0) {
        res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Activation/Deactivation',
          alert: 'Card does not exists',
        });
      } else {
        res.render('activation', {
          layout: 'layouts/main-layout',
          title: 'Activation',
          data: results.rows[0],
          alert: '',
        });
      }
    });
  }
});

// ACTIVATE
router.post('/activate', verifyToken, (req, res) => {
  const { barcode } = req.body;
  pool.query(queries.getCardById, [barcode], (error, results) => {
    if (error) return console.log(error);
    if (results.rows[0].is_active === true) {
      res.render('activation', {
        layout: 'layouts/main-layout',
        title: 'Activation',
        alert: 'Card is already active',
        data: results.rows[0],
      });
    } else {
      pool.query(queries.cardActivate, [true, barcode], (error, results) => {
        if (error) return console.log(error);
        res.render('notificationSuccess', {
          layout: 'layouts/main-layout',
          title: 'Activation',
          message: 'Card has been activated successfully.',
          data: results.rows[0],
        });
      });
    }
  });
});

// DEACTIVATE
router.post('/deactivate', verifyToken, (req, res) => {
  const { barcode } = req.body;
  pool.query(queries.getCardById, [barcode], (error, results) => {
    if (error) return console.log(error);
    if (results.rows[0].is_active === false) {
      res.render('activation', {
        layout: 'layouts/main-layout',
        title: 'Activation',
        alert: 'Card is already non-active',
        data: results.rows[0],
      });
    } else {
      pool.query(queries.cardDeactivate, [false, false, '', 0, barcode], (error, results) => {
        if (error) return console.log(error);
        res.render('notificationSuccess', {
          layout: 'layouts/main-layout',
          title: 'Activation',
          message: 'Card has been deactivated successfully.',
          data: results.rows[0],
        });
      });
    }
  });
});

module.exports = router;
