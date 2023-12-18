const express = require('express');
const router = express.Router();
const pool = require('../db');
const memberQueries = require('../database/members/queries');
const cardQueries = require('../database/cards/queries');
const paymentQueries = require('../database/payments/queries');
const verifyToken = require('./middlewares/verifyToken');
const { memberLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cashierAndDeveloper, allRoles } = require('./middlewares/userRole');
const { v4 } = require('uuid');
const { convertTZ } = require('./functions/convertDateTimezone');
const { CARD_NOT_EXIST, CARD_NOT_ACTIVE, CARD_NOT_MEMBER, CARD_BELONGS_TO_OTHER } = require('./var/reports');

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
          alert: CARD_NOT_EXIST,
        });

      if (!cards.rows[0].is_active)
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Membership',
          alert: CARD_NOT_ACTIVE,
        });

      if (!cards.rows[0].is_member)
        return res.render('search', {
          layout: 'layouts/main-layout',
          title: 'Search',
          subtitle: 'Membership',
          alert: CARD_NOT_MEMBER,
        });

      try {
        const members = await pool.query(memberQueries.getMemberByBarcode, [cards.rows[0].barcode]);

        if (members.rows.length)
          return res.render('search', {
            layout: 'layouts/main-layout',
            title: 'Search',
            subtitle: 'Membership',
            alert: CARD_BELONGS_TO_OTHER,
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
  return res.render('memberAssessment', {
    layout: 'layouts/main-layout',
    title: 'Member Assessment',
    subtitle: 'Member Assessment',
    alert: '',
  });
});

// PAYMENT DATA
router.get('/assessment/search', async (req, res) => {
  const { id: customerId } = req.query;
  try {
    const payments = await pool.query(paymentQueries.getPaymentWithActionByCustomerId, ['pay', customerId]);

    if (!payments.rows.length) return res.status(404).json('Payment Not Found');

    return res.status(200).json(payments.rows);
  } catch (error) {
    errorLog(memberLogger, error, 'Error in HTTP GET /assessment/:id when calling paymentQueries.getPaymentWithActionByCustomerId');
    return res.status(500).json('Server Error');
  }
});

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

// ADD MEMBER WITH NEW CARD
router.post('/new', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { barcode, identityNumber: identity_number, name: fullname, birthDate, customerId: customer_id, address, email, instagram, facebook, twitter } = req.body;

  // CHECK THE CARD
  try {
    const birth_date = new Date(birthDate);
    const phone_number = customer_id;

    const cards = await pool.query(cardQueries.getCardById, [barcode]);

    if (!cards.rows.length === 0)
      return res.render('notificationError', {
        layout: 'layouts/main-layout',
        title: 'Membership Error',
        message: CARD_NOT_EXIST,
      });

    if (!cards.rows[0].is_active)
      return res.render('notificationError', {
        layout: 'layouts/main-layout',
        title: 'Membership Error',
        message: CARD_NOT_ACTIVE,
      });

    if (!cards.rows[0].is_member)
      return res.render('notificationError', {
        layout: 'layouts/main-layout',
        title: 'Membership Error',
        message: CARD_NOT_MEMBER,
      });

    try {
      const members = await pool.query(memberQueries.getMemberByIdentityNumber, [identity_number]);

      if (members.rows.length)
        return res.render('addMember', {
          layout: 'layouts/main-layout',
          title: 'Member Submission',
          subtitle: 'Member Submission',
          message: 'Oh, no! Identity Number already existed',
          customer_id,
          barcode,
        });

      // IF THE MEMBER DOES NOT EXIST
      // ADD A MEMBER
      try {
        const memberId = v4();

        await pool.query(memberQueries.addMember, [memberId, identity_number, fullname, customer_id, barcode, birth_date, phone_number, true, address, email, instagram, facebook, twitter]);

        // SEND LOG
        infoLog(memberLogger, 'Member was successfully added', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

        // UPDATE CARD CUSTOMER_NAME
        try {
          await pool.query(cardQueries.updateCardById, [fullname, customer_id, barcode]);

          // SEND LOG
          infoLog(memberLogger, 'Card was successfully updated', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

          return res.render('notificationSuccess', {
            layout: 'layouts/main-layout',
            title: 'Member Subscription Success',
            message: 'Member Subscription succeed, and The Card details have been updated.',
          });
          fullname;
        } catch (error) {
          errorLog(memberLogger, error, 'Error in HTTP POST / when calling cardQueries.updateCardById');

          return res.render('notificationError', {
            layout: 'layouts/main-layout',
            title: 'Membership Error',
            message: 'Failed to change card name, ID, and balance',
          });
        }
      } catch (error) {
        errorLog(memberLogger, error, 'Error in HTTP POST / when calling memberqueries.addMember');

        return res.render('notificationError', {
          layout: 'layouts/main-layout',
          title: 'Membership Error',
          message: 'Failed to add the member',
        });
      }
    } catch (error) {
      errorLog(memberLogger, error, 'Error in HTTP POST / when calling memberQueries.getMemberByIdentityNumber');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(memberLogger, error, 'Error in HTTP POST / when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }
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

// MEMBER AREA
router.get('/', (req, res) => {
  return res.render('memberArea', {
    layout: 'layouts/main-layout',
    title: 'Member Area',
  });
});

// NEW CARD
router.get('/new', async (req, res) => {
  const { customerId, barcode } = req.query;

  if (!customerId && !barcode)
    return res.render('newCardMember', {
      layout: 'layouts/main-layout',
      title: 'Member Eligibility',
      subtitle: 'Card & Member Eligibility Check',
      alert: '',
      customerId: '',
      barcode: '',
    });

  const minPaymentHistory = 1000000; // 1 juta

  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);
    if (!cards.rows.length)
      return res.render('newCardMember', {
        layout: 'layouts/main-layout',
        title: 'Member Eligibility',
        subtitle: 'Card & Member Eligibility Check',
        alert: 'Card does not exist',
        customerId,
        barcode,
      });
    if (!cards.rows[0].is_active)
      return res.render('newCardMember', {
        layout: 'layouts/main-layout',
        title: 'Member Eligibility',
        subtitle: 'Card & Member Eligibility Check',
        alert: 'Card is NOT ACTIVE',
        customerId,
        barcode,
      });

    if (!cards.rows[0].is_member)
      return res.render('newCardMember', {
        layout: 'layouts/main-layout',
        title: 'Member Eligibility',
        subtitle: 'Card & Member Eligibility Check',
        alert: 'Card is NOT A MEMBER CARD',
        customerId,
        barcode,
      });

    if (cards.rows[0].customer_id)
      return res.render('newCardMember', {
        layout: 'layouts/main-layout',
        title: 'Member Eligibility',
        subtitle: 'Card & Member Eligibility Check',
        alert: 'The card BELONGS TO SOMEONE',
        customerId,
        barcode,
      });

    try {
      const members = await pool.query(memberQueries.getMemberByCustomerId, [customerId]);

      if (members.rows.length)
        return res.render('newCardMember', {
          layout: 'layouts/main-layout',
          title: 'Member Eligibility',
          subtitle: 'Card & Member Eligibility Check',
          alert: "The Customer's Phone Number is already a member",
          customerId,
          barcode,
        });

      try {
        const payments = await pool.query(paymentQueries.getPaymentWithActionByCustomerId, ['pay', customerId]);
        if (!payments.rows.length)
          return res.render('newCardMember', {
            layout: 'layouts/main-layout',
            title: 'Member Eligibility',
            subtitle: 'Card & Member Eligibility Check',
            alert: 'Customer has no payment yet',
            customerId,
            barcode,
          });

        let customerTotalPayment = 0;
        payments.rows.forEach((payment) => {
          customerTotalPayment += payment.payment;
        });

        // CONSTRAINT
        if (customerTotalPayment < minPaymentHistory)
          return res.render('newCardMember', {
            layout: 'layouts/main-layout',
            title: 'Member Eligibility',
            subtitle: 'Card & Member Eligibility Check',
            alert: `Customer payment history has not reached minimal total payment (IDR ${Intl.NumberFormat('en-US').format(minPaymentHistory)}). Customer's total payment is IDR ${Intl.NumberFormat('en-US').format(customerTotalPayment)}`,
            customerId,
            barcode,
          });

        return res.render('addMember', {
          layout: 'layouts/main-layout',
          title: 'Member Submission',
          subtitle: 'Member Submission',
          message: 'Customer is Eligible to Add',
          customerId,
          barcode,
        });
      } catch (err) {
        errorLog(memberLogger, err, 'Error in /new when calling paymentQueries.getPaymentWithActionByCustomerId');
      }
    } catch (err) {
      errorLog(memberLogger, err, 'Error in /new when calling memberQueries.getMemberByCustomerId');
    }
  } catch (err) {
    errorLog(memberLogger, err, 'Error in /new when calling cardQueries.getCardById');
  }
});

// GET ALL MEMBERS
router.get('/details', async (req, res) => {
  // GET MEMBERS
  try {
    const members = await pool.query(memberQueries.getMembers, []);
    if (!members.rows.length) return res.status(404).json('Member Not Found');

    return res.status(200).json(members.rows);
  } catch (error) {
    errorLog(memberLogger, error, 'Error in GET /details/:id when calling memberQueries.getMembers');
  }
});

// GET A MEMBER
router.get('/details/:id', async (req, res) => {
  const { id } = req.params;

  // GET MEMBER BY ID
  try {
    const members = await pool.query(memberQueries.getMemberById, [id]);
    if (!members.rows.length) return res.status(404).json('Member Not Found');

    // Calibrate the date timezone
    const date = members.rows[0].birth_date;
    date.setTime(date.getTime() - date.getTimezoneOffset() * 60000);

    // Date to ISO String and slice
    members.rows[0].birth_date = date.toISOString().slice(0, 10);

    return res.status(200).json(members.rows[0]);
  } catch (error) {
    errorLog(memberLogger, error, 'Error in GET /details/:id when calling memberQueries.getMemberById');
  }
});

// UPDATE A MEMBER
router.post('/details/:id', verifyToken, cashierAndDeveloper, async (req, res) => {
  const { id } = req.params;
  const { customerId: customer_id, name: fullname, barcode, identityNumber: identity_number, birthDate: birth_date, isActive, email, address, instagram, facebook, twitter } = req.body;

  let is_active = true;

  if (!isActive) is_active = false;

  // GET MEMBER BY ID
  try {
    const members = await pool.query(memberQueries.getMemberById, [id]);
    if (!members.rows.length) return res.status(404).json('Member Not Found');

    try {
      const phone_number = customer_id;

      await pool.query(memberQueries.updateMemberById, [fullname, barcode, birth_date, phone_number, is_active, address, email, instagram, facebook, twitter, customer_id, identity_number, id]);

      infoLog(memberLogger, 'Member was successfully updated', barcode, fullname, customer_id, req.validUser.name);

      return res.redirect('/member/list');
    } catch (error) {
      errorLog(memberLogger, error, 'Error in POST /details/:id when calling memberQueries.updateMemberById');
    }
  } catch (error) {
    errorLog(memberLogger, error, 'Error in POST /details/:id when calling memberQueries.getMemberById');
  }
});

module.exports = router;
