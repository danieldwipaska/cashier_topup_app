const express = require('express');
const router = express.Router();
const pool = require('../db');
const ruleQueries = require('../database/rules/queries');
const { v4 } = require('uuid');
const verifyToken = require('./middlewares/verifyToken');
const { ruleLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cashierAndDeveloper, allRoles } = require('./middlewares/userRole');

router.get('/', (req, res) => {
  return res.render('analysis', {
    layout: 'layouts/main-layout',
    title: 'Analysis',
    alert: '',
    messages: '',
  });
});

module.exports = router;
