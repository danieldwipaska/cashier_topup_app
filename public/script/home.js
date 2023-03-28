var deleteLinks = document.querySelectorAll('.delete-button');

for (let i = 0; i < deleteLinks.length; i++) {
  deleteLinks[i].addEventListener('click', function (event) {
    event.preventDefault();

    let choice = confirm(this.getAttribute('data-confirm'));

    if (choice) {
      window.location.href = this.getAttribute('href');
    }
  });
}
