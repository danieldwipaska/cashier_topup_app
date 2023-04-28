setInterval(() => {
  refreshDineIn();
}, 1000);

async function refreshDineIn() {
  const dineInReport = document.querySelector('.dine-in-report');
  try {
    const response1 = await fetch('http://192.168.69.15:3000/api/dinein/calculation');
    const data1 = await response1.json();
    dineInReport.innerHTML = data1;
  } catch (err) {
    try {
      const response2 = await fetch('http://localhost:3000/api/dinein/calculation');
      const data2 = await response2.json();
      dineInReport.innerHTML = data2;
    } catch (error) {
      dineInReport.innerHTML = 'error';
    }
  }
}

refreshDineIn();
