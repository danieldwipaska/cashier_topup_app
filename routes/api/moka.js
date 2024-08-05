const { default: axios } = require('axios');

const { errorLog, infoLog } = require('../../config/logger/functions');
const { mokaLogger } = require('../../config/logger/childLogger');
const pool = require('../../db');
const tokenQueries = require('../../database/tokens/queries');
const { v4 } = require('uuid');

async function getFirstAuth() {
  //GET FIRST ACCESS TOKEN AND REFRESH TOKEN

  try {
    const response = await axios.post('https://api.mokapos.com/oauth/token', {
      client_id: process.env.MOKA_CLIENT_ID,
      client_secret: process.env.MOKA_CLIENT_SECRET_ID,
      code: process.env.MOKA_CODE,
      grant_type: 'authorization_code',
      redirect_uri: 'https://www.google.com',
    });

    try {
      const token_id = v4();
      const accessTokenExpiresAt = Date.now() + response.data.expires_in * 1000;

      await pool.query(tokenQueries.addToken, [token_id, response.data.access_token, response.data.token_type, response.data.expires_in, accessTokenExpiresAt, response.data.scope, response.data.refresh_token]);
    } catch (error) {
      errorLog(mokaLogger, error, 'Error in function getFirstAuth when calling tokenQueries.addToken');
    }
  } catch (error) {
    errorLog(mokaLogger, error, 'Error in function getFirstAuth() when calling axios');
  }
}

async function getNewAccessToken(refreshToken) {
  try {
    const response = await axios.post('https://api.mokapos.com/oauth/token', {
      client_id: process.env.MOKA_CLIENT_ID,
      client_secret: process.env.MOKA_CLIENT_SECRET_ID,
      code: process.env.MOKA_CODE,
      grant_type: 'refresh_token',
      redirect_uri: 'https://www.google.com',
      refresh_token: refreshToken,
    });

    try {
      console.log(response);
      const accessTokenExpiresAt = Date.now() + response.data.expires_in * 1000;

      const updatedToken = await pool.query(tokenQueries.updateToken, [response.data.access_token, response.data.expires_in, accessTokenExpiresAt, response.data.refresh_token, 'bearer']);

      return updatedToken;
    } catch (error) {
      errorLog(mokaLogger, error, 'Error in function getNewAccessToken() when calling tokenQueries.updateToken');
    }
  } catch (error) {
    errorLog(mokaLogger, error, 'Error in function getNewAccessToken() when calling axios');
  }
}

async function getPaymentDataFromMoka(accessToken) {
  try {
    const response = await axios.get(`https://api.mokapos.com/v3/outlets/${process.env.MOKA_OUTLET_ID}/reports/get_latest_transactions`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    errorLog(mokaLogger, error, 'Error in function getPaymentData() when calling axios');
  }
}

async function getPaymentData() {
  try {
    const tokens = await pool.query(tokenQueries.getLatestToken, []);

    const now = Date.now();

    if (!tokens.rows.length) {
      console.log('hello')
      await getFirstAuth();
    }

    if (tokens.rows[0].expires_at - now < 60 * 60 * 1000) {
      const updatedToken = await getNewAccessToken(tokens.rows[0].refresh_token);

      tokens.rows[0].access_token = updatedToken.rows[0].access_token;
    }

    const data = await getPaymentDataFromMoka(tokens.rows[0].access_token);
    return data;
  } catch (error) {
    errorLog(mokaLogger, error, 'Error in function getPaymentData() when calling tokenQueries.getLatestToken');
  }
}

module.exports = {
  getPaymentData,
  getNewAccessToken,
};
