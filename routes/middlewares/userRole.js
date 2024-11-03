const verifyToken = require('./verifyToken');
const Sentry = require('@sentry/node');

function developerOnly(req, res, next) {
  const userPosition = req.validUser.position;

  if (userPosition !== 'developer') {
    Sentry.captureException(new Error('Non-developer is trying to access developer-only route'));
    return res.status(402).json('You have no access to this page');
  } else {
    next();
  }
}

function cashierAndDeveloper(req, res, next) {
  const userPosition = req.validUser.position;

  if (userPosition === 'bartender') {
    return res.status(402).json('You have no access to this page');
  } else {
    next();
  }
}

function allRoles(req, res, next) {
  next();
}

module.exports = {
  developerOnly,
  cashierAndDeveloper,
  allRoles,
};
