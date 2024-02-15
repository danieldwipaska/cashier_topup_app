// add balance number-currency format
const addBalanceInput = document.querySelector('#addBalanceInput');
const barcodeInput = document.querySelector('#barcodeInput');
const customerNameInput = document.querySelector('#customerNameInput');
const customerIdInput = document.querySelector('#customerIdInput');
const depositInput = document.querySelector('#depositInput');
const paymentMethodInput = document.querySelector('#paymentMethodInput');
const notesInput = document.querySelector('#notesInput');
const addBalance = document.querySelector('#addBalance');

const cleave = new Cleave('.input-element', {
  numeral: true,
  numeralThousandsGroupStyle: 'thousand',
  onValueChanged: function (e) {
    // e.target = { value: '5100-1234', rawValue: '51001234' }
    addBalance.value = e.target.rawValue;
  },
});

// input processing before sent
const topUpButton = document.querySelector('.top-up-button');

// Confirmed inputs
const modal = document.querySelector('.modal');
const barcode = modal.querySelector('#barcode');
const deposit = modal.querySelector('#deposit');
const customerName = modal.querySelector('#customerName');
const customerId = modal.querySelector('#customerId');
const paymentMethod = modal.querySelector('#paymentMethod');
const notes = modal.querySelector('#notes');

// displayed confirmed inputs
const addBalanceDisplay = modal.querySelector('#addBalanceDisplay');
const depositDisplay = modal.querySelector('#depositDisplay');
const customerNameDisplay = modal.querySelector('#customerNameDisplay');
const customerIdDisplay = modal.querySelector('#customerIdDisplay');
const paymentMethodDisplay = modal.querySelector('#paymentMethodDisplay');
const notesDisplay = modal.querySelector('#notesDisplay');
const subTotalDisplay = modal.querySelector('#subtotalDisplay');
const totalDisplay = modal.querySelector('#totalDisplay');

const confirmTopupButton = modal.querySelector('.confirm-topup-button');

topUpButton.addEventListener('click', () => {
  console.log('----------- Input Values -----------');
  console.log('barcode', barcodeInput.value);
  console.log('add balance', addBalanceInput.value);
  console.log('deposit', depositInput.value);
  console.log('customer name', customerNameInput.value);
  console.log('customer id', customerIdInput.value);
  console.log('payment method', paymentMethodInput.value);
  console.log('notes', notesInput.value);
  console.log('----------- Confirmed Values -----------');
  console.log('barcode', barcode.value);
  console.log('add balance', addBalance.value);
  console.log('deposit', deposit.value);
  console.log('customer name', customerName.value);
  console.log('customer id', customerId.value);
  console.log('payment method', paymentMethod.value);
  console.log('notes', notes.value);

  confirmTopupButton.removeAttribute('disabled');

  barcode.value = barcodeInput.value;

  deposit.value = depositInput.value;

  addBalanceDisplay.innerHTML = addBalanceInput.value;

  customerName.value = customerNameInput.value;
  customerNameDisplay.innerHTML = customerNameInput.value;

  customerId.value = customerIdInput.value;
  customerIdDisplay.innerHTML = customerIdInput.value;

  paymentMethod.value = paymentMethodInput.value;
  paymentMethodDisplay.innerHTML = paymentMethodInput.value;

  notes.value = notesInput.value;
  notesDisplay.innerHTML = notesInput.value;

  subTotalDisplay.innerHTML = addBalanceInput.value;
  totalDisplay.innerHTML = addBalanceInput.value;

  addBalanceDisplay.classList.remove('text-danger');
  customerNameDisplay.classList.remove('text-danger');
  customerIdDisplay.classList.remove('text-danger');
  paymentMethodDisplay.classList.remove('text-danger');

  if (!addBalance.value || addBalance.value === '0') {
    addBalanceDisplay.innerHTML = 'Required';
    addBalanceDisplay.classList.add('text-danger');
    confirmTopupButton.setAttribute('disabled', 'disabled');
  }
  if (!customerName.value) {
    customerNameDisplay.innerHTML = 'Required';
    customerNameDisplay.classList.add('text-danger');
    confirmTopupButton.setAttribute('disabled', 'disabled');
  }
  if (!customerId.value) {
    customerIdDisplay.innerHTML = 'Required';
    customerIdDisplay.classList.add('text-danger');
    confirmTopupButton.setAttribute('disabled', 'disabled');
  }
  if (!paymentMethod.value) {
    paymentMethodDisplay.innerHTML = 'Required';
    paymentMethodDisplay.classList.add('text-danger');
    confirmTopupButton.setAttribute('disabled', 'disabled');
  }
});
