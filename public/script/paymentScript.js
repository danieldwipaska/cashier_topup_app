const inputMoka = document.querySelector('#inputMoka');
const mokaInvoice = document.querySelector('#mokaInvoice');
const appInvoice = document.querySelector('#appInvoice');
const invoiceNumberMoka = mokaInvoice.querySelector('#invoiceNumber');
const paymentMoka = mokaInvoice.querySelector('#payment');
const paymentShownApp = appInvoice.querySelector('#paymentShown');
const paymentApp = appInvoice.querySelector('#payment');
const menuAmount = document.querySelector('#menuAmount');
const menuIds = document.querySelector('#menuIds');

inputMoka.addEventListener('click', () => {
  appInvoice.classList.toggle('visually-hidden');
  paymentShownApp.toggleAttribute('disabled');
  paymentApp.toggleAttribute('disabled');
  menuAmount.toggleAttribute('disabled');
  menuIds.toggleAttribute('disabled');

  mokaInvoice.classList.toggle('visually-hidden');
  invoiceNumberMoka.toggleAttribute('disabled');
  paymentMoka.toggleAttribute('disabled');
});

const menus = document.querySelectorAll('.menu');

// MENU NAMES, AMOUNT, PRICES, AND PAYMENT DECLARATION
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
    menuAmount.value = allMenuAmount;

    // TOTAL PAYMENT CALCULATION
    let amountTimesPrices = 0;
    allMenuAmount.forEach((amount, i) => {
      amountTimesPrices += amount * allMenuPrices[i];
    });

    // WRITE THE RESULT TO TOTAL PAYMENT
    payment = amountTimesPrices;

    // OVERWRITE HTML PAYMENT INPUT BY payment
    paymentApp.value = payment;
    paymentShownApp.value = Intl.NumberFormat('en-US').format(payment);
  });
});

// ADD INITIAL VALUE TO FORM INPUTS
menuAmount.value = allMenuAmount;
menuIds.value = allMenuIds;
paymentApp.value = payment;
paymentShownApp.value = Intl.NumberFormat('en-US').format(payment);
