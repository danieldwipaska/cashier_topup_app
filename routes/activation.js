const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');

// ACTIVATION MENU
router.get('/search', (req, res) => {
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
router.post('/activate', (req, res) => {
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
      pool.query(queries.cardActivation, [true, barcode], (error, results) => {
        if (error) return console.log(error);
        res.render('notificationSuccess', {
          layout: 'layouts/main-layout',
          title: 'Activation',
          message: 'Card has been activated successfully.',
        });
      });
    }
  });
});

// DEACTIVATE
router.post('/deactivate', (req, res) => {
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
      pool.query(queries.cardActivation, [false, barcode], (error, results) => {
        if (error) return console.log(error);
        res.render('notificationSuccess', {
          layout: 'layouts/main-layout',
          title: 'Activation',
          message: 'Card has been deactivated successfully.',
        });
      });
    }
  });
});

module.exports = router;
