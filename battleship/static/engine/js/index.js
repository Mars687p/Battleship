let themeBtn = document.getElementById('theme-btn');
let labelField = document.getElementsByClassName('label-field');

themeBtn.onclick = change_theme;

function change_theme() {
        themeBtn.classList.toggle('fa-sun');
        themeBtn.classList.toggle('fa-moon');
        if (themeBtn.classList.contains('fa-moon')) {
            document.body.classList.add('whitetheme')
        }
        else {
            document.body.classList.remove('whitetheme')
        };
        for (let element of labelField) {
            element.classList.toggle('whitetheme-txt');
        };
  };