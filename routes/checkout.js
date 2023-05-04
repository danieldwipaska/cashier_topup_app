const express = require('express');
const { v4 } = require('uuid');
const { checkoutLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const router = express.Router();
const queries = require('../database/cards/queries');
const payments = require('../database/payments/queries');
const memberQueries = require('../database/members/queries');
const pool = require('../db');
const { cashierAndDeveloper } = require('./middlewares/userRole');
const verifyToken = require('./middlewares/verifyToken');

// Status MENU
router.get('/search', verifyToken, cashierAndDeveloper, (req, res) => {
  const { card: barcode } = req.query;

  if (!barcode) {
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Check-Out Status',
      alert: '',
    });
  } else {
    //SEARCH FOR CARD
    pool.query(queries.getCardById, [barcode], (error, results) => {
      if (error) {
        errorLog(checkoutLogger, error, 'Error in HTTP GET /search when calling queries.getCardById');
        return res.status(500).json('Server Error');
      }

      if (results.rows.length === 0) {
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Check-Out Status',
          alert: 'Card does not exists',
        });
      } else {
        return res.render('checkout', {
          layout: 'layouts/main-layout',
          title: 'Check-Out Status',
          data: results.rows[0],
          alert: '',
        });
      }
    });
  }
});

// CHECK-OUT
router.post('/', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { barcode } = req.body;

  // SEARCH FOR CARD
  try {
    const cards = await pool.query(queries.getCardById, [barcode]);

    if (!cards.rows.length) {
      // IF CARD DOES NOT EXIST
      return res.status(404).json('Card does not exist');
    } else if (cards.rows[0].is_active === false) {
      // IF CARD IS ALREADY CHECKOUT
      return res.render('checkout', {
        layout: 'layouts/main-layout',
        title: 'Check-Out Status',
        alert: 'Card is NOT ACTIVE yet',
        data: cards.rows[0],
      });
    } else {
      // UPDATE CARD
      try {
        await pool.query(queries.cardStatus, [false, '', '', 0, 0, cards.rows[0].is_member, cards.rows[0].barcode]);

        infoLog(checkoutLogger, 'dine-in was successfully updated into false', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

        try {
          // ADD PAYMENT
          const id = v4();
          const invoiceNumber = v4();
          const sort = 'checkout';
          await pool.query(payments.addPayment, [
            id,
            sort,
            cards.rows[0].barcode,
            cards.rows[0].customer_name,
            cards.rows[0].customer_id,
            cards.rows[0].balance + cards.rows[0].deposit,
            null,
            null,
            '',
            true,
            0,
            0,
            invoiceNumber,
            0,
            req.validUser.name,
          ]);

          // SEND LOG
          infoLog(checkoutLogger, 'Payment was successfully added and invoice number was successfully generated', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

          if (cards.rows[0].is_member) {
            // UPDATE MEMBER BARCODE & IS_ACTIVE
            try {
              const members = await pool.query(memberQueries.getMemberByCustomerId, [cards.rows[0].customer_id]);

              if (!members.rows.length) return res.status(404).json('Member not found');

              try {
                await pool.query(memberQueries.updateMemberByCustomerId, [
                  members.rows[0].fullname,
                  null,
                  members.rows[0].birth_date,
                  members.rows[0].phone_number,
                  false,
                  members.rows[0].address,
                  members.rows[0].email,
                  members.rows[0].instagram,
                  members.rows[0].facebook,
                  members.rows[0].twitter,
                  members.rows[0].customer_id,
                ]);
              } catch (error) {
                errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling memberQueries.updateMemberByCustomerId');
                return res.status(500).json('Server Error');
              }
            } catch (error) {
              errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling memberQueries.getMemberByCustomerId');
              return res.status(500).json('Server Error');
            }
          }

          return res.render('notificationSuccess', {
            layout: 'layouts/main-layout',
            title: 'Check-Out',
            message: 'Card has been checked out successfully.',
          });
        } catch (error) {
          errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling payments.addPayment');
          return res.status(500).json('Server Error');
        }
      } catch (error) {
        errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling queries.cardStatus');
        return res.status(500).json('Server Error');
      }
    }
  } catch (error) {
    errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling queries.getCardById');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
