const express = require('express');
const router = express.Router();
const queries = require('../database/cards/queries');
const verifyToken = require('./middlewares/verifyToken');

router.get('/', verifyToken, (req, res) => {
  res.render('mainMenu', {
    layout: 'layouts/main-layout',
    title: 'Main Menu',
  });
});

router.get('/advanced', verifyToken, (req, res) => {
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

router.get('/logout', verifyToken, (req, res) => {
  res.cookie('x-access-token', '', { maxAge: 1 });
  res.redirect('/');
});

module.exports = router;
