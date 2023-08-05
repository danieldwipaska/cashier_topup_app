const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  return res.render('analysis', {
    layout: 'layouts/main-layout',
    title: 'Analysis',
    alert: '',
    messages: '',
  });
});

module.exports = router;
