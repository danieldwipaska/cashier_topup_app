const { default: axios } = require('axios');

async function getCrews(accessToken) {
  try {
    const result = [];

    const response = await axios.get(`https://api.mokapos.com/v1/outlets/${process.env.MOKA_OUTLET_ID}/sales_type`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    response.data.data.results.forEach((salesType) => {
      result.push(salesType.name);
    });

    return result;
  } catch (error) {
    errorLog(mokaLogger, error, 'Error in function getPaymentData() when calling api https://api.mokapos.com/v1/outlets/${process.env.MOKA_OUTLET_ID}/sales_type');
  }
}

module.exports = { getCrews };
