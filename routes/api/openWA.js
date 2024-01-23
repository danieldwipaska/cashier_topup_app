const { default: axios } = require('axios');
const { errorLog } = require('../../config/logger/functions');
const { paymentLogger } = require('../../config/logger/childLogger');

async function postWAReceiptSend(data) {
  try {
    const response = await axios.post('http://localhost:3001/api/receipt/send', data);

    return response;
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in function postWAReceiptSend() when calling axios');
  }
}

async function postWANotifSend(data) {
  try {
    const response = await axios.post('http://localhost:3001/api/notification/send', data);

    return response;
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in function postWAReceiptSend() when calling axios');
  }
}

module.exports = { postWAReceiptSend, postWANotifSend };
