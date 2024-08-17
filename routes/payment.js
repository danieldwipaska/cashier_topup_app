const express = require('express');
const router = express.Router();
const pool = require('../db');
const cardQueries = require('../database/cards/queries');
const paymentQueries = require('../database/payments/queries');
const crewQueries = require('../database/crews/queries');
const fnbQueries = require('../database/fnbs/queries');
const verifyToken = require('./middlewares/verifyToken');
const { v4 } = require('uuid');
const { errorLog, infoLog } = require('../config/logger/functions');
const { paymentLogger } = require('../config/logger/childLogger');
const { allRoles, cashierAndDeveloper, developerOnly } = require('./middlewares/userRole');
const fastcsv = require('fast-csv');
const fs = require('fs');
const { convertTZ } = require('./functions/convertDateTimezone');
const { OpenAndCloseTimeConverter } = require('./classes/openAndCloseTimeConverter');
const { BALANCE_UPDATE_SUCCESS, PAYMENT_REPORT_FAILED, BALANCE_UPDATE_FAILED } = require('./var/reports');

// SEARCH
router.get('/search', verifyToken, allRoles, async (req, res) => {
  const { card: barcode } = req.query;

  // INITIAL PAGE
  if (!barcode) {
    return res.render('search', {
      layout: 'layouts/main-layout',
      title: 'Search',
      subtitle: 'Payment',
      alert: '',
    });
  }

  try {
    const cards = await pool.query(cardQueries.getCardById, [barcode]);

    if (cards.rows.length === 0) {
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Search',
        subtitle: 'Payment',
        alert: 'Card does NOT EXIST',
      });
    }

    if (!cards.rows[0].is_active) {
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Search',
        subtitle: 'Payment',
        alert: 'Card is NOT ACTIVE',
      });
    }

    if (!cards.rows[0].customer_id) {
      return res.render('search', {
        layout: 'layouts/main-layout',
        title: 'Search',
        subtitle: 'Payment',
        alert: 'Card is ACTIVE but DOES NOT BELONG to anyone',
      });
    }

    try {
      const fnbs = await pool.query(fnbQueries.getFnbs, []);

      fnbs.rows.forEach((fnb) => {
        if (fnb.discount_status) {
          fnb.price = parseInt(fnb.price * (1 - fnb.discount_percent / 100));
        }
      });

      return res.render('payment', {
        layout: 'layouts/main-layout',
        title: 'Payments',
        subtitle: 'Payment',
        alert: '',
        data: cards.rows[0],
        fnbs: fnbs.rows,
      });
    } catch (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling fnbQueries.getFnbs');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP GET /search when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }
});

