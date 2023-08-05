const logger = require('./logger');

const checkinLogger = logger.child({ feature: 'Check-In' });
const checkoutLogger = logger.child({ feature: 'Check-Out' });
const topupLogger = logger.child({ feature: 'Top-Up' });
const paymentLogger = logger.child({ feature: 'Payment' });
const activationLogger = logger.child({ feature: 'Activation' });
const createLogger = logger.child({ feature: 'Create' });
const fnbLogger = logger.child({ feature: 'Fnb List' });
const userLogger = logger.child({ feature: 'User List' });
const cardLogger = logger.child({ feature: 'Card List' });
const loginLogger = logger.child({ feature: 'Login' });
const ruleLogger = logger.child({ feature: 'Rule List' });
const stockLogger = logger.child({ feature: 'Stock List' });
const memberLogger = logger.child({ feature: 'Member List' });
const discountLogger = logger.child({ feature: 'Discount' });
const mokaLogger = logger.child({ feature: 'Moka' });

module.exports = {
  checkinLogger,
  checkoutLogger,
  topupLogger,
  paymentLogger,
  activationLogger,
  createLogger,
  fnbLogger,
  userLogger,
  cardLogger,
  loginLogger,
  ruleLogger,
  stockLogger,
  memberLogger,
  discountLogger,
  mokaLogger,
};
