const express = require('express');
const router = express.Router();
const pool = require('../db');
const users = require('../database/users/queries');
const verifyToken = require('./middlewares/verifyToken');

router.get('/list', verifyToken, (req, res) => {
  pool.query(users.getUsers, [], (error, results) => {
    if (error) return console.log(error);

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
router.get('/:id/delete', verifyToken, (req, res) => {
  const { id } = req.params;

  pool.query(users.getUserById, [id], (error, getResults) => {
    if (error) console.log(error);

    if (getResults.rows.length === 0) {
      pool.query(users.getUsers, [], (error, results) => {
        if (error) console.log(error);

        res.render('user', {
          layout: 'layouts/main-layout',
          title: 'User List',
          alert: 'User is missing',
          messages: '',
          data: results.rows,
        });
      });
    } else {
      pool.query(users.deleteUserById, [id], (error, deleteResults) => {
        if (error) console.log();

        res.redirect('/user/list');
      });
    }
  });
});

module.exports = router;
