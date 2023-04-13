const express = require('express');
const router = express.Router();
const pool = require('../db');
const users = require('../database/users/queries');
const verifyToken = require('./middlewares/verifyToken');
const { userLogger } = require('../config/logger/childLogger');
const { infoLog, errorLog } = require('../config/logger/functions');
const { developerOnly } = require('./middlewares/userRole');

// USER LIST
router.get('/list', verifyToken, developerOnly, (req, res) => {
  pool.query(users.getUsers, [], (error, results) => {
    if (error) {
      errorLog(userLogger, error, 'Error in HTTP GET /list when calling users.getUsers');
      return res.status(500).json('Server Error');
    }

    return res.render('user', {
      layout: 'layouts/main-layout',
      title: 'User List',
      alert: '',
      messages: '',
      data: results.rows,
    });
  });
});

// DELETE A USER
router.get('/:id/delete', verifyToken, developerOnly, (req, res) => {
  const { id } = req.params;

  pool.query(users.getUserById, [id], (error, getResults) => {
    if (error) {
      errorLog(userLogger, error, 'Error in HTTP GET /:id/delete when calling users.getUserById');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length === 0) {
      pool.query(users.getUsers, [], (error, results) => {
        if (error) {
          errorLog(userLogger, error, 'Error in HTTP GET /:id/delete when calling users.getUsers');
          return res.status(500).json('Server Error');
        }

        return res.render('user', {
          layout: 'layouts/main-layout',
          title: 'User List',
          alert: 'User is missing',
          messages: '',
          data: results.rows,
        });
      });
    } else {
      pool.query(users.deleteUserById, [id], (error, deleteResults) => {
        if (error) {
          errorLog(userLogger, error, 'Error in HTTP GET /:id/delete when calling users.deleteUserById');
          return res.status(500).json('Server Error');
        }

        infoLog(userLogger, 'User was successfully deleted', '', '', '', req.validUser.name);

        return res.redirect('/user/list');
      });
    }
  });
});

module.exports = router;
