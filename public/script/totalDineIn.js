setInterval(() => {
  refreshDineIn();
}, 1000);

async function refreshDineIn() {
  const dineInReport = document.querySelector('.dine-in-report');
  try {
    const response = await fetch('http://localhost:3000/api/dinein/calculation');
    const data = await response.json();
    dineInReport.innerHTML = data;
  } catch (err) {
    dineInReport.innerHTML = 'error';
  }
}

refreshDineIn();
