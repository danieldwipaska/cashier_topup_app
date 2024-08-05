const express = require('express');
const { getPaymentData } = require('./api/moka');
const { errorLog } = require('../config/logger/functions');
const { mokaLogger } = require('../config/logger/childLogger');

const router = express.Router();

router.get('/moka', async (req, res) => {
  try {
    const data = await getPaymentData();
    console.log(data)
    return res.json(data);
  } catch (error) {
    errorLog(mokaLogger, error, 'Error in GET /moka when calling getPaymentData()');
  }
});

// setInterval(async () => {
//   try {
//     await getPaymentData();
//   } catch (error) {
//     errorLog(mokaLogger, error, 'Error in setInterval getPaymentData()');
//   }
// }, 60000);

module.exports = router;
