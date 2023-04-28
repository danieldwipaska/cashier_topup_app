const confirmLinks = document.querySelectorAll('.confirm-button');

for (let i = 0; i < confirmLinks.length; i++) {
  confirmLinks[i].addEventListener('click', function (event) {
    event.preventDefault();

    let choice = confirm(this.getAttribute('data-confirm'));

    if (choice) {
      window.location.href = this.getAttribute('href');
    }
  });
}
