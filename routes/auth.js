const express = require('express');
const router = express.Router();
const pool = require('../db');
const queries = require('../database/users/queries');
const bcrypt = require('bcryptjs');
const { v4 } = require('uuid');
const jwt = require('jsonwebtoken');

// REGISTER
router.post('/register', (req, res) => {
  const { username, password, position } = req.body;

  // SEARCH
  pool.query(queries.getUserByUsername, [username], async (error, usernameResults) => {
    if (error) return console.log(error);

    if (usernameResults.rows.length) {
      res.status(400).json('Username is NOT AVAILABLE');
    } else {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) return console.log(err);
        bcrypt.hash(password, salt, (error, hash) => {
          if (error) return console.log(error);
          const id = v4();
          pool.query(queries.addUser, [id, username, hash, position], (error, addResults) => {
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

  pool.query(queries.getUserByUsername, [username], async (error, getResults) => {
    if (error) return console.log(error);

    if (getResults.rows.length === 0) {
      return res.render('login', {
        layout: 'layouts/login-layout',
        title: 'Login',
        alert: 'Username or Password is not valid.',
      });
    } else {
      // Check whether password is correct or not
      bcrypt.compare(password, getResults.rows[0].password, (err, result) => {
        if (err) return console.log(err);

        if (!result) {
          return res.render('login', {
            layout: 'layouts/login-layout',
            title: 'Login',
            alert: 'Username or Password is not valid',
          });
        }

        // Create and assign a token
        const token = jwt.sign({ name: getResults.rows.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
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