// PAYMENTS
router.post('/', verifyToken, allRoles, async (req, res) => {
  const { barcode, customerName: customer_name, customerId: customer_id, payment, invoiceNumber, invoiceStatus: invoice_status, serverCode, collectedBy: collected_by, notes, menuAmount, menuIds, isFromMoka } = req.body;

  console.log(isFromMoka);

  try {
    // CHECK WHETHER OR NOT THE CARD EXISTS
    const cards = await pool.query(cardQueries.getCardById, [barcode]);

    if (!cards.rows.length)
      return res.render('notificationError', {
        layout: 'layouts/main-layout',
        title: 'Payment Error',
        message: 'Card Not Found',
      });

    if (cards.rows[0].customer_id !== customer_id)
      return res.render('notificationError', {
        layout: 'layouts/main-layout',
        title: 'Payment Error',
        message: 'The Card does not belong to the customer.',
      });

    // FINAL BALANCE CHECK
    const deposit = cards.rows[0].deposit;
    const initial_balance = cards.rows[0].balance;
    const final_balance = initial_balance - parseInt(payment);

    // IF THE BALANCE IS NOT ENOUGH
    if (final_balance < 0)
      return res.render('notificationError', {
        layout: 'layouts/main-layout',
        title: 'Payment Error',
        message: 'Balance Not Enough',
      });

    try {
      // CHECK WHETHER OR NOT THE CREW SUBMITTED CORRECT CREDENTIAL
      const crew = await pool.query(crewQueries.getCrewByCode, [serverCode]);

      if (!crew.rows.length)
        return res.render('notificationError', {
          layout: 'layouts/main-layout',
          title: 'Payment Error',
          message: 'Kode Server SALAH.',
        });

      if (crew.rows.length >= 2) return res.status(500).json('SERVER ERROR');

      let invoice_number = invoiceNumber,
        menu_names = [],
        menu_amount = [],
        menu_prices = [],
        menu_kinds = [],
        menu_discounts = [],
        menu_discount_percents = [];

      // IF THE INVOICE IS NOT FROM MOKA, GENERATE A NEW INVOICE NUMBER AND FILL IN THE MENU
      if (!isFromMoka) {
        invoice_number = `PAY${Date.now()}`;

        menuAmount.split(',').forEach(async (amount, i) => {
          if (amount > 0) {
            const fnbs = await pool.query(fnbQueries.getFnbById, [menuIds.split(',')[i]]);

            if (!fnbs.rows.length) return res.status(404).json('There is a Menu ID that does not exist');

            menu_names.push(fnbs.rows[0].menu);
            menu_amount.push(parseInt(amount));
            menu_prices.push(fnbs.rows[0].price);
            menu_kinds.push(fnbs.rows[0].kind);

            menu_discounts.push(fnbs.rows[0].discount_status);
            menu_discount_percents.push(fnbs.rows[0].discount_percent);
          }
        });
      }

      try {
        // UPDATE CARD'S BALANCE
        const updatedCards = await pool.query(cardQueries.updateBalance, [final_balance, deposit, barcode]);

        // SEND LOG
        infoLog(paymentLogger, 'Card Balance was succesfully updated', updatedCards.rows[0].barcode, updatedCards.rows[0].customer_name, updatedCards.rows[0].customer_id, crew.rows[0].name);

        try {
          // ADD PAYMENT REPORT
          const id = v4();
          const action = 'pay';
          const payment_method = 'None';

          const payments = await pool.query(paymentQueries.addPayment, [
            id,
            action,
            barcode,
            customer_name,
            customer_id,
            parseInt(payment),
            invoice_number,
            invoice_status,
            initial_balance,
            final_balance,
            crew.rows[0].name,
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
          infoLog(paymentLogger, 'Payment was successfully added and invoice number was successfully generated', updatedCards.rows[0].barcode, updatedCards.rows[0].customer_name, updatedCards.rows[0].customer_id, crew.rows[0].name);

          return res.render('notificationSuccessWithBalance', {
            layout: 'layouts/main-layout',
            title: 'Payment Success',
            message: 'Card Payment succeed.',
            data: updatedCards.rows[0],
            invoiceNumber: invoice_number,
            status: 'payment',
            payment: payments.rows[0],
          });
        } catch (error) {
          errorLog(paymentLogger, error, 'Error in HTTP POST / when calling paymentQueries.addPayment');
          return res.render('notificationErrorWithProgress', {
            layout: 'layouts/main-layout',
            title: 'Top-Up Error',
            message: 'Please adjust the card balance before trying again.',
            success: [BALANCE_UPDATE_SUCCESS],
            failed: [PAYMENT_REPORT_FAILED],
          });
        }
      } catch (error) {
        errorLog(paymentLogger, error, 'Error in HTTP POST / when calling cardQueries.updateBalance');
        return res.render('notificationErrorWithProgress', {
          layout: 'layouts/main-layout',
          title: 'Payment Error',
          message: 'Please screenshot the error and contact the developer.',
          success: [],
          failed: [BALANCE_UPDATE_FAILED, PAYMENT_REPORT_FAILED],
        });
      }
    } catch (error) {
      errorLog(paymentLogger, error, 'Error in HTTP POST / when calling crewQueries');
      return res.status(500).json('Server Error');
    }
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP POST / when calling cardQueries.getCardById');
    return res.status(500).json('Server Error');
  }
});

// GET INVOICE
router.get('/invoice/:num', verifyToken, allRoles, (req, res) => {
  const { num } = req.params;

  pool.query(paymentQueries.getInvoice, [num], (error, getInvoiceResults) => {
    if (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /invoice/:num when calling paymentQueries.getInvoice');
      return res.status(500).json('Server Error');
    }

    let paymentSum = 0;

    getInvoiceResults.rows.forEach((getInvoiceResult) => {
      paymentSum += getInvoiceResult.payment;
    });

    return res.render('invoiceSimple', {
      layout: 'layouts/receipt-layout',
      title: 'invoice',
      data: getInvoiceResults.rows,
      paymentSum: paymentSum,
    });
  });
});

// PAYMENT LIST
router.get('/list', verifyToken, allRoles, async (req, res) => {
  let { page, search } = req.query;

  if (!page) {
    page = '1';
  }

  const pageInt = parseInt(page, 10);
  const limit = 50;
  const offset = (pageInt - 1) * limit;

  if (search) {
    try {
      const payments = await pool.query(paymentQueries.getPaymentByCustomerIdOrName, [`%${search.trim().toLowerCase()}%`, limit, offset]);

      payments.rows.forEach((payment) => {
        payment.created_at = convertTZ(payment.created_at, 'Asia/Jakarta');
      });

      return res.render('paymentList', {
        layout: 'layouts/main-layout',
        title: 'Payment List',
        data: payments.rows,
        messages: '',
        alert: '',
        page,
        search,
      });
    } catch (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /list when calling paymentQueries.getPaymentByPaidOff');
      return res.status(500).json('Server Error');
    }
  } else {
    try {
      const payments = await pool.query(paymentQueries.getPayments, [limit, offset]);

      payments.rows.forEach((payment) => {
        payment.created_at = convertTZ(payment.created_at, 'Asia/Jakarta');
      });

      return res.render('paymentList', {
        layout: 'layouts/main-layout',
        title: 'Payment List',
        data: payments.rows,
        messages: '',
        alert: '',
        page,
        search,
      });
    } catch (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /list when calling paymentQueries.getPaymentByPaidOff');
      return res.status(500).json('Server Error');
    }
  }
});

// DELETE PAYMENT
router.get('/:id/delete', verifyToken, cashierAndDeveloper, (req, res) => {
  const { id } = req.params;

  // CHECK WHETHER OR NOT THE PAYMENT EXISTS
  pool.query(paymentQueries.getPaymentById, [id], (error, getResults) => {
    if (error) {
      errorLog(paymentLogger, error, 'Error in HTTP GET /:invoice/delete when calling paymentQueries.getPaymentsByInvoice');
      return res.status(500).json('Server Error');
    }

    if (getResults.rows.length === 0) {
      res.status(404).json('Payment Not Found');
    } else {
      // DELETE THE PAYMENT
      pool.query(paymentQueries.deletePaymentById, [id], (error, deleteResults) => {
        if (error) {
          errorLog(paymentLogger, error, 'Error in HTTP GET /:invoice/delete when calling paymentQueries.deletePaymentByInvoice');
          return res.status(500).json('Server Error');
        }

        // SEND LOG
        infoLog(paymentLogger, 'Payments were successfully deleted', getResults.rows[0].barcode, getResults.rows[0].customer_name, getResults.rows[0].customer_id, req.validUser.name);

        return res.redirect('/payment/list');
      });
    }
  });
});

router.post('/download', async (req, res) => {
  const { archiveFrom, archiveTo } = req.body;

  try {
    const dateArchiveFrom = new Date(archiveFrom);
    const dateArchiveTo = new Date(archiveTo);

    const archiveFromGMTTime = dateArchiveFrom.getTime() - 7 * 60 * 60 * 1000;
    const archiveToGMTTime = dateArchiveTo.getTime() - 7 * 60 * 60 * 1000;

    const dateFrom = new Date(archiveFromGMTTime);
    const dateTo = new Date(archiveToGMTTime);

    const payments = await pool.query(`SELECT * FROM payments WHERE created_at >= $1 AND created_at <= $2`, [dateFrom, dateTo]);
    // console.log(payments.rows);

    payments.rows.forEach((payment) => {
      const createdDate = convertTZ(payment.created_at, 'Asia/Jakarta');
      const updatedDate = convertTZ(payment.updated_at, 'Asia/Jakarta');

      payment.created_at = createdDate.toLocaleString();
      payment.updated_at = updatedDate.toLocaleString();
    });

    const ws = fs.createWriteStream('./public/files/payments_from_yyyy-mm-dd_to_yyyy-mm-dd.csv');

    fastcsv
      .write(payments.rows, { headers: true })
      .on('finish', function () {
        return res.redirect('/public/files/payments_from_yyyy-mm-dd_to_yyyy-mm-dd.csv');
      })
      .pipe(ws);
  } catch (error) {
    return res.status(500).json('server error');
  }
});

router.get('/list/details/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const payments = await pool.query(paymentQueries.getPaymentById, [id]);
    if (!payments.rows.length) return res.status(404).json('Payment Not Found');

    // console.log(payments.rows[0]);

    return res.status(200).json(payments.rows[0]);
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

router.get('/invoices/number/recent', async (req, res) => {
  const { limit, offset } = req.query;

  try {
    const payments = await pool.query(paymentQueries.getPaymentInvoiceNumberMoka, ['pay', null, OpenAndCloseTimeConverter.open(), OpenAndCloseTimeConverter.close(), limit, offset]);
    if (!payments.rows.length) return res.status(404).json('Payment does not exist');

    return payments.rows;
  } catch (error) {
    return res.status(500).json('Server Error');
  }
});

router.post('/list/refund', verifyToken, developerOnly, async (req, res) => {
  const { paymentId, serverCode, notes } = req.body;

  try {
    const crews = await pool.query(crewQueries.getCrewByCode, [serverCode]);

    if (!crews.rows.length)
      return res.render('notificationError', {
        layout: 'layouts/main-layout',
        title: 'Refund Error',
        message: 'Kode Server SALAH.',
      });

    if (crews.rows.length >= 2) return res.status(500).json('SERVER ERROR');

    try {
      const payments = await pool.query(paymentQueries.getPaymentById, [paymentId]);
      if (!payments.rows.length) return res.status(404).json('Payment Not Found');

      try {
        const cards = await pool.query(cardQueries.getCardByIdAndCustomerId, [payments.rows[0].barcode, payments.rows[0].customer_id]);
        if (!cards.rows.length) return res.status(404).json('Card/Customer Not Found or the card belongs to another customer');

        try {
          await pool.query(cardQueries.updateBalance, [cards.rows[0].balance + payments.rows[0].payment, cards.rows[0].deposit, payments.rows[0].barcode]);

          infoLog(paymentLogger, 'Balance was successfully updated', payments.rows[0].barcode, payments.rows[0].customer_name, payments.rows[0].customer_id, crews.rows[0].name);

          try {
            const id = v4();
            const invoiceStatus = 'refund';
            const action = 'refund';
            await pool.query(paymentQueries.addPayment, [
              id,
              action,
              payments.rows[0].barcode,
              payments.rows[0].customer_name,
              payments.rows[0].customer_id,
              -payments.rows[0].payment,
              payments.rows[0].invoice_number,
              invoiceStatus,
              payments.rows[0].final_balance,
              payments.rows[0].initial_balance,
              crews.rows[0].name,
              payments.rows[0].collected_by,
              payments.rows[0].payment_method,
              notes,
              payments.rows[0].menu_names,
              payments.rows[0].menu_amount,
              payments.rows[0].menu_prices,
              payments.rows[0].menu_kinds,
              payments.rows[0].menu_discounts,
              payments.rows[0].menu_discount_percents,
            ]);

            infoLog(paymentLogger, 'Payments were successfully refunded', payments.rows[0].barcode, payments.rows[0].customer_name, payments.rows[0].customer_id, crews.rows[0].name);

            try {
              await pool.query(paymentQueries.updatePaymentStatusById, [invoiceStatus, payments.rows[0].id]);

              infoLog(paymentLogger, 'Payment status was successfully updated', payments.rows[0].barcode, payments.rows[0].customer_name, payments.rows[0].customer_id, crews.rows[0].name);

              return res.redirect('/payment/list');
            } catch (error) {
              errorLog(paymentLogger, error, 'Error in HTTP POST /list/refund when calling paymentQueries.updatePaymentStatusById');
              return res.status(500).json('SERVER ERROR');
            }
          } catch (error) {
            errorLog(paymentLogger, error, 'Error in HTTP POST /list/refund when calling paymentQueries.addPayment');
            return res.status(500).json('SERVER ERROR');
          }
        } catch (error) {
          errorLog(paymentLogger, error, 'Error in HTTP POST /list/refund when calling cardQueries.updateBalance');
          return res.status(500).json('Server Error');
        }
      } catch (error) {
        errorLog(paymentLogger, error, 'Error in HTTP POST /list/refund when calling cardQueries.getCardByIdAndCustomerId');
        return res.status(500).json('Server Error');
      }
    } catch (error) {
      errorLog(paymentLogger, error, 'Error in HTTP POST /list/refund when calling paymentQueries.getPaymentById');
      return res.status(500).json('SERVER ERROR');
    }
  } catch (error) {
    errorLog(paymentLogger, error, 'Error in HTTP POST /list/refund when calling crewQueries.getCrewByCode');
    return res.status(500).json('SERVER ERROR');
  }
});

module.exports = router;
