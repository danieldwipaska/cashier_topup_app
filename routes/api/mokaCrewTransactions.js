const { default: axios } = require('axios');
const { getCrews } = require('./mokaSalesType');
const { getNewAccessToken } = require('./moka');
const pool = require('../../db');
const tokenQueries = require('../../database/tokens/queries');
const { errorLog } = require('../../config/logger/functions');
const { mokaLogger } = require('../../config/logger/childLogger');

async function getCrewTransactions(since, until) {
  try {
    const tokens = await pool.query(tokenQueries.getLatestToken, []);

    const now = Date.now();

    // if (!tokens.rows.length) {
    //   await getFirstAuth();
    // }

    if (tokens.rows[0].expires_at - now < 60 * 60 * 1000) {
      const updatedToken = await getNewAccessToken(tokens.rows[0].refresh_token);

      tokens.rows[0].access_token = updatedToken.rows[0].access_token;
    }

    try {
      const response = await axios.get(`https://api.mokapos.com/v3/outlets/${process.env.MOKA_OUTLET_ID}/reports/get_latest_transactions?since=${since}&until=${until}&per_page=1000`, {
        headers: {
          Authorization: `Bearer ${tokens.rows[0].access_token}`,
        },
      });

      const categories = ['Beer', 'Cocktail', 'Coffee', 'Es Kopi Susu', 'Frappe', 'International Cocktail', 'Milk Based', 'Mineral Water', 'Mixer', 'Mocktail', 'On The Rock', 'Promo', 'Sharing Coktail', 'Soju', 'Specialty Coffee', 'Tea'];
      const otherMenuName = ['Custom Amount'];

      const crews = await getCrews(tokens.rows[0].access_token);
      const allCrewsPurchases = [];

      crews.forEach((crew) => {
        const crewTransactions = response.data.data.payments.filter((transaction) => transaction.checkouts[0].sales_type_name === crew);

        const crewCheckouts = [];
        let totalPurchases = 0;

        // Collect The Checkouts
        crewTransactions.forEach((transaction) => {
          for (let i = 0; i < transaction.checkouts.length; i++) {
            if (categories.includes(transaction.checkouts[i].category_name) || otherMenuName.includes(transaction.checkouts[i].item_name)) crewCheckouts.push(transaction.checkouts[i]);
          }
        });

        // Calculate Purchases
        crewCheckouts.forEach((checkout) => {
          totalPurchases += checkout.total_price - checkout.refunded_quantity * checkout.item_price;
        });

        allCrewsPurchases.push({
          name: crew,
          total_purchases: totalPurchases,
          purchases: crewCheckouts,
        });
      });

      // console.log(allCrewsPurchases);

      return allCrewsPurchases;
    } catch (error) {
      errorLog(mokaLogger, error, 'Error in function getPaymentData() when calling api https://api.mokapos.com/v3/outlets/${process.env.MOKA_OUTLET_ID}/reports/get_latest_transactions?since=${since}&until=${until}&per_page=500');
    }
  } catch (error) {
    errorLog(mokaLogger, error, 'Error in function getPaymentData() when calling tokenQueries.getLatestToken');
  }
}

async function calculateTransactions(since, until) {
  try {
    console.log('start calculate transactions');
    const tokens = await pool.query(tokenQueries.getLatestToken, []);
    console.log(tokens);

    const now = Date.now();

    // if (!tokens.rows.length) {
    //   await getFirstAuth();
    // }

    if (tokens.rows[0].expires_at - now < 60 * 60 * 1000) {
      const updatedToken = await getNewAccessToken(tokens.rows[0].refresh_token);

      tokens.rows[0].access_token = updatedToken.rows[0].access_token;
    }

    try {
      const response = await axios.get(`https://api.mokapos.com/v3/outlets/${process.env.MOKA_OUTLET_ID}/reports/get_latest_transactions?since=${since}&until=${until}&per_page=500`, {
        headers: {
          Authorization: `Bearer ${tokens.rows[0].access_token}`,
        },
      });

      const transactions = response.data.data.payments;
      let totalPurchases = 0;
      let totalRefunds = 0;

      transactions.forEach((transaction) => {
        if (!transaction.is_refunded) {
          totalPurchases += transaction.total_collected;
        } else {
          totalRefunds += transaction.refund_amount;
        }
      });

      return { totalPurchases, totalRefunds };
    } catch (error) {
      errorLog(mokaLogger, error, 'Error in function calculateTransactions() when calling api https://api.mokapos.com/v3/outlets/${process.env.MOKA_OUTLET_ID}/reports/get_latest_transactions?since=${since}&until=${until}&per_page=500');
    }
  } catch (error) {
    errorLog(mokaLogger, error, 'Error in function calculateTransactions() when calling tokenQueries.getLatestToken');
  }
}

module.exports = { getCrewTransactions, calculateTransactions };
