async function getMokaInvoices() {
  // const mokaData = document.querySelector('.moka-data');
  // mokaData.innerHTML = 'halo';

  try {
    const response = await axios.get('http://localhost:3000/thirdparty/moka');

    const mokaData = document.querySelector('.moka-data');

    let dataString = '';

    response.data.data.payments.forEach((element, i) => {
      dataString += `<button type="button" class="btn btn-light shadow text-start p-3" id="${i}"><strong>${element.payment_no}</strong>&emsp;&emsp;Customer: <strong>${element.customer_name}</strong>&emsp;&emsp;IDR${Intl.NumberFormat(
        'en-US'
      ).format(element.total_collected)} &emsp;&emsp;Served By: <strong>${element.checkouts[0].sales_type_name}</strong></button>`;

      dataCollection.push(element);
    });

    mokaData.innerHTML = dataString;
  } catch (error) {
    mokaData.innerHTML = `${error}`;
  }
}

let dataCollection = [];

getMokaInvoices();
