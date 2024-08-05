// async function getMokaInvoicesWithColorChange() {
//   // const mokaData = document.querySelector('.moka-data');
//   const mokaData = document.querySelector('.moka-data');
//   mokaData.innerHTML = `<div class="d-flex justify-content-center">
//   <div class="spinner-border text-primary" role="status">
//     <span class="visually-hidden">Loading...</span>
//   </div>
// </div>`;

//   try {
//     const response = await axios.get('https://baharimalangirishpub-app.com/thirdparty/moka');

//     let dataString = '';

//     let paymentData = [];

//     try {
//       const resps = await axios.get('https://baharimalangirishpub-app.com/invoices/number/recent');
//       resps.data.forEach((paymentInvoiceNumber) => {
//         paymentData.push(paymentInvoiceNumber.invoice_number);
//       });
//     } catch (error) {
//       console.log(error);
//     }

//     response.data.data.payments.forEach((element, i) => {
//       const date = new Date(element.created_at);
//       const dateString = date.toLocaleString();

//       if (paymentData.includes(element.payment_no)) {
//         dataString += `<button type="button" class="btn btn-secondary text-start p-3" id="${i}"><small>${dateString}</small>&emsp;&emsp;${element.payment_no}&emsp;&emsp;IDR${Intl.NumberFormat('en-US').format(
//           element.total_collected
//         )} &emsp;&emsp;Served By: ${element.checkouts[0].sales_type_name}</button>`;
//       } else {
//         dataString += `<button type="button" class="btn btn-light shadow text-start p-3" id="${i}"><small>${dateString}</small>&emsp;&emsp;${element.payment_no}&emsp;&emsp;IDR${Intl.NumberFormat('en-US').format(
//           element.total_collected
//         )} &emsp;&emsp;Served By: ${element.checkouts[0].sales_type_name}</button>`;
//       }

//       dataCollection.push(element);
//     });

//     mokaData.innerHTML = dataString;
//   } catch (error) {
//     mokaData.innerHTML = `${error}`;
//   }
// }

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
    console.log(response)

    let dataString = '';

    response.data.data.payments.forEach((element, i) => {
      const date = new Date(element.created_at);
      const dateString = date.toLocaleString();
      dataString += `<button type="button" class="btn btn-light shadow text-start p-3" id="${i}"><small>${dateString}</small>&emsp;&emsp;${element.payment_no}&emsp;&emsp;IDR${Intl.NumberFormat('en-US').format(
        element.total_collected
      )} &emsp;&emsp;Served By: ${element.checkouts[0].sales_type_name}</button>`;

      dataCollection.push(element);
    });

    mokaData.innerHTML = dataString;
  } catch (error) {
    mokaData.innerHTML = `${error}`;
  }
}

let dataCollection = [];

getMokaInvoices();
