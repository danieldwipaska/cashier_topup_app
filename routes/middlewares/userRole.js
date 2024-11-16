const verifyToken = require('./verifyToken');

function developerOnly(req, res, next) {
  const userPosition = req.validUser.position;

  if (userPosition !== 'developer') {
    return res.status(402).json('You have no access to this action or page');
  } else {
    next();
  }
}

function cashierAndDeveloper(req, res, next) {
  const userPosition = req.validUser.position;

  if (userPosition === 'bartender') {
    return res.status(402).json('You have no access to this action or page');
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
