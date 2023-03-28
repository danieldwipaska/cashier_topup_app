const express = require('express');
const router = express.Router();
const queries = require('../database/cards/queries');

router.get('/', (req, res) => {
  res.render('mainMenu', {
    layout: 'layouts/main-layout',
    title: 'Main Menu',
  });
});

router.get('/advanced', (req, res) => {
  res.render('advancedMenu', {
    layout: 'layouts/main-layout',
    title: 'Advanced Menu',
  });
});

module.exports = router;
