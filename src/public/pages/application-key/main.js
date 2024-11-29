$(document).ready(function ($) {
  let btnCopy = document.getElementById('copy')
  let btnReveal = document.getElementById('reveal')
  let iconSpan = document.querySelector('#reveal span')
  let inpApikey = document.getElementById('inpApikey')

  btnCopy.addEventListener('click', () => {
    let inpTmp = document.createElement('input')
    inpTmp.value = inpApikey.value;

    try {
      document.body.appendChild(inpTmp)
      window.getSelection().removeAllRanges();

      inpTmp.select();

      document.execCommand('copy');

      window.getSelection().removeAllRanges();

      document.body.removeChild(inpTmp)
    } catch (err) {
      console.log(`ERROR COPY: ${err}`);
    }
  })

  btnReveal.addEventListener('click', () => {
    try {
      let inpType = inpApikey.getAttribute('type');
      let attrType = '';

      if (inpType == 'text') {
        attrType = 'password';
        iconSpan.classList.remove('glyphicon-eye-close');
        iconSpan.classList.add('glyphicon-eye-open');
      } else {
        attrType = 'text';
        iconSpan.classList.remove('glyphicon-eye-open');
        iconSpan.classList.add('glyphicon-eye-close');
      }

      inpApikey.setAttribute('type', attrType);
    } catch (err) {
      console.log(`ERROR REVEAL: ${err}`)
    }
  })
});
