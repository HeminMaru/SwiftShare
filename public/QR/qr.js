
import { QRByte, Encoder, ErrorCorrectionLevel } from '@nuintun/qrcode';

let title;
let qrData;
let correctionLevel = ErrorCorrectionLevel.L;

function close() {
  isModalOpen = false;
}

let isModalOpen = false;

const qrcode = new Encoder({
  encodingHint: true,
  errorCorrectionLevel: correctionLevel,
  version: 0 
})
  .write(
    new QRByte(qrData, data => {
      const bytes = data.split('').map(char => char.charCodeAt(0));

      return {
        bytes: bytes,
        encoding: 27 
      };
    })
  )
  .make();

document.querySelector('qr-modal').addEventListener('click', function () {
  isModalOpen = !isModalOpen;
});

const modalToggle = document.getElementById('qr-modal');
modalToggle.addEventListener('change', function () {
  isModalOpen = modalToggle.checked;
});

document.querySelector('qr-modal').addEventListener('click', function (event) {
  event.stopPropagation();
});
