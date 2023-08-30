const mokaData = document.querySelector('.moka-data');

mokaData.addEventListener('click', (event) => {
  const invoiceNumber = document.querySelector('#invoiceNumber');
  const collectedBy = document.querySelector('#collectedBy');
  const payment = document.querySelector('#payment');
  const notification = document.querySelector('#notificationPopup');

  invoiceNumber.value = dataCollection[event.target.id].payment_no;
  collectedBy.value = dataCollection[event.target.id].collected_by;
  payment.value = dataCollection[event.target.id].total_collected;

  mokaData.childNodes.forEach((e) => {
    e.classList.remove('border');
    e.classList.remove('border-3');
    e.classList.remove('border-dark');
  });

  event.target.classList.add('border');
  event.target.classList.add('border-3');
  event.target.classList.add('border-dark');

  //   notification.innerHTML = `<div class="toast align-items-center" role="alert" aria-live="assertive" aria-atomic="true">
  //   <div class="d-flex">
  //     <div class="toast-body text-success">
  //       Invoice Applied!
  //     </div>
  //     <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
  //   </div>
  // </div>`;
  //   setTimeout(() => {
  //     notification.innerHTML = null;
  //   }, 5000);
});
