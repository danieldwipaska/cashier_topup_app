const express = require('express');
const pool = require('../../db');
const queries = require('../../database/cards/queries');

const router = express.Router();

// GET DINE-IN CALCULATION
router.get('/calculation', (req, res) => {
  pool.query(queries.getCardsDineIn, [true], (error, getCardsDineInResults) => {
    if (error) return console.log(error);

    const totalDineIn = getCardsDineInResults.rows.length;

    res.status(200).json(totalDineIn);
  });
});

module.exports = router;
