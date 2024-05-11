const mokaInvoice = document.querySelector('#mokaInvoice');
const appInvoice = document.querySelector('#appInvoice');
const paymentMokaInput = mokaInvoice.querySelector('#paymentInput');
const paymentShownInput = appInvoice.querySelector('#paymentShownInput');
const paymentAppInput = appInvoice.querySelector('#paymentInput');

const confirmPaymentButton = document.querySelector('.confirm-payment-button');
const orderList = document.querySelector('.order-list');

const barcodeInput = document.querySelector('#barcodeInput');
const customerNameInput = document.querySelector('#customerNameInput');
const customerIdInput = document.querySelector('#customerIdInput');
const balanceInputNumber = document.querySelector('#balanceInputNumber');
const invoiceNumberMokaInput = mokaInvoice.querySelector('#invoiceNumberInput');
const menuAmountInput = document.querySelector('#menuAmountInput');
const menuIdsInput = document.querySelector('#menuIdsInput');
const isFromMokaInput = document.querySelector('#isFromMokaInput');

const modal = document.querySelector('.modal');
const barcode = modal.querySelector('#barcode');
const customerName = modal.querySelector('#customerName');
const customerId = modal.querySelector('#customerId');
const confirmedPayment = modal.querySelector('#confirmedPayment');
const invoiceNumber = modal.querySelector('#invoiceNumber');
const menuAmount = modal.querySelector('#menuAmount');
const menuIds = modal.querySelector('#menuIds');
const inputMoka = modal.querySelector('#inputMoka');
const isFromMoka = modal.querySelector('#isFromMoka');

const submitPaymentButton = modal.querySelector('.submit-payment-button');

const customerNameDisplay = modal.querySelector('#customerNameDisplay');
const customerIdDisplay = modal.querySelector('#customerIdDisplay');
const subTotalDisplay = modal.querySelector('#subtotalDisplay');
const totalDisplay = modal.querySelector('#totalDisplay');

isFromMokaInput.addEventListener('click', () => {
  appInvoice.classList.toggle('visually-hidden');
  paymentShownInput.toggleAttribute('disabled');
  paymentAppInput.toggleAttribute('disabled');
  menuAmountInput.toggleAttribute('disabled');
  menuIdsInput.toggleAttribute('disabled');

  mokaInvoice.classList.toggle('visually-hidden');
  invoiceNumberMokaInput.toggleAttribute('disabled');
  paymentMokaInput.toggleAttribute('disabled');
});

const menus = document.querySelectorAll('.menu');

// MENU NAMES, AMOUNT, PRICES, AND PAYMENT DECLARATION
const allMenuNames = [];
const allMenuKinds = [];
const allMenuPrices = [];
const allMenuAmount = [];
const allMenuIds = [];
let payment = 0;

// MAPPING FOR allMenuNames, allMenuAmount, and allMenuPrices
menus.forEach((menu) => {
  const inputAmount = menu.querySelector('input');
  const menuName = menu.querySelector('.menu-name');
  const menuPrice = menu.querySelector('.menu-price');
  const menuKind = menu.querySelector('.menu-kind');
  const menuId = menu.querySelector('.menu-id');

  // INITIAL AMOUNT FROM AMOUNT INPUT
  let count = parseInt(inputAmount.value);

  // PUSH INITIAL MENU DATA TO allMenuNames, allMenuAmount, and allMenuPrices
  allMenuNames.push(menuName.innerHTML);
  allMenuKinds.push(menuKind.innerHTML);
  allMenuPrices.push(menuPrice.innerHTML); // REQUIRED PURE NUMBER (NOT IN U.S. CURRENCY FORMAT)
  allMenuAmount.push(0);
  allMenuIds.push(menuId.innerHTML);

  // CLICKING EVENT (+) AND (-) TO OVERWRITE allMenuNames, allMenuAmount, allMenuPrices, and payment
  menu.addEventListener('click', (element) => {
    // IF CLICKING (+) OR (-)
    if (element.target.className.includes('positive')) {
      // INCREASE count
      count++;
    } else if (element.target.className.includes('negative')) {
      // AVOIDING NEGATIVE NUMBER
      if (count > 0) {
        // DECREASE count
        count--;
      }
    }

    if (count > 0) {
      menu.classList.add('bg-info');
    } else {
      menu.classList.remove('bg-info');
    }

    // DISPLAY count IN HTML
    inputAmount.value = count;

    // CHANGE allMenuAmount WITH NEW count
    allMenuAmount[allMenuIds.indexOf(menuId.innerHTML)] = count;
    // OVERWRITE HTML AMOUNT INPUT BY NEW allMenuAmount
    menuAmountInput.value = allMenuAmount;

    // TOTAL PAYMENT CALCULATION
    let amountTimesPrices = 0;
    allMenuAmount.forEach((amount, i) => {
      amountTimesPrices += amount * allMenuPrices[i];
    });

    // WRITE THE RESULT TO TOTAL PAYMENT
    payment = amountTimesPrices;

    // OVERWRITE HTML PAYMENT INPUT BY payment
    paymentAppInput.value = payment;
    paymentShownInput.value = Intl.NumberFormat('en-US').format(payment);
  });
});

