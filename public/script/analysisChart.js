const incomePerHourChart = document.getElementById('incomePerHourChart');

new Chart(incomePerHourChart, {
  type: 'bar',
  data: {
    labels: ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    datasets: [
      {
        label: 'Income/Hour (IDR/Hour)',
        data: [1200000, 1900000, 300000, 500000, 200000, 300000],
        borderWidth: 1,
        backgroundColor: '#9BD0F5',
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

const incomeInHoursChart = document.getElementById('incomeInHoursChart');

new Chart(incomeInHoursChart, {
  type: 'line',
  data: {
    labels: ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    datasets: [
      {
        label: 'Income in an Hour (IDR)',
        data: [1200000, 3100000, 3400000, 3900000, 4100000, 4400000],
        borderWidth: 1,
        backgroundColor: '#FFB1C1',
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

const incomePerDayChart = document.getElementById('incomePerDayChart');

new Chart(incomePerDayChart, {
  type: 'line',
  data: {
    labels: ['2023-01-05', '2023-02-05', '2023-03-05', '2023-04-05', '2023-05-05', '2023-06-05', '2023-07-05', '2023-08-05', '2023-09-05', '2023-10-05', '2023-11-05', '2023-12-05'],
    datasets: [
      {
        axis: 'y',
        label: 'Income/Month (IDR/month)',
        data: [6300000, 5600000, 5500000, 8000000, 4500000, 5000000, 5400000, 5900000, 6500000, 7600000, 4000000, 8100000],
        fill: false,
        backgroundColor: ['rgba(67, 18, 155, 0.2)'],
        borderColor: ['rgb(67, 18, 155)'],
        borderWidth: 0.8,
        trendlineLinear: {
          colorMin: 'red',
          colorMax: 'green',
          lineStyle: 'solid',
          width: 2,
          projection: false,
        },
        // tension: 0.5,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

const incomePerMonthChart = document.getElementById('incomePerMonthChart');

new Chart(incomePerMonthChart, {
  type: 'line',
  data: {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    datasets: [
      {
        axis: 'y',
        label: 'Income/Month (IDR/month)',
        data: [40000000, 59000000, 56000000, 55000000, 45000000, 50000000, 54000000, 63000000, 65000000, 76000000, 80000000, 81000000],
        fill: false,
        backgroundColor: ['rgba(255, 99, 132, 0.2)'],
        borderColor: ['rgb(255, 99, 132)'],
        borderWidth: 0.8,
        trendlineLinear: {
          colorMin: 'red',
          colorMax: 'green',
          lineStyle: 'solid',
          width: 2,
          projection: false,
        },
        // tension: 0.5,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});
