function infoLog(childLogger, msg, barcode, customerName, customerId, username) {
  childLogger.info(msg, {
    barcode,
    customerName,
    customerId,
    username,
  });
}

function errorLog(childLogger, error, info) {
  childLogger.error(error, { info });
}

module.exports = {
  infoLog,
  errorLog,
};
