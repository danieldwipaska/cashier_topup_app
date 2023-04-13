const express = require('express');
const router = express.Router();
const queries = require('../database/cards/queries');
const { allRoles } = require('./middlewares/userRole');
const verifyToken = require('./middlewares/verifyToken');

router.get('/', verifyToken, allRoles, (req, res) => {
  res.render('mainMenu', {
    layout: 'layouts/main-layout',
    title: 'Main Menu',
  });
});

router.get('/advanced', verifyToken, allRoles, (req, res) => {
  layout: 'layouts/main-layout',
    res.render('advancedMenu', {
      layout: 'layouts/main-layout',
      title: 'Advanced Menu',
    });
});

router.get('/login', (req, res) => {
  res.render('login', {
    layout: 'layouts/login-layout',
    title: 'Login',
    alert: '',
  });
});

router.get('/logout', verifyToken, allRoles, (req, res) => {
  res.cookie('x-access-token', '', { maxAge: 1 });
  res.redirect('/');
});

router.get('/receipt', verifyToken, allRoles, (req, res) => {
  res.render('invoiceSimple', {
    layout: 'layouts/receipt-layout',
    title: 'Receipt',
    alert: '',
  });
});

module.exports = router;
