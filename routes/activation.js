const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/cards/queries');
const verifyToken = require('./middlewares/verifyToken');
const { errorLog, infoLog } = require('../config/logger/functions');
const { activationLogger } = require('../config/logger/childLogger');
const { cashierAndDeveloper } = require('./middlewares/userRole');
const { v4 } = require('uuid');

// ACTIVATION MENU
router.get('/search', verifyToken, cashierAndDeveloper, async (req, res) => {
  const barcode = req.query.card;

  if (!barcode) {
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Activation/Deactivation',
      alert: '',
    });
  }

  try {
    const cards = await pool.query(queries.getCardById, [barcode]);

    if (cards.rows.length === 0) {
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Search',
        subtitle: 'Activation/Deactivation',
        alert: 'Card does not exists',
      });
    }

    if (cards.rows[0].is_active)
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Search',
        subtitle: 'Activation/Deactivation',
        alert: 'Card is already ACTIVE',
      });

    return res.render('activation', {
      layout: 'layouts/main-layout',
      title: 'Activation',
      data: cards.rows[0],
      alert: '',
    });
  } catch (error) {
    errorLog(activationLogger, error, 'Error in HTTP GET /search when calling queries.getCardById');
    return res.status(500).json('Server Error');
  }
});

// ACTIVATE
router.post('/activate', verifyToken, cashierAndDeveloper, (req, res) => {
  const { barcode, name: customer_name } = req.body;
  pool.query(queries.getCardById, [barcode], (error, results) => {
    if (error) {
      errorLog(activationLogger, error, 'Error in HTTP POST /activate when calling queries.getCardById');
      return res.status(500).json('Server Error');
    }

    if (results.rows[0].is_active === true) {
      return res.render('activation', {
        layout: 'layouts/main-layout',
        title: 'Activation',
        alert: 'Card is already active',
        data: results.rows[0],
      });
    } else {
      const customer_id = v4();
      pool.query(queries.cardActivate, [true, customer_name, customer_id, barcode], (error, cardActivateResults) => {
        if (error) {
          errorLog(activationLogger, error, 'Error in HTTP POST /activate when calling queries.cardActivate');
          return res.status(500).json('Server Error');
        }

        // SEND LOG
        infoLog(activationLogger, 'Card was successfully activated', results.rows[0].barcode, results.rows[0].customer_name, results.rows[0].customer_id, req.validUser.name);

        // RESPONSE
        return res.render('notificationSuccess', {
          layout: 'layouts/main-layout',
          title: 'Activation',
          message: 'Card has been activated successfully.',
        });
      });
    }
  });
});

// // DEACTIVATE
// router.post('/deactivate', verifyToken, cashierAndDeveloper, (req, res) => {
//   const { barcode } = req.body;
//   pool.query(queries.getCardById, [barcode], (error, results) => {
//     if (error) {
//       errorLog(activationLogger, error, 'Error in HTTP POST /deactivate when calling queries.getCardById');
//       return res.status(500).json('Server Error');
//     }

//     if (results.rows[0].is_active === false) {
//       return res.render('activation', {
//         layout: 'layouts/main-layout',
//         title: 'Activation',
//         alert: 'Card is already non-active',
//         data: results.rows[0],
//       });
//     } else {
//       pool.query(queries.cardDeactivate, [false, '', 0, '', barcode], (error, cardDeactivateResults) => {
//         if (error) {
//           errorLog(activationLogger, error, 'Error in HTTP POST /deactivate when calling queries.cardDeactivate');
//           return res.status(500).json('Server Error');
//         }

//         // SEND LOG
//         infoLog(activationLogger, 'Card was successfully Deactivated', results.rows[0].barcode, results.rows[0].customer_name, results.rows[0].customer_id, req.validUser.name);

//         return res.render('notificationSuccess', {
//           layout: 'layouts/main-layout',
//           title: 'Activation',
//           message: 'Card has been deactivated successfully.',
//         });
//       });
//     }
//   });
// });

module.exports = router;
