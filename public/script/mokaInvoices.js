async function getMokaInvoices() {
  // const mokaData = document.querySelector('.moka-data');
  // mokaData.innerHTML = 'halo';

  try {
    const response = await axios.get('https://api.mokapos.com/v3/outlets/852790/reports/get_latest_transactions?per_page=10', {
      headers: {
        Authorization: `Bearer 222d530bc728e9732f6bae6a19deb784f02cfe1ae3f55cdd6dd0a13ae31b1951`,
      },
    });

    const mokaData = document.querySelector('.moka-data');

    let dataString = '';

    response.data.data.payments.forEach((element, i) => {
      dataString += `<button type="button" class="btn btn-light shadow text-start p-3" id="${i}">${element.payment_no}&emsp;&emsp;${element.customer_name}&emsp;&emsp;IDR${Intl.NumberFormat('en-US').format(element.subtotal)}</button>`;

      dataCollection.push(element);
    });

    mokaData.innerHTML = dataString;
  } catch (error) {
    mokaData.innerHTML = `${error}`;
  }
}

let dataCollection = [];

getMokaInvoices();
