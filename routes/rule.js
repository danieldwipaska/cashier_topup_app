const express = require('express');
const router = express.Router();
const pool = require('../db');
const ruleQueries = require('../database/rules/queries');
const { v4 } = require('uuid');
const verifyToken = require('./middlewares/verifyToken');
const { ruleLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cashierAndDeveloper, allRoles } = require('./middlewares/userRole');

// GET ALL RULES
router.get('/list', verifyToken, cashierAndDeveloper, (req, res) => {
  pool.query(ruleQueries.getRules, [], (error, results) => {
    if (error) {
      errorLog(ruleLogger, error, 'Error in HTTP GET /list when calling ruleQueries.getRules');
      return res.status(500).json('Server Error');
    }

    return res.render('rule', {
      layout: 'layouts/main-layout',
      title: 'Rules',
      alert: '',
      messages: '',
      data: results.rows,
    });
  });
});

// ADD A RULE
router.post('/', verifyToken, allRoles, (req, res) => {
  const { name, value } = req.body;

  pool.query(ruleQueries.getRuleByName, [name], (error, getResults) => {
    if (error) {
      errorLog(ruleLogger, error, 'Error in HTTP POST / when calling ruleQueries.getRuleByName');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length) {
      pool.query(ruleQueries.getRules, [], (error, results) => {
        if (error) {
          errorLog(ruleLogger, error, 'Error in HTTP POST / when calling ruleQueries.getRules');
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
      pool.query(ruleQueries.addRule, [id, name, value], (error, addResults) => {
        if (error) {
          errorLog(ruleLogger, error, 'Error in HTTP POST / when calling ruleQueries.addRule');
          return res.status(500).json('Server Error');
        }

        // SEND LOG
        infoLog(ruleLogger, 'Rule was successfully added', '', '', '', req.validUser.name);

        return res.redirect('/rule/list');
      });
    }
  });
});

// DELETE A RULE
router.get('/:id/delete', verifyToken, cashierAndDeveloper, (req, res) => {
  const { id } = req.params;

  pool.query(ruleQueries.getRuleById, [id], (error, getResults) => {
    if (error) {
      errorLog(ruleLogger, error, 'Error in HTTP GET /:id/delete when calling ruleQueries.getRuleById');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length === 0) {
      pool.query(ruleQueries.getRules, [], (error, results) => {
        if (error) {
          errorLog(ruleLogger, error, 'Error in HTTP GET /:id/delete when calling ruleQueries.getRules');
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
      pool.query(ruleQueries.deleteRuleById, [id], (error, deleteResults) => {
        if (error) {
          errorLog(ruleLogger, error, 'Error in HTTP GET /:id/delete when calling ruleQueries.deleteRuleById');
          return res.status(500).json('Server Error');
        }

        // SEND LOG
        infoLog(ruleLogger, 'Rule was successfully deleted', '', '', '', req.validUser.name);

        return res.redirect('/rule/list');
      });
    }
  });
});

module.exports = router;
