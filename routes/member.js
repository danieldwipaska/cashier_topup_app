const express = require('express');
const router = express.Router();
const pool = require('../db');
const memberQueries = require('../database/members/queries');
const cardQueries = require('../database/cards/queries');
const paymentQueries = require('../database/payments/queries');
const verifyToken = require('./middlewares/verifyToken');
const { memberLogger } = require('../config/logger/childLogger');
const { errorLog, infoLog } = require('../config/logger/functions');
const { developerOnly } = require('./middlewares/userRole');
const { v4 } = require('uuid');
const { CARD_NOT_EXIST, CARD_NOT_ACTIVE, CARD_NOT_MEMBER } = require('./var/reports');

// MEMBER ASSESSMENT
router.get('/assessment', verifyToken, developerOnly, async (req, res) => {
  return res.render('memberAssessment', {
    layout: 'layouts/main-layout',
    title: 'Member Assessment',
    subtitle: 'Member Assessment',
    alert: '',
  });
});

// PAYMENT DATA
router.get('/assessment/search', verifyToken, developerOnly, async (req, res) => {
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
router.get('/list', verifyToken, developerOnly, async (req, res) => {
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

// SEARCH CARD
router.get('/new', verifyToken, developerOnly, async (req, res) => {
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

      if (members.rows.length && members.rows[0].is_active)
        return res.render('newCardMember', {
          layout: 'layouts/main-layout',
          title: 'Member Eligibility',
          subtitle: 'Card & Member Eligibility Check',
          alert: "The Customer's Phone Number is already a member",
          customerId,
          barcode,
        });

      if (members.rows.length && !members.rows[0].is_active && members.rows[0].barcode)
        return res.render('newCardMember', {
          layout: 'layouts/main-layout',
          title: 'Member Eligibility',
          subtitle: 'Card & Member Eligibility Check',
          alert: 'Although the member was inactive, There is a card attached to the member.',
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

        // Calibrate the date timezone
        const date = members.rows[0].birth_date;
        date.setTime(date.getTime() - date.getTimezoneOffset() * 60000);

        // Date to ISO String and slice
        members.rows[0].birth_date = date.toISOString().slice(0, 10);

        return res.render('addMember', {
          layout: 'layouts/main-layout',
          title: 'Member Submission',
          subtitle: 'Member Submission',
          message: 'Customer is Eligible to Add',
          customerId,
          barcode,
          data: members.rows[0],
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

// ADD MEMBER WITH NEW CARD
router.post('/new', verifyToken, developerOnly, async (req, res) => {
  const { barcode, identityNumber: identity_number, name: fullname, birthDate, customerId: customer_id, address, email, instagram, facebook, twitter } = req.body;

  // CHECK THE CARD
  try {
    const birth_date = new Date(birthDate);
    const phone_number = customer_id;

    const cards = await pool.query(cardQueries.getCardById, [barcode]);

    console.log(cards.rows);

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

      if (members.rows.length && members.rows[0].is_active) {
        // Calibrate the date timezone
        const date = members.rows[0].birth_date;
        date.setTime(date.getTime() - date.getTimezoneOffset() * 60000);

        // Date to ISO String and slice
        members.rows[0].birth_date = date.toISOString().slice(0, 10);

        return res.render('addMember', {
          layout: 'layouts/main-layout',
          title: 'Member Submission',
          subtitle: 'Member Submission',
          message: 'Oh, no! Identity Number already existed',
          customer_id,
          barcode,
          data: members.rows[0],
        });
      }

      if (members.rows.length && !members.rows[0].is_active) {
        // IF THE MEMBER ALREADY EXISTS BUT IS NOT ACTIVE
        // UPDATE THE MEMBER
        try {
          await pool.query(memberQueries.updateMemberById, [fullname, barcode, birth_date, phone_number, true, address, email, instagram, facebook, twitter, customer_id, identity_number, members.rows[0].id]);

          // SEND LOG
          infoLog(memberLogger, 'Member was successfully updated', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

          return res.render('notificationSuccess', {
            layout: 'layouts/main-layout',
            title: 'Member Subscription Success',
            message: 'Member Subscription succeed, and The Card details have been updated.',
          });
        } catch (error) {
          errorLog(memberLogger, error, 'Error in /new when calling memberQueries.updateMemberByIdentityNumber');
          return res.render('notificationError', {
            layout: 'layouts/main-layout',
            title: 'Membership Error',
            message: 'Error in updating the member',
          });
        }
      } else {
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
router.get('/:id/delete', verifyToken, developerOnly, async (req, res) => {
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
router.get('/', verifyToken, developerOnly, (req, res) => {
  return res.render('memberArea', {
    layout: 'layouts/main-layout',
    title: 'Member Area',
  });
});

// GET ALL MEMBERS
router.get('/details', verifyToken, developerOnly, async (req, res) => {
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
router.get('/details/:id', verifyToken, developerOnly, async (req, res) => {
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
router.post('/details/:id', verifyToken, developerOnly, async (req, res) => {
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

// SEARCH TO CHECKOUT
router.get('/abort', verifyToken, developerOnly, async (req, res) => {
  const { card: barcode } = req.query;
  if (!barcode)
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Checkout Member',
      alert: '',
    });

  // SEARCH FOR CARD
  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);
    if (!cards.rows.length)
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Search',
        subtitle: 'Checkout Member',
        alert: 'Card does not exists',
      });

    if (!cards.rows[0].is_active)
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Search',
        subtitle: 'Checkout Member',
        alert: 'Card is NOT ACTIVE.',
      });

    if (!cards.rows[0].is_member)
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Search',
        subtitle: 'Checkout Member',
        alert: 'Card is NOT a MEMBER.',
      });

    return res.render('abortMember', {
      layout: 'layouts/main-layout',
      title: 'Checkout Member',
      subtitle: 'Checkout Member',
      alert: '',
      data: cards.rows[0],
    });
  } catch (error) {
    errorLog(memberLogger, error, 'Error in GET /abort when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }
});

//CHECKOUT MEMBER
router.post('/abort', verifyToken, developerOnly, async (req, res) => {
  const { barcode, paymentMethod: payment_method, notes } = req.body;

  const served_by = 'Greeter';
  const collected_by = req.validUser.name;

  // SEARCH FOR CARD
  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);

    if (!cards.rows.length)
      // IF CARD DOES NOT EXIST
      return res.status(404).json('Card does not exist');

    if (cards.rows[0].is_active === false)
      // IF CARD IS ALREADY CHECKOUT
      return res.render('abortMember', {
        layout: 'layouts/main-layout',
        title: 'Checkout Member',
        alert: 'Card is NOT ACTIVE yet',
        data: cards.rows[0],
      });

    if (!cards.rows[0].is_member)
      return res.render('abortMember', {
        layout: 'layouts/main-layout',
        title: 'Checkout Member',
        alert: 'Card is NOT a MEMBER',
        data: cards.rows[0],
      });

    const initial_balance = cards.rows[0].balance;
    const final_balance = 0;

    if (!cards.rows[0].customer_id) {
      try {
        await pool.query(cardQueries.cardStatus, [false, null, null, 0, 0, cards.rows[0].barcode]);

        infoLog(memberLogger, 'Card is_active was successfully updated into false', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

        return res.render('notificationSuccess', {
          layout: 'layouts/main-layout',
          title: 'Check-Out Member',
          message: 'Member Card has been checked out successfully.',
        });
      } catch (error) {
        errorLog(memberLogger, error, 'Error in POST /abort when calling cardQueries.cardStatus');
        return res.status(500).json('Server Error');
      }
    }

    // SEARCH MEMBER
    try {
      const members = await pool.query(memberQueries.getMemberByCustomerId, [cards.rows[0].customer_id]);
      if (!members.rows.length)
        return res.render('abortMember', {
          layout: 'layouts/main-layout',
          title: 'Checkout Member',
          alert: 'Member does not exist',
          data: cards.rows[0],
        });

      // UPDATE MEMBER
      try {
        await pool.query(memberQueries.deactivateMemberByCustomerId, [false, null, cards.rows[0].customer_id]);

        infoLog(memberLogger, 'Member was successfully deactivated', members.rows[0].barcode, members.rows[0].fullname, members.rows[0].customer_id, req.validUser.name);

        // UPDATE CARD
        try {
          await pool.query(cardQueries.cardStatus, [false, null, null, 0, 0, cards.rows[0].barcode]);

          infoLog(checkoutLogger, 'Card is_active was successfully updated into false', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

          try {
            // ADD PAYMENT
            const id = v4();
            const action = 'checkout';
            const payment = cards.rows[0].balance + cards.rows[0].deposit;
            const invoice_number = `CHE${Date.now()}`;
            const invoice_status = 'paid';
            const menu_names = []; // NO MENU
            const menu_amount = []; // NO MENU
            const menu_prices = []; // NO MENU
            const menu_kinds = []; // NO MENU
            const menu_discounts = []; // NO MENU
            const menu_discount_percents = []; // NO MENU

            await pool.query(paymentQueries.addPayment, [
              id,
              action,
              cards.rows[0].barcode,
              cards.rows[0].customer_name,
              cards.rows[0].customer_id,
              payment,
              invoice_number,
              invoice_status,
              initial_balance,
              final_balance,
              served_by,
              collected_by,
              payment_method,
              notes,
              menu_names,
              menu_amount,
              menu_prices,
              menu_kinds,
              menu_discounts,
              menu_discount_percents,
            ]);

            // SEND LOG
            infoLog(checkoutLogger, 'Payment was successfully added and invoice number was successfully generated', cards.rows[0].barcode, cards.rows[0].customer_name, cards.rows[0].customer_id, req.validUser.name);

            return res.render('notificationSuccess', {
              layout: 'layouts/main-layout',
              title: 'Check-Out Member',
              message: 'Card has been checked out successfully.',
            });
          } catch (error) {
            errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling paymentQueries.addPayment');
            return res.status(500).json('Server Error');
          }
        } catch (error) {
          errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling cardQueries.cardStatus');
          return res.status(500).json('Server Error');
        }
      } catch (error) {
        errorLog(memberLogger, error, 'Error in POST /abort when calling memberQueries.deactivateMemberByCustomerId');
        return res.status(500).json('Server Error');
      }
    } catch (error) {
      errorLog(memberLogger, error, 'Error in POST /abort when calling memberQueries.getMemberByCustomerId');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(checkoutLogger, error, 'Error in HTTP POST / when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
