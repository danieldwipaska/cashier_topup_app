async function getMokaInvoices() {
  // const mokaData = document.querySelector('.moka-data');
  const mokaData = document.querySelector('.moka-data');
  mokaData.innerHTML = `<div class="d-flex justify-content-center">
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
</div>`;

  try {
    const response = await axios.get('https://baharimalangirishpub-app.com/thirdparty/moka');

    let dataString = '';

    console.log(response);

    response.data.payments.forEach((element, i) => {
      const date = new Date(element.created_at);
      const dateString = date.toLocaleString();
      dataString += `<button type="button" class="btn btn-light shadow text-start p-3" id="${i}"><small>${dateString}</small>&emsp;&emsp;<strong>${element.payment_no}</strong>&emsp;&emsp;Customer: <strong>${
        element.customer_name
      }</strong>&emsp;&emsp;IDR${Intl.NumberFormat('en-US').format(element.total_collected)} &emsp;&emsp;Served By: <strong>${element.checkouts[0].sales_type_name}</strong></button>`;

      dataCollection.push(element);
    });

    mokaData.innerHTML = dataString;
  } catch (error) {
    mokaData.innerHTML = `${error}`;
  }
}

let dataCollection = [];

getMokaInvoices();
