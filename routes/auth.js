const express = require('express');
const router = express.Router();
const pool = require('../db');
const userQueries = require('../database/users/queries');
const bcrypt = require('bcryptjs');
const { v4 } = require('uuid');
const jwt = require('jsonwebtoken');
const verifyToken = require('./middlewares/verifyToken');
const { errorLog } = require('../config/logger/functions');
const { loginLogger } = require('../config/logger/childLogger');
const { developerOnly } = require('./middlewares/userRole');

// REGISTER
router.post('/register', (req, res) => {
  const { username, password, position } = req.body;

  // SEARCH
  pool.query(userQueries.getUserByUsername, [username], async (error, usernameResults) => {
    if (error) return console.log(error);

    if (usernameResults.rows.length) {
      res.status(400).json('Username is NOT AVAILABLE');
    } else {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) return console.log(err);
        bcrypt.hash(password, salt, (error, hash) => {
          if (error) return console.log(error);
          const id = v4();
          pool.query(userQueries.addUser, [id, username, hash, position], (error, addResults) => {
            if (error) return console.log(error);

            res.status(200).json('Account has been created successfully');
          });
        });
      });
    }
  });
});

// LOGIN
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  pool.query(userQueries.getUserByUsername, [username], async (error, getResults) => {
    if (error) {
      errorLog(loginLogger, error, 'Error in HTTP POST /login when calling userQueries.getUserByUsername');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length === 0) {
      return res.render('login', {
        layout: 'layouts/login-layout',
        title: 'Login',
        alert: 'Username or Password is not valid.',
      });
    } else {
      // Check whether password is correct or not
      bcrypt.compare(password, getResults.rows[0].password, (err, result) => {
        if (err) {
          errorLog(loginLogger, err, 'Error in HTTP POST /login when calling bcrypt.compare');
          return res.status(500).json('Server Error');
        }

        if (!result) {
          return res.render('login', {
            layout: 'layouts/login-layout',
            title: 'Login',
            alert: 'Username or Password is not valid',
          });
        }

        // Create and assign a token
        const token = jwt.sign({ name: getResults.rows[0].username, position: getResults.rows[0].position }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
        // console.log(token);
        let options = {
          path: '/',
          sameSite: true,
          maxAge: 1000 * 60 * 60 * 24, // would expire after 24 hours
          httpOnly: true, // The cookie only accessible by the web server
        };

        res.cookie('x-access-token', token, options);
        return res.redirect('/');
      });
    }
  });
});

module.exports = router;
