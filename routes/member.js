const express = require('express');
const router = express.Router();
const pool = require('../db');
const memberQueries = require('../database/members/queries');
const cardQueries = require('../database/cards/queries');
const verifyToken = require('./middlewares/verifyToken');
const { memberLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cashierAndDeveloper, allRoles } = require('./middlewares/userRole');
const { v4 } = require('uuid');
const { convertTZ } = require('./functions/convertDateTimezone');

// SEARCH
router.get('/search', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { card: barcode } = req.query;

  // INITIAL PAGE
  if (!barcode) {
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Membership',
      alert: '',
    });
  } else {
    try {
      const cards = await pool.query(cardQueries.getCardById, [barcode]);

      if (!cards.rows.length)
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Membership',
          alert: 'Card does NOT EXIST',
        });

      if (!cards.rows[0].is_active)
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Membership',
          alert: 'Card is NOT ACTIVE',
        });

      if (!cards.rows[0].is_member)
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Membership',
          alert: 'Card is NOT A MEMBER CARD',
        });

      try {
        const members = await pool.query(memberQueries.getMemberByBarcode, [cards.rows[0].barcode]);

        if (members.rows.length)
          return res.render('search', {
            layout: 'layouts/main-layout',
            title: 'Search',
            subtitle: 'Membership',
            alert: 'Card BELONGS TO OTHER Member',
          });

        return res.render('membership', {
          layout: 'layouts/main-layout',
          title: 'Membership',
          subtitle: 'Membership',
          alert: '',
          data: cards.rows[0],
        });
      } catch (error) {
        errorLog(memberLogger, error, 'Error in HTTP GET /search when calling memberQueries.getMemberByBarcode');
        return res.status(500).json('Server Error');
      }
    } catch (error) {
      errorLog(memberLogger, error, 'Error in HTTP GET /search when calling cardQueries.getCardById');
      return res.status(500).json('Server Error');
    }
  }
});

// MEMBER ASSESSMENT
router.get('/assessment', async (req, res) => {
  try {
    return res.render('memberAssessment', {
      layout: 'layouts/main-layout',
      title: 'Member Assessment',
      subtitle: 'Member Assessment',
      alert: '',
    });
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP GET /assessment');
    return res.status(500).json('Server Error');
  }
});

// PAYMENT DATA

// GET ALL MEMBER
router.get('/list', verifyToken, cashierAndDeveloper, async (req, res) => {
  try {
    const members = await pool.query(memberQueries.getMembers, []);

    return res.render('memberList', {
      layout: 'layouts/main-layout',
      title: 'Member List',
      alert: '',
      messages: '',
      data: members.rows,
    });
  } catch (error) {
    errorLog(memberLogger, error, 'Error in HTTP GET /list when calling memberQueries.getMembers');
    return res.status(500).json('Server Error');
  }
});

// ADD MEMBER
router.post('/', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { barcode, identityNumber: identity_number, fullname, birthDate, phoneNumber: phone_number, address, email, instagram, facebook, twitter } = req.body;

  const birth_date = new Date(birthDate);

  // CHECK THE CARD
  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);

    if (!cards.rows.length === 0) return res.status(404).json('Card does not exist');

    if (!cards.rows[0].is_active) return res.status(400).json('Card is NOT ACTIVE');

    try {
      const members = await pool.query(memberQueries.getMemberByIdentityNumber, [identity_number]);

      // IF THE MEMBER EXIST
      if (members.rows.length) {
        if (members.rows[0].is_active) return res.status(400).json('Member is STILL ACTIVE');
        // UPDATE THE MEMBER
        try {
          await pool.query(memberQueries.updateMemberByIdentityNumber, [fullname, barcode, birthDate, phone_number, true, address, email, instagram, facebook, twitter, identity_number]);

          // SEND LOG
          infoLog(memberLogger, 'Member was successfully updated', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

          // UPDATE CARD CUSTOMER_NAME & CUSTOMER_ID
          try {
            await pool.query(cardQueries.updateCardById, [fullname, members.rows[0].customer_id, barcode]);

            // SEND LOG
            infoLog(memberLogger, 'Card was successfully updated', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

            return res.render('notificationSuccess', {
              layout: 'layouts/main-layout',
              title: 'Member Subscription Success',
              message: 'Member Subscription succeed.',
            });
          } catch (error) {
            errorLog(memberLogger, error, 'Error in HTTP POST / when calling cardQueries.updateCardById');
            return res.status(500).json('Server Error');
          }
        } catch (error) {
          errorLog(memberLogger, error, 'Error in HTTP POST / when calling memberQueries.updateMemberByIdentityNumber');
          return res.status(500).json('Server Error');
        }
      }

      // IF THE MEMBER DOES NOT EXIST
      // ADD A MEMBER
      try {
        const memberId = v4();
        await pool.query(memberQueries.addMember, [memberId, identity_number, fullname, cards.rows[0].customer_id, barcode, birth_date, phone_number, true, address, email, instagram, facebook, twitter]);

        // SEND LOG
        infoLog(memberLogger, 'Member was successfully added', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

        // UPDATE CARD CUSTOMER_NAME
        try {
          await pool.query(cardQueries.updateCardById, [fullname, cards.rows[0].customer_id, barcode]);

          // SEND LOG
          infoLog(memberLogger, 'Card was successfully updated', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

          return res.render('notificationSuccess', {
            layout: 'layouts/main-layout',
            title: 'Member Subscription Success',
            message: 'Member Subscription succeed.',
          });
        } catch (error) {
          errorLog(memberLogger, error, 'Error in HTTP POST / when calling cardQueries.updateCardById');
          return res.status(500).json('Server Error');
        }
      } catch (error) {
        errorLog(memberLogger, error, 'Error in HTTP POST / when calling memberqueries.addMember');
        return res.status(500).json('Server Error');
      }
    } catch (error) {
      errorLog(memberLogger, error, 'Error in HTTP POST / when calling memberQueries.getMemberByIdentityNumber');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(memberLogger, error, 'Error in HTTP POST / when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }

  // try {
  //   // CHECK WHETHER MEMBER EXISTS
  //   const members = await pool.query(memberQueries.getMemberByIdentityNumber, [identity_number]);

  //   if (members.rows.length) return res.status(400).json('Member already exists');
  // } catch (error) {
  //   errorLog(topupLogger, error, 'Error in HTTP POST / when calling memberqueries.getMemberByCustomerId');
  //   return res.status(500).json('Server Error');
  // }
});

// DELETE MEMBER
router.get('/:id/delete', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { id } = req.params;

  // GET MEMBER
  try {
    const members = await pool.query(memberQueries.getMemberById, [id]);

    if (!members.rows.length) return res.status(404).json('Member not found');

    // DELETE MEMBER
    try {
      await pool.query(memberQueries.deleteMemberById, [members.rows[0].id]);

      // SEND LOG
      infoLog(memberLogger, 'Member was successfully deleted', '', '', '', req.validUser.name);

      return res.redirect('/member/list');
    } catch (error) {
      errorLog(memberLogger, error, 'Error in HTTP GET /:id/delete when calling memberQueries.deleteMemberById');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(memberLogger, error, 'Error in HTTP GET /:id/delete when calling memberQueries.getMemberById');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
