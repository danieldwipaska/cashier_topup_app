const express = require('express');
const { convertTZ } = require('./functions/convertDateTimezone');
const pool = require('../db');
const paymentQueries = require('../database/payments/queries');
const { OpenAndCloseTimeConverter } = require('./classes/openAndCloseTimeConverter');
const router = express.Router();

router.get('/', (req, res) => {
  return res.render('analysis', {
    layout: 'layouts/main-layout',
    title: 'Analysis',
    alert: '',
    messages: '',
  });
});

// DAILY

// TOTAL PAYMENTS
router.get('/payment', async (req, res) => {
  try {
    const dateFrom = OpenAndCloseTimeConverter.open();
    const dateTo = OpenAndCloseTimeConverter.close();

    console.log(dateFrom);
    console.log(dateTo);

    try {
      const payments = await pool.query(paymentQueries.getPaymentWithDateRange, ['pay', dateFrom, dateTo]);

      return res.status(200).json(payments.rows);
    } catch (error) {
      return res.status(500).json('Server Error');
    }

    // const dateNow = dateJakarta.getDate();
    // const monthNow = dateJakarta.getMonth();
    // const yearNow = dateJakarta.getFullYear();

    // const dateFrom = new Date(yearNow, monthNow, dateNow, 13, 0, 0);
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

// TOP-UP CASH
router.get('/topup/cash', async (req, res) => {
  try {
    const dateFrom = OpenAndCloseTimeConverter.open();
    const dateTo = OpenAndCloseTimeConverter.close();

    try {
      const payments = await pool.query(paymentQueries.getPaymentWithMethodDateRange, ['topup', 'Cash', dateFrom, dateTo]);

      return res.status(200).json(payments.rows);
    } catch (error) {
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

// TOP-UP TRANSFER BCA
router.get('/topup/transfer/bca', async (req, res) => {
  try {
    const dateFrom = OpenAndCloseTimeConverter.open();
    const dateTo = OpenAndCloseTimeConverter.close();

    try {
      const payments = await pool.query(paymentQueries.getPaymentWithMethodDateRange, ['topup', 'Transfer BCA', dateFrom, dateTo]);

      return res.status(200).json(payments.rows);
    } catch (error) {
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

// TOP-UP TRANSFER MANDIRI
router.get('/topup/transfer/mandiri', async (req, res) => {
  try {
    const dateFrom = OpenAndCloseTimeConverter.open();
    const dateTo = OpenAndCloseTimeConverter.close();

    try {
      const payments = await pool.query(paymentQueries.getPaymentWithMethodDateRange, ['topup', 'Transfer MANDIRI', dateFrom, dateTo]);

      return res.status(200).json(payments.rows);
    } catch (error) {
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

// TOP-UP EDC BCA
router.get('/topup/edc/bca', async (req, res) => {
  try {
    const dateFrom = OpenAndCloseTimeConverter.open();
    const dateTo = OpenAndCloseTimeConverter.close();

    try {
      const payments = await pool.query(paymentQueries.getPaymentWithMethodDateRange, ['topup', 'EDC BCA', dateFrom, dateTo]);

      return res.status(200).json(payments.rows);
    } catch (error) {
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

// TOP-UP EDC BCA
router.get('/topup/edc/mandiri', async (req, res) => {
  try {
    const dateFrom = OpenAndCloseTimeConverter.open();
    const dateTo = OpenAndCloseTimeConverter.close();

    try {
      const payments = await pool.query(paymentQueries.getPaymentWithMethodDateRange, ['topup', 'EDC MANDIRI', dateFrom, dateTo]);

      return res.status(200).json(payments.rows);
    } catch (error) {
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

// TOP-UP QRIS BCA
router.get('/topup/qris/bca', async (req, res) => {
  try {
    const dateFrom = OpenAndCloseTimeConverter.open();
    const dateTo = OpenAndCloseTimeConverter.close();

    try {
      const payments = await pool.query(paymentQueries.getPaymentWithMethodDateRange, ['topup', 'QRIS BCA', dateFrom, dateTo]);

      return res.status(200).json(payments.rows);
    } catch (error) {
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

// TOP-UP QRIS MANDIRI
router.get('/topup/qris/mandiri', async (req, res) => {
  try {
    const dateFrom = OpenAndCloseTimeConverter.open();
    const dateTo = OpenAndCloseTimeConverter.close();

    try {
      const payments = await pool.query(paymentQueries.getPaymentWithMethodDateRange, ['topup', 'QRIS MANDIRI', dateFrom, dateTo]);

      return res.status(200).json(payments.rows);
    } catch (error) {
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

// CHECKOUT CASH
router.get('/checkout/cash', async (req, res) => {
  try {
    const dateFrom = OpenAndCloseTimeConverter.open();
    const dateTo = OpenAndCloseTimeConverter.close();

    try {
      const payments = await pool.query(paymentQueries.getPaymentWithMethodDateRange, ['checkout', 'Cash', dateFrom, dateTo]);

      return res.status(200).json(payments.rows);
    } catch (error) {
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

// CHECKOUT TRANSFER BCA
router.get('/checkout/transfer/bca', async (req, res) => {
  try {
    const dateFrom = OpenAndCloseTimeConverter.open();
    const dateTo = OpenAndCloseTimeConverter.close();

    try {
      const payments = await pool.query(paymentQueries.getPaymentWithMethodDateRange, ['checkout', 'Transfer BCA', dateFrom, dateTo]);

      return res.status(200).json(payments.rows);
    } catch (error) {
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

// CHECKOUT TRANSFER MANDIRI
router.get('/checkout/transfer/mandiri', async (req, res) => {
  try {
    const dateFrom = OpenAndCloseTimeConverter.open();
    const dateTo = OpenAndCloseTimeConverter.close();

    try {
      const payments = await pool.query(paymentQueries.getPaymentWithMethodDateRange, ['checkout', 'Transfer MANDIRI', dateFrom, dateTo]);

      return res.status(200).json(payments.rows);
    } catch (error) {
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

module.exports = router;
