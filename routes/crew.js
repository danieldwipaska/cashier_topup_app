const express = require('express');
const pool = require('../db');
const { getCrewTransactions } = require('./api/mokaCrewTransactions');
const router = express.Router();

// crew/analytics page
router.get('/analytics', (req, res) => {
  return res.render('crewAnalytics', {
    layout: 'layouts/main-layout',
    title: 'Crew Analytics',
    messages: '',
    alert: '',
    analyticFrom: '',
    analyticTo: '',
    data: [],
  });
});

// date form
router.post('/analytics', async (req, res) => {
  const { analyticFrom, analyticTo } = req.body;

  try {
    const crews = await pool.query('SELECT name FROM crews', []);
    if (!crews.rows.length) return res.status(404).json('Crew Not Found');

    const crewPurchases = [];

    for (let i = 0; i < crews.rows.length; i++) {
      try {
        const dateArchiveFrom = new Date(analyticFrom);
        const dateArchiveTo = new Date(analyticTo);

        const archiveFromGMTTime = dateArchiveFrom.getTime() - 7 * 60 * 60 * 1000;
        const archiveToGMTTime = dateArchiveTo.getTime() - 7 * 60 * 60 * 1000;

        const dateFrom = new Date(archiveFromGMTTime);
        const dateTo = new Date(archiveToGMTTime);

        const payments = await pool.query(
          'SELECT id, barcode, customer_name, customer_id, payment, invoice_number, created_at, updated_at, notes, menu_names, menu_amount, menu_prices, menu_kinds, menu_discounts, menu_discount_percents FROM payments WHERE served_by = $1 AND created_at >= $2 AND created_at <= $3',
          [crews.rows[i].name, dateFrom, dateTo]
        );

        const crewPurchase = {
          name: crews.rows[i].name,
          purchases: payments.rows.filter((payment) => {
            return payment.invoice_number.indexOf('PAY') === 0 && payment.invoice_number.length > 6;
          }),
          totalPayment: payments.rows.reduce((acc, payment) => {
            return acc + payment.payment;
          }, 0),
        };

        // console.log(crewPurchase);

        crewPurchases.push(crewPurchase);
      } catch (error) {
        console.log(error);
        throw error;
      }
    }

    try {
      const dateArchiveFrom = new Date(analyticFrom);
      const dateArchiveTo = new Date(analyticTo);

      // const epochArchiveFrom = dateArchiveFrom.getTime() / 1000;
      // const epochArchiveTo = dateArchiveTo.getTime() / 1000;

      const archiveFromGMTTime = dateArchiveFrom.getTime() - 7 * 60 * 60 * 1000;
      const archiveToGMTTime = dateArchiveTo.getTime() - 7 * 60 * 60 * 1000;

      const epochArchiveFrom = archiveFromGMTTime / 1000;
      const epochArchiveTo = archiveToGMTTime / 1000;

      const mokaCrewPurchases = await getCrewTransactions(epochArchiveFrom, epochArchiveTo);

      console.log(crewPurchases);
      console.log(mokaCrewPurchases);

      return res.render('crewAnalytics', {
        layout: 'layouts/main-layout',
        title: 'Crew Analytics',
        data: crewPurchases,
        moka_data: mokaCrewPurchases,
        alert: '',
        messages: '',
        analyticFrom,
        analyticTo,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }

    // setTimeout(() => {
    //   console.log(crewPurchases);

    //   return res.redirect('/crew/analytics');
    // }, 3000);
  } catch (error) {
    console.log(error);
    throw error;
  }
});

module.exports = router;