// ADD INITIAL VALUE TO FORM INPUTS
menuAmountInput.value = allMenuAmount;
menuIdsInput.value = allMenuIds;
paymentAppInput.value = payment;
paymentShownInput.value = Intl.NumberFormat('en-US').format(payment);

// CONFIRM PAYMENT BUTTON
confirmPaymentButton.addEventListener('click', () => {
  barcode.value = barcodeInput.value;
  customerName.value = customerNameInput.value;
  customerId.value = customerIdInput.value;
  invoiceNumber.value = invoiceNumberMokaInput.value;
  menuAmount.value = menuAmountInput.value;
  menuIds.value = menuIdsInput.value;
  inputMoka.checked = isFromMokaInput.checked;
  isFromMoka.checked = isFromMokaInput.checked;

  customerNameDisplay.innerHTML = customerName.value;
  customerIdDisplay.innerHTML = customerId.value;

  let orderListString = '';
  if (isFromMokaInput.checked) {
    isFromMoka.value = 'true';
    confirmedPayment.value = paymentMokaInput.value;
    subTotalDisplay.innerHTML = Intl.NumberFormat('en-US').format(paymentMokaInput.value);
    totalDisplay.innerHTML = Intl.NumberFormat('en-US').format(paymentMokaInput.value);

    orderListString = `<div class="px-5 d-flex align-items-center justify-content-between">
    <div class="d-flex">
      <p class="mb-0 fs-6 fw-normal">${invoiceNumber.value}</p>
    </div>
    <div class="d-flex">
      <p class="mb-0 fs-6 fw-normal">IDR</p>
      <p class="mb-0 mx-2 fs-6 fw-normal">${Intl.NumberFormat('en-US').format(paymentMokaInput.value)}</p>
    </div>
  </div>`;

    console.log(typeof +balanceInputNumber.value, +balanceInputNumber.value);
    // Verify Balance and Total Payment
    if (+balanceInputNumber.value < +paymentMokaInput.value || +paymentMokaInput.value === 0) {
      submitPaymentButton.setAttribute('disabled', 'disabled');
    } else {
      submitPaymentButton.removeAttribute('disabled');
    }
  } else {
    isFromMoka.value = '';
    confirmedPayment.value = paymentAppInput.value;
    subTotalDisplay.innerHTML = Intl.NumberFormat('en-US').format(payment);
    totalDisplay.innerHTML = Intl.NumberFormat('en-US').format(payment);

    allMenuAmount.forEach((amount, i) => {
      if (amount > 0) {
        orderListString += `<div class="px-5 d-flex align-items-center justify-content-between">
        <div class="d-flex">
          <p class="mb-0 fs-6 fw-normal">${allMenuNames[i]}</p>
          <p class="mb-0 fs-6 fw-normal mx-1">(${allMenuKinds[i]})</p>
          <p class="mb-0 mx-2 fs-6 fw-normal">x</p>
          <p class="mb-0 fs-6 fw-normal">${allMenuAmount[i]}</p>
        </div>
        <div class="d-flex">
          <p class="mb-0 fs-6 fw-normal">IDR</p>
          <p class="mb-0 mx-2 fs-6 fw-normal">${Intl.NumberFormat('en-US').format(allMenuPrices[i])}</p>
        </div>
      </div>`;
      }
    });

    // Verify Balance and Total Payment
    if (+balanceInputNumber.value < +paymentAppInput.value || +paymentAppInput.value === 0) {
      submitPaymentButton.setAttribute('disabled', 'disabled');
    } else {
      submitPaymentButton.removeAttribute('disabled');
    }
  }

  orderList.innerHTML = orderListString;
});
