const express = require('express');
const verifyToken = require('./middlewares/verifyToken');
const router = express.Router();
const pool = require('../db');
const cardQueries = require('../database/cards/queries');
const memberQueries = require('../database/members/queries');
const { errorLog, infoLog } = require('../config/logger/functions');
const { cashierAndDeveloper, allRoles } = require('./middlewares/userRole');
const { v4 } = require('uuid');
const { transferLogger } = require('../config/logger/childLogger');

router.get('/search', verifyToken, allRoles, async (req, res) => {
  const { card: barcode } = req.query;
  if (!barcode)
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Card Transfer',
      subtitle: 'Current Card',
      alert: '',
    });

  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);
    if (!cards.rows.length)
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Card Transfer',
        subtitle: 'Current Card',
        alert: 'Card does not exist.',
      });

    if (!cards.rows[0].is_active)
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Card Transfer',
        subtitle: 'Current Card',
        alert: 'Card is NOT ACTIVE.',
      });

    if (!cards.rows[0].customer_id)
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Card Transfer',
        subtitle: 'Current Card',
        alert: 'Card does not belong to anyone. Only a card that belongs to a customer can be transferred',
      });

    return res.render('cardTransfer', {
      layout: 'layouts/main-layout',
      title: 'Card Transfer',
      subtitle: 'Current Card',
      alert: '',
      data: cards.rows[0],
    });
  } catch (error) {
    errorLog(transferLogger, error, 'Error in GET /search when calling cardQueries.getCardById');
  }
});

// TRANSFERRING CARD
router.post('/', verifyToken, allRoles, async (req, res) => {
  const { currentBarcode, newBarcode } = req.body;

  try {
    // CURRENT CARD ASSESSMENT
    const currentCards = await pool.query(cardQueries.getCardById, [currentBarcode]);

    if (!currentCards.rows.length) return res.status(404).json('Current Card Not Found');

    if (!currentCards.rows[0].is_active) return res.status(400).json('Current Card is NOT ACTIVE');

    if (!currentCards.rows[0].customer_id) return res.status(400).json('Current Card does not belong to anyone');

    try {
      // NEW CARD ASSESSMENT
      const newCards = await pool.query(cardQueries.getCardById, [newBarcode]);

      if (!newCards.rows.length)
        return res.render('cardTransfer', {
          layout: 'layouts/main-layout',
          title: 'Card Transfer',
          subtitle: 'Current Card',
          alert: 'New Card does NOT FOUND.',
          data: currentCards.rows[0],
        });

      if (!newCards.rows[0].is_active)
        return res.render('cardTransfer', {
          layout: 'layouts/main-layout',
          title: 'Card Transfer',
          subtitle: 'Current Card',
          alert: 'New Card is NOT ACTIVE.',
          data: currentCards.rows[0],
        });

      if (newCards.rows[0].customer_id)
        return res.render('cardTransfer', {
          layout: 'layouts/main-layout',
          title: 'Card Transfer',
          subtitle: 'Current Card',
          alert: 'New Card belongs to another customer. You can only transfer Current Card to empty Card, or Card that does not belong to anyone',
          data: currentCards.rows[0],
        });

      if (currentCards.rows[0].is_member != newCards.rows[0].is_member) return res.status(400).json('Both Current Card and New Card are not in the same type (member or non-member). Transferring Cards require the same type of cards');

      try {
        // UPDATE NEW CARD
        const newCardUpdated = await pool.query(cardQueries.cardStatus, [true, currentCards.rows[0].customer_name, currentCards.rows[0].customer_id, currentCards.rows[0].balance, currentCards.rows[0].deposit, newBarcode]);

        infoLog(transferLogger, 'New Card was successfully updated', newBarcode, newCardUpdated.rows[0].customer_name, newCardUpdated.rows[0].customer_id, req.validUser.name);

        try {
          // UPDATE CURRENT CARD
          const currentCardUpdated = await pool.query(cardQueries.cardStatus, [false, null, null, 0, 0, currentBarcode]);

          infoLog(transferLogger, 'Current Card was successfully updated', currentBarcode, currentCardUpdated.rows[0].customer_name, currentCardUpdated.rows[0].customer_id, req.validUser.name);

          if (currentCards.rows[0].is_member) {
            // CHANGE CARD BARCODE IN MEMBERS
            try {
              const members = await pool.query(memberQueries.getMemberByBarcode, [currentBarcode]);
              if (!members.rows.length) return res.status(404).json('There is no member using the current card');

              try {
                await pool.query(memberQueries.updateMemberCardById, [newBarcode, members.rows[0].id]);

                infoLog(transferLogger, 'Member was successfully updated', currentBarcode, currentCardUpdated.rows[0].customer_name, currentCardUpdated.rows[0].customer_id, req.validUser.name);

                return res.render('notificationSuccess', {
                  layout: 'layouts/main-layout',
                  title: 'Check-Out',
                  message: 'Current Card has been successfully transferred to New Card.',
                });
              } catch (error) {
                errorLog(transferLogger, error, 'Error in POST / when calling memberQueries.updateMemberCardById');
              }
            } catch (error) {
              errorLog(transferLogger, error, 'Error in POST / when calling memberQueries.getMemberByBarcode');
            }
          }

          return res.render('notificationSuccess', {
            layout: 'layouts/main-layout',
            title: 'Check-Out',
            message: 'Current Card has been successfully transferred to New Card.',
          });
        } catch (error) {
          errorLog(transferLogger, error, 'Error in POST / when calling cardQueries.cardStatus for current card');
        }
      } catch (error) {
        errorLog(transferLogger, error, 'Error in POST / when calling cardQueries.cardStatus for new card');
      }
    } catch (error) {
      errorLog(transferLogger, error, 'Error in POST / when calling cardQueries.getCardById for new card');
    }
  } catch (error) {
    errorLog(transferLogger, error, 'Error in POST / when calling cardQueries.getCardById for current card');
  }
});

module.exports = router;
