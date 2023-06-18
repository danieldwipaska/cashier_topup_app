const express = require('express');
const router = express.Router();
const pool = require('../db');
const taxQueries = require('../database/taxes/queries');
const discountQueries = require('../database/discounts/queries');
const { v4 } = require('uuid');
const verifyToken = require('./middlewares/verifyToken');
const { ruleLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cashierAndDeveloper, allRoles } = require('./middlewares/userRole');

// GET ALL RULES
router.get('/list', verifyToken, cashierAndDeveloper, async (req, res) => {
  try {
    const taxes = await pool.query(taxQueries.getTaxes, []);
    const discounts = await pool.query(discountQueries.getDiscounts, []);

    return res.render('rule', {
      layout: 'layouts/main-layout',
      title: 'Rules',
      alert: '',
      messages: '',
      taxes: taxes.rows,
      discounts: discounts.rows,
    });
  } catch (error) {
    errorLog(ruleLogger, error, 'Error in HTTP GET /list when calling taxQueries.getRules and/or taxQueries.getDiscounts');
    return res.status(500).json('Server Error');
  }
});

// ADD A TAX
router.post('/tax', verifyToken, allRoles, (req, res) => {
  const { name, value } = req.body;

  pool.query(taxQueries.getTaxByName, [name], (error, getResults) => {
    if (error) {
      errorLog(ruleLogger, error, 'Error in HTTP POST / when calling taxQueries.getTaxByName');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length) {
      pool.query(taxQueries.getRules, [], (error, results) => {
        if (error) {
          errorLog(ruleLogger, error, 'Error in HTTP POST /tax when calling taxQueries.getRules');
          return res.status(500).json('Server Error');
        }

        return res.render('rule', {
          layout: 'layouts/main-layout',
          title: 'Rules',
          alert: 'Rule is already added',
          messages: '',
          data: results.rows,
        });
      });
    } else {
      const id = v4();
      pool.query(taxQueries.addTaxes, [id, name, value], (error, addResults) => {
        if (error) {
          errorLog(ruleLogger, error, 'Error in HTTP POST /tax when calling taxQueries.addTaxes');
          return res.status(500).json('Server Error');
        }

        // SEND LOG
        infoLog(ruleLogger, 'Tax was successfully added', '', '', '', req.validUser.name);

        return res.redirect('/rule/list');
      });
    }
  });
});

// DELETE A TAX
router.get('/tax/:id/delete', verifyToken, cashierAndDeveloper, (req, res) => {
  const { id } = req.params;

  pool.query(taxQueries.getTaxById, [id], (error, getResults) => {
    if (error) {
      errorLog(ruleLogger, error, 'Error in HTTP GET /tax/:id/delete when calling taxQueries.getTaxById');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length === 0) {
      pool.query(taxQueries.getRules, [], (error, results) => {
        if (error) {
          errorLog(ruleLogger, error, 'Error in HTTP GET /tax/:id/delete when calling taxQueries.getRules');
          return res.status(500).json('Server Error');
        }

        return res.render('rule', {
          layout: 'layouts/main-layout',
          title: 'Rules',
          alert: 'Rule is missing',
          messages: '',
          data: results.rows,
        });
      });
    } else {
      pool.query(taxQueries.deleteTaxById, [id], (error, deleteResults) => {
        if (error) {
          errorLog(ruleLogger, error, 'Error in HTTP GET /tax/:id/delete when calling taxQueries.deleteTaxById');
          return res.status(500).json('Server Error');
        }

        // SEND LOG
        infoLog(ruleLogger, 'Tax was successfully deleted', '', '', '', req.validUser.name);

        return res.redirect('/rule/list');
      });
    }
  });
});

// CLIENT ADD STOCK
router.get('/discount/add', (req, res) => {
  return res.render('addDiscount', {
    layout: 'layouts/main-layout',
    title: 'Add a Discount',
    alert: '',
    messages: '',
  });
});

// ADD A DISCOUNT
router.post('/discount', verifyToken, cashierAndDeveloper, async (req, res) => {
  let { name, desc, percent, value } = req.body;

  if (!percent) percent = null;

  if (!value) value = null;

  try {
    const id = v4();
    await pool.query(discountQueries.addDiscount, [id, name, desc, percent, value]);

    // SEND LOG
    infoLog(ruleLogger, 'Discount was successfully added', '', '', '', req.validUser.name);

    return res.redirect('/rule/list');
  } catch (error) {
    errorLog(ruleLogger, error, 'Error in HTTP POST /discount when calling discountQueries.addDiscount');
    return res.status(500).json('Server Error');
  }
});

// DELETE A DISCOUNT
router.get('/discount/:id/delete', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { id } = req.params;

  try {
    // CHECK WHETHER DISCOUNT EXIST
    const discounts = await pool.query(discountQueries.getDiscountById, [id]);

    if (!discounts.rows.length) return res.status(404).json('Discount not found');

    try {
      await pool.query(discountQueries.deleteDiscountById, [id]);

      // SEND LOG
      infoLog(ruleLogger, 'Discount was successfully deleted', '', '', '', req.validUser.name);

      return res.redirect('/rule/list');
    } catch (error) {
      errorLog(ruleLogger, error, 'Error in HTTP POST /discount when calling discountQueries.deleteDiscountById');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(ruleLogger, error, 'Error in HTTP POST /discount when calling discountQueries.getDiscountById');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
